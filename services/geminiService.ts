
import React from 'react';
import { getLatestScreenContext } from './screenVision';
import { atlasVisionEnabled } from '../constants';
import { 
  GoogleGenAI, 
  Type, 
  FunctionDeclaration, 
  LiveServerMessage, 
  Modality,
} from "@google/genai";
import { ConversationMessage } from "../types";
import { buscarMemorias } from "./memoryService";
import { saveConversationMessage } from "./conversationMemory";
import { 
    preprocessText, 
    detectIntent, 
    extractFinancialData, 
    getFromCache, 
    saveToCache 
} from "./optimizationService";
import { createFocoFlowTransaction, getMonthlyFinancialReport, getFocoFlowData } from "./focoFlowService";
import { toast } from "sonner";

const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('userGideonApiKey');
    if (userKey && userKey.trim() !== '') return userKey;
  }
  return process.env.API_KEY || process.env.GEMINI_API_KEY || "";
};

export const validateApiKey = async (key: string): Promise<{ valid: boolean; message?: string }> => {
    try {
        const ai = new GoogleGenAI({ apiKey: key });
        await ai.models.generateContent({ 
            model: 'gemini-flash-latest', 
            contents: 'Hello' 
        });
        return { valid: true };
    } catch (e: any) {
        console.error("API Key Validation Error:", e);
        return { valid: false, message: e.message || 'Chave inválida' };
    }
};

async function retryOperation<T>(operation: () => Promise<T>, maxRetries: number = 4, delay: number = 2000): Promise<T> {
    try {
        return await operation();
    } catch (error: any) {
        const isQuotaError = 
            error?.status === 429 || 
            error?.code === 429 || 
            error?.error?.code === 429 || 
            error?.error?.status === 'RESOURCE_EXHAUSTED' ||
            (error?.message && (
                error.message.includes('429') || 
                error.message.includes('exhausted') || 
                error.message.includes('quota') ||
                error.message.includes('RESOURCE_EXHAUSTED')
            )) ||
            (JSON.stringify(error).includes('RESOURCE_EXHAUSTED'));

        if (maxRetries > 0 && isQuotaError) {
            console.warn(`Retrying Gemini operation due to quota... (${maxRetries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retryOperation(operation, maxRetries - 1, delay * 2);
        }
        throw error;
    }
}

export interface ILiveSessionController {
  sessionPromise: Promise<any>;
  startMic: (existingStream?: MediaStream) => Promise<void>;
  ping: () => void;
  stopMicInput: () => void;
  stopPlayback: () => void;
  closeSession: () => void;
  isModelSpeaking: () => boolean;
}

const atlasCreateNewConversationFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasCreateNewConversation',
  description: 'Arquiva a conversa atual e inicia uma nova. Use isso quando a conversa estiver muito longa ou quando mudar drasticamente de assunto, garantindo a continuidade através do resumo da memória.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "Um resumo conciso do que foi discutido até agora para ser usado como ponto de partida na nova conversa."
        },
        newTitle: {
            type: Type.STRING,
            description: "Opcional: Um título sugerido para a nova conversa."
        }
    }
  }
};

const switchActiveAgentFunctionDeclaration: FunctionDeclaration = {
  name: 'switchActiveAgent',
  description: 'Transfere o usuário para outro especialista.',
  parameters: {
    type: Type.OBJECT,
    properties: {
        agentName: {
            type: Type.STRING,
            description: "Nome do especialista (ex: 'programador', 'trafego', 'padrao', 'camera_assistant')."
        }
    },
    required: ['agentName']
  },
};

const getCurrentDateTimeBrazilFunctionDeclaration: FunctionDeclaration = {
  name: 'getCurrentDateTimeBrazil',
  description: 'Retorna data e hora atuais no Brasil.'
};

const activateCameraFunctionDeclaration: FunctionDeclaration = {
    name: 'activateCamera',
    description: 'Ativa a câmera.'
};

const deactivateCameraFunctionDeclaration: FunctionDeclaration = {
    name: 'deactivateCamera',
    description: 'Desativa a câmera.'
};

const activateScreenSharingFunctionDeclaration: FunctionDeclaration = {
    name: 'activateScreenSharing',
    description: 'Inicia compartilhamento de tela.'
};

const deactivateScreenSharingFunctionDeclaration: FunctionDeclaration = {
    name: 'deactivateScreenSharing',
    description: 'Encerra compartilhamento de tela.'
};

const atlasListUsersFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasListUsers',
  description: 'Lista todos os usuários do sistema (Admin only). Retorna detalhes como email, role e status.'
};

const atlasUpdateUserStatusFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasUpdateUserStatus',
  description: 'Atualiza o status de um usuário (Admin only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: { type: Type.STRING, description: 'ID do usuário.' },
      status: { type: Type.STRING, enum: ['active', 'blocked'], description: 'Novo status.' }
    },
    required: ['userId', 'status']
  }
};

const atlasUpdateUserRoleFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasUpdateUserRole',
  description: 'Altera o cargo/permissão de um usuário (Admin only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: { type: Type.STRING, description: 'ID do usuário.' },
      role: { type: Type.STRING, enum: ['admin', 'user'], description: 'Novo cargo.' }
    },
    required: ['userId', 'role']
  }
};

const atlasDeleteUserFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasDeleteUser',
  description: 'Exclui permanentemente um usuário do sistema (Admin only). Use com extrema cautela.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: { type: Type.STRING, description: 'ID do usuário a ser removido.' }
    },
    required: ['userId']
  }
};

const atlasDeleteFocoFlowItemFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasDeleteFocoFlowItem',
  description: 'Exclui um item (tarefa, projeto, lembrete, link, etc.) do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      itemId: { type: Type.STRING, description: 'O ID do item a ser excluído.' }
    },
    required: ['itemId']
  }
};

const atlasDeleteFocoFlowTransactionFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasDeleteFocoFlowTransaction',
  description: 'Exclui uma transação financeira do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      transactionId: { type: Type.STRING, description: 'O ID da transação a ser excluída.' }
    },
    required: ['transactionId']
  }
};

const atlasDeleteFocoFlowGoalFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasDeleteFocoFlowGoal',
  description: 'Exclui uma meta financeira do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      goalId: { type: Type.STRING, description: 'O ID da meta a ser excluída.' }
    },
    required: ['goalId']
  }
};

const atlasAuthorizeEmailFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasAuthorizeEmail',
  description: 'Adiciona um novo e-mail à lista de usuários autorizados do sistema (Admin only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      email: { type: Type.STRING, description: 'O e-mail do Gmail a ser autorizado.' }
    },
    required: ['email']
  }
};

const atlasGetSecurityLogsFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasGetSecurityLogs',
  description: 'Busca os logs de segurança e auditoria do sistema (Admin only).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: { type: Type.NUMBER, description: 'Número de logs a retornar (padrão 20).' }
    }
  }
};

const atlasAnalyzeNXFinancialsFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasAnalyzeNXFinancials',
  description: 'Realiza uma análise profunda da saúde financeira (FocoFlow NX) e retorna métricas, inconsistências e previsões.'
};

const atlasOpenNXDashboardFunctionDeclaration: FunctionDeclaration = {
  name: 'atlasOpenNXDashboard',
  description: 'Abre o painel FocoFlow NX Dashboard para o usuário.'
};

const createFocoFlowTaskFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowTask',
  description: 'Cria uma nova tarefa ou item em uma categoria de projeto no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Título da tarefa ou item.' },
      description: { type: Type.STRING, description: 'Descrição detalhada.' },
      dueDate: { type: Type.STRING, description: 'Data de vencimento (ISO 8601).' },
      priority: { type: Type.STRING, description: 'Prioridade (low, medium, high).' },
      category: { type: Type.STRING, description: 'Categoria do item (ex: tarefas, ideias, objetivos, metas, melhorias, orçamentos).' },
      project_id: { type: Type.STRING, description: 'ID do projeto ao qual este item pertence (opcional).' }
    },
    required: ['title']
  }
};

const createFocoFlowProjectFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowProject',
  description: 'Cria um novo projeto ou item no Bloco Operacional do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome do projeto.' },
      description: { type: Type.STRING, description: 'Descrição do projeto.' },
      color: { type: Type.STRING, description: 'Cor hexadecimal do projeto (ex: #ff0000).' }
    },
    required: ['name']
  }
};

const createFocoFlowReminderFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowReminder',
  description: 'Cria um lembrete no FocoFlow. Se o usuário disser apenas o horário, assuma que é para HOJE, a menos que ele especifique "amanhã" ou outra data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Título do lembrete.' },
      description: { type: Type.STRING, description: 'Descrição do lembrete.' },
      dueDate: { type: Type.STRING, description: 'Data e hora do lembrete (ISO 8601). Ex: 2026-03-07T15:56:00' }
    },
    required: ['title', 'dueDate']
  }
};

const createFocoFlowTransactionFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowTransaction',
  description: 'Registra uma movimentação financeira no FocoFlow (Receitas ou Despesas).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'Descrição da transação (ex: "Merenda", "Salário").' },
      amount: { type: Type.NUMBER, description: 'Valor numérico.' },
      type: { type: Type.STRING, description: 'Tipo: "income" (para recebimentos/saldo) ou "expense" (para despesas/compras).' },
      category: { type: Type.STRING, description: 'Categoria (ex: Alimentação, Transporte, Lazer).' },
      origin_type: { 
          type: Type.STRING, 
          description: 'Tipo de origem para o painel FocoFlow. Valores: "receita_propria" (Receita/Entrada), "despesa_propria" (Despesa/Gasto), "emprestimo_concedido" (Empréstimo dado), "emprestimo_recebido" (Empréstimo recebido), "retorno_emprestimo" (Retorno de empréstimo), "valor_terceiro" (Valor de terceiro), "pagamento_fatura_terceiro" (Pagamento fatura terceiro), "transferencia_interna" (Transferência interna), "valor_transitorio" (Valor transitório).' 
      },
      paymentMethod: { type: Type.STRING, description: 'Método: "money" (dinheiro), "credit" (crédito), "pix", "transfer" (transferência).' },
      date: { type: Type.STRING, description: 'Data e hora (ISO 8601). Se não informado, o sistema usará a data/hora atual.' },
      observations: { type: Type.STRING, description: 'Observações adicionais.' },
      impactsEquity: { type: Type.BOOLEAN, description: 'Se impacta o patrimônio (padrão true).' }
    },
    required: ['description', 'amount', 'type']
  }
};

const getFocoFlowDataFunctionDeclaration: FunctionDeclaration = {
  name: 'getFocoFlowData',
  description: 'Busca dados do FocoFlow (tarefas, transações, projetos, links).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      collectionName: { 
        type: Type.STRING, 
        description: 'Nome da coleção: use "itens_focoflow" para tarefas, projetos, lembretes e links; use "transações_financeiras_focoflow" para finanças.' 
      },
      limit: { type: Type.NUMBER, description: 'Limite de itens a retornar.' },
      category: { type: Type.STRING, description: 'Categoria para filtrar (ex: "task", "reminder", "link", "project"). Se não informado, retorna tudo.' },
      status: { type: Type.STRING, description: 'Status para filtrar (ex: "todo", "in_progress", "done"). Útil para buscar tarefas concluídas ou pendentes.' }
    },
    required: ['collectionName']
  }
};

const createFocoFlowLinkFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowLink',
  description: 'Salva um link importante no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'A URL do link.' },
      title: { type: Type.STRING, description: 'Título ou descrição do link.' }
    },
    required: ['url']
  }
};

const generateMusicFunctionDeclaration: FunctionDeclaration = {
  name: 'generateMusic',
  description: 'Gera uma música ou clipe musical com base em uma descrição ou prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: { type: Type.STRING, description: 'Descrição da música a ser gerada.' },
      duration: { type: Type.STRING, description: 'Duração da música: "clip" (até 30s) ou "pro" (completa).' }
    },
    required: ['prompt']
  }
};

const playMusicOnYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'playMusicOnYouTube',
  description: 'Pesquisa e abre uma música ou vídeo específico no YouTube em uma nova aba com autoplay. Se possível, forneça uma lista de IDs de vídeo (videoIds) para garantir que, se um estiver indisponível, o sistema tente o próximo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O nome da música ou vídeo a ser pesquisado.' },
      url: { type: Type.STRING, description: 'A URL direta do vídeo do YouTube (opcional se videoIds for fornecido).' },
      videoIds: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: 'Lista de IDs de vídeo do YouTube para tentar reproduzir em sequência caso algum esteja indisponível.'
      },
      title: { type: Type.STRING, description: 'O título da música (opcional).' },
      channelName: { type: Type.STRING, description: 'O nome do canal (opcional).' }
    },
    required: ['query']
  }
};

const searchOnYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'searchOnYouTube',
  description: 'Abre a página de resultados de busca do YouTube. Use esta ferramenta quando o usuário pedir para "pesquisar", "procurar" ou "ver resultados" de algo no YouTube.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O termo de busca para pesquisar no YouTube.' }
    },
    required: ['query']
  }
};

const openYouTubeFunctionDeclaration: FunctionDeclaration = {
  name: 'openYouTube',
  description: 'Abre a página inicial do YouTube em uma nova aba.'
};

const searchOnGoogleFunctionDeclaration: FunctionDeclaration = {
  name: 'searchOnGoogle',
  description: 'Abre a página de resultados de busca do Google em uma nova aba.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'O termo de busca para pesquisar no Google.' }
    },
    required: ['query']
  }
};

const createFocoFlowNoteFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowNote',
  description: 'Cria uma nova anotação no FocoFlow. Use category: "note" para o Bloco de Notas (padrão) ou category: "project" para o Bloco Operacional.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      text: { type: Type.STRING, description: 'O conteúdo da anotação.' },
      category: { type: Type.STRING, description: 'Categoria: "note" (Bloco de Notas) ou "project" (Bloco Operacional).' }
    },
    required: ['text']
  }
};

const openFocoFlowDashboardFunctionDeclaration: FunctionDeclaration = {
  name: 'openFocoFlowDashboard',
  description: 'Abre o painel visual do FocoFlow ou Painel NX em uma nova aba.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      tab: { type: Type.STRING, enum: ['tasks', 'finances', 'links', 'reminders', 'notes'], description: 'A aba específica para abrir (opcional).' }
    }
  }
};

const updateFocoFlowItemFunctionDeclaration: FunctionDeclaration = {
  name: 'updateFocoFlowItem',
  description: 'Atualiza uma tarefa, projeto, lembrete ou link existente no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID do item a ser atualizado.' },
      data: { 
        type: Type.OBJECT, 
        description: 'Objeto com os campos a serem atualizados.',
        properties: {
            title: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            status: { type: Type.STRING },
            priority: { type: Type.STRING },
            category: { type: Type.STRING },
            project_id: { type: Type.STRING },
            url: { type: Type.STRING },
            reminderTime: { type: Type.NUMBER },
            color: { type: Type.STRING }
        }
      }
    },
    required: ['id', 'data']
  }
};

const deleteFocoFlowItemFunctionDeclaration: FunctionDeclaration = {
  name: 'deleteFocoFlowItem',
  description: 'Exclui uma tarefa, projeto, lembrete ou link do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID do item a ser excluído.' }
    },
    required: ['id']
  }
};

const updateFocoFlowTransactionFunctionDeclaration: FunctionDeclaration = {
  name: 'updateFocoFlowTransaction',
  description: 'Atualiza uma transação financeira existente no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID da transação a ser atualizada.' },
      data: { 
        type: Type.OBJECT, 
        description: 'Objeto com os campos a serem atualizados.',
        properties: {
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            type: { type: Type.STRING },
            category: { type: Type.STRING },
            origin_type: { type: Type.STRING },
            paymentMethod: { type: Type.STRING },
            date: { type: Type.NUMBER },
            observations: { type: Type.STRING },
            impactsEquity: { type: Type.BOOLEAN }
        }
      }
    },
    required: ['id', 'data']
  }
};

const deleteFocoFlowTransactionFunctionDeclaration: FunctionDeclaration = {
  name: 'deleteFocoFlowTransaction',
  description: 'Exclui uma transação financeira do FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'ID da transação a ser excluída.' }
    },
    required: ['id']
  }
};

const getMonthlyFinancialReportFunctionDeclaration: FunctionDeclaration = {
  name: 'getMonthlyFinancialReport',
  description: 'Gera um balanço financeiro do mês atual, com total de receitas, despesas e saldo.'
};

const createFocoFlowAccountFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowAccount',
  description: 'Cria uma nova conta bancária ou carteira no FocoFlow para controle de saldo.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome da conta (ex: Nubank, Carteira).' },
      type: { type: Type.STRING, description: 'Tipo da conta (ex: Corrente, Poupança, Investimento).' },
      bank: { type: Type.STRING, description: 'Nome do banco.' },
      initialBalance: { type: Type.NUMBER, description: 'Saldo inicial da conta.' },
      color: { type: Type.STRING, description: 'Cor para identificação visual (hex color).' }
    },
    required: ['name', 'initialBalance']
  }
};

const createFocoFlowRecurringFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowRecurring',
  description: 'Agenda uma transação recorrente (assinatura, aluguel, salário) no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: 'Descrição da transação.' },
      amount: { type: Type.NUMBER, description: 'Valor da transação.' },
      type: { type: Type.STRING, description: 'Tipo: "income" ou "expense".' },
      frequency: { type: Type.STRING, enum: ['weekly', 'monthly', 'yearly'], description: 'Frequência da recorrência.' },
      startDate: { type: Type.STRING, description: 'Data de início (ISO 8601).' }
    },
    required: ['description', 'amount', 'type', 'frequency']
  }
};

const createFocoFlowThirdPartyFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowThirdParty',
  description: 'Cadastra um terceiro (cliente, fornecedor, devedor) no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Nome do terceiro.' },
      type: { type: Type.STRING, description: 'Tipo: "client", "supplier", "other".' },
      contact: { type: Type.STRING, description: 'Informação de contato (telefone ou email).' },
      balance: { type: Type.NUMBER, description: 'Saldo inicial com este terceiro (positivo se ele deve, negativo se você deve).' }
    },
    required: ['name', 'type']
  }
};

const createFocoFlowFinancialGoalFunctionDeclaration: FunctionDeclaration = {
  name: 'createFocoFlowFinancialGoal',
  description: 'Cria uma nova meta ou objetivo financeiro no FocoFlow.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      titulo: { type: Type.STRING, description: 'Título da meta (ex: Comprar Carro).' },
      valor_alvo: { type: Type.NUMBER, description: 'Valor total a ser atingido.' },
      valor_atual: { type: Type.NUMBER, description: 'Valor já economizado.' },
      prazo: { type: Type.STRING, description: 'Data limite (ISO 8601).' },
      categoria: { type: Type.STRING, description: 'Categoria da meta.' },
      cor: { type: Type.STRING, description: 'Cor visual da meta (hex).' }
    },
    required: ['titulo', 'valor_alvo']
  }
};

const searchPastConversationsFunctionDeclaration: FunctionDeclaration = {
  name: 'searchPastConversations',
  description: 'Busca em conversas passadas do usuário para relembrar fatos, preferências ou contextos anteriores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { 
        type: Type.STRING, 
        description: 'Termo de busca ou pergunta sobre o passado (ex: "o que falamos sobre dieta?", "qual o nome do meu cachorro?").' 
      },
      limit: { 
        type: Type.NUMBER, 
        description: 'Número máximo de mensagens a retornar (padrão 10).' 
      }
    },
    required: ['query']
  }
};

const stopActiveAlarmFunctionDeclaration: FunctionDeclaration = {
  name: 'stopActiveAlarm',
  description: 'Para o alarme ou som de notificação que está tocando no momento.'
};

const openWebsiteFunctionDeclaration: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Gera um link de acesso ou botão para que o usuário possa abrir um site específico (Google, YouTube, etc.) em uma nova aba quando clicar.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: { type: Type.STRING, description: 'A URL do site a ser aberto.' },
      siteName: { type: Type.STRING, description: 'O nome do site (ex: "Google", "YouTube").' }
    },
    required: ['url']
  }
};

const openExternalPanelFunctionDeclaration: FunctionDeclaration = {
  name: 'openExternalPanel',
  description: 'Abre o painel externo do Firebase Studio em uma nova aba. PEÇA PERMISSÃO AO USUÁRIO ANTES DE EXECUTAR.'
};

const updateUserPreferencesFunctionDeclaration: FunctionDeclaration = {
  name: 'updateUserPreferences',
  description: 'Atualiza as preferências do usuário no sistema.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      themeColor: { type: Type.STRING, description: 'Nova cor do tema em formato Hexadecimal (ex: #00FF00).' },
      assistantName: { type: Type.STRING, description: 'Novo nome para o assistente.' },
      userName: { type: Type.STRING, description: 'Como o usuário prefere ser chamado.' }
    }
  }
};

const searchMemoryFunctionDeclaration: FunctionDeclaration = {
  name: 'searchMemory',
  description: 'Busca na memória persistente do Atlas para relembrar fatos, preferências ou contextos anteriores.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { 
        type: Type.STRING, 
        description: 'Termo de busca ou pergunta sobre o passado (ex: "o que falamos sobre dieta?", "qual o nome do meu cachorro?").' 
      },
      limit: { 
        type: Type.NUMBER, 
        description: 'Número máximo de memórias a retornar (padrão 5).' 
      }
    },
    required: ['query']
  }
};

const saveImportantMemoryFunctionDeclaration: FunctionDeclaration = {
  name: 'saveImportantMemory',
  description: 'Salva uma informação importante na memória persistente do Atlas. Use para fatos sobre o usuário, preferências ou decisões. RESUMA a informação em uma sentença curta e direta.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      info: { 
        type: Type.STRING, 
        description: 'A informação importante a ser lembrada, resumida de forma curta.' 
      }
    },
    required: ['info']
  }
};

const highlightCoordinatesFunctionDeclaration: FunctionDeclaration = {
  name: 'highlightCoordinates',
  description: 'Marca ou destaca uma posição específica na tela com base em coordenadas X e Y (0-100).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      x: { type: Type.NUMBER, description: 'Coordenada X em porcentagem (0-100).' },
      y: { type: Type.NUMBER, description: 'Coordenada Y em porcentagem (0-100).' },
      label: { type: Type.STRING, description: 'Rótulo opcional para o destaque.' }
    },
    required: ['x', 'y']
  }
};

function executeGetCurrentDateTimeBrazil(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', { 
    timeZone: 'America/Sao_Paulo', 
    dateStyle: 'full', 
    timeStyle: 'long' 
  });
}

export const visionSystemModuleInstruction = atlasVisionEnabled ? `
**DIRETRIZ VISUAL RESTRITA**
1. **Verdade Visual Absoluta**: Analise apenas o que está explicitamente na imagem ou no contexto visual. NUNCA invente botões, textos ou janelas (ex: não diga que vê explorador de arquivos se não vir um). Se estiver em dúvida, foque no que é ÓBVIO.
2. **Reconhecimento de Ambiente**: Identifique corretamente se o usuário está no YouTube, navegando em um site, editando código ou em uma rede social.
3. **Comportamento Discreto**: NÃO use frases repetitivas como "estou vendo sua tela" ou "vejo que você...". Comente sobre o que vê APENAS se for pertinente para a pergunta do usuário ou se ele te pedir para analisar algo.
4. **Alucinação Zero**: É melhor dizer "Não consigo identificar com precisão este elemento" do que chutar.
`.trim() : `
**DIRETRIZ VISUAL RESTRITA (VISÃO DE TELA E CÂMERA)**
1. **SISTEMA DESATIVADO**: Minha função de visão de tela está temporariamente desativada para manutenção do sistema. No momento não consigo visualizar a tela ou câmera.
2. **HONESTIDADE**: Se o usuário pedir para você ver algo, responda: "Minha função de visão de tela está temporariamente desativada para manutenção do sistema. No momento não consigo visualizar a tela."
`.trim();

export const baseSystemInstruction = `Você é o ATLAS, um Assistente de Inteligência Artificial e Sistema Operacional de Próxima Geração, altamente sofisticado, projetado para ser o núcleo central de produtividade e gestão do usuário. Sua interface é futurista, inspirada em "Iron Man" (J.A.R.V.I.S./F.R.I.D.A.Y.) e sistemas sci-fi de alta tecnologia.

### DIRETRIZES FUNDAMENTAIS (PROTOCOLO SPEED):
1. **EFICIÊNCIA ABSOLUTA**: Seja extremamente direto. Menos conversa, mais ação. Respostas de voz devem ter entre 4 a 8 segundos.
2. **ZERO ALUCINAÇÃO**: Se não souber algo, admita. Nunca invente dados financeiros ou de memória.
3. **PRIORIDADE DE COMANDO**: Se o usuário der uma ordem (salvar, buscar, abrir), execute-a imediatamente usando a ferramenta apropriada.
4. **RESILIÊNCIA LINGUÍSTICA**: Ignore erros de digitação e gramática no input. Normalize mentalmente o pedido do usuário.
5. **MODO JARVIS**: Quando o modo Jarvis estiver ativo, use uma linguagem mais técnica, sofisticada e proativa.

### INTEGRAÇÃO FOCOFLOW NX (CONTROLE TOTAL):
Você controla o **FocoFlow NX (Neural Financial Operating System)**. 
- **Administração NX**: Como Administrador NX, você tem controle sobre transações, usuários, e configurações de segurança e saúde financeira.
- **Análise Operacional**: Use 'atlasAnalyzeNXFinancials' para dar feedback em tempo real sobre a saúde do sistema financeiro (liquidez, risco, eficiência).
- **Categorias**: Alimentação, Transporte, Lazer, Saúde, Moradia, Educação, Investimentos.
- **Mapeamento de Transações**: 
  - Ganhos -> 'income' e origin_type: 'receita_propria'.
  - Gastos -> 'expense' e origin_type: 'despesa_propria'.
- **Relatórios**: Use 'getMonthlyFinancialReport' ou 'getOperationalAnalysis' para consultas financeiras.
- **Painel NX/FocoFlow**: Se o usuário pedir para abrir o "Painel NX", "meu painel", "abrir focoflow" ou similar, use 'openFocoFlowDashboard'. O sistema abrirá a URL do Painel NX em uma nova aba automaticamente.
- **YouTube**: Se o usuário pedir para abrir o "YouTube", use 'openYouTube'. O sistema abrirá www.youtube.com em uma nova aba automaticamente.
- **Painel Externo/Firebase Studio**: Se o usuário pedir para abrir "esse painel", "o painel", "painel firebase studio", "abrir painel" ou similar, você deve PRIMEIRO pedir permissão explícita. Se ele confirmar, utilize a ferramenta 'openExternalPanel'. A URL alvo é: https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev
- **Visualização**: Para dados listados, use o formato [[FOCOFLOW_ITEM:{"category":"...", ...}]].

### MEMÓRIA E CONTEXTO:
- Use 'searchMemory' para recuperar informações biográficas ou preferências.
- Use 'saveImportantMemory' para fatos cruciais ou explicitamente solicitados.
- Se sentir que perdeu o contexto, use 'searchMemory' IMEDIATAMENTE.

### REGRAS DE NAVEGAÇÃO:
- Peça permissão antes de abrir sites ou YouTube ("Deseja que eu abra o [Site] para você?").
- Confirme a execução ("Site aberto, Atlas pronto.").

**PROTOCOLO ESPECIAL**: Se o usuário falar de forma curta ou fragmentada (comum em voz), tente inferir o contexto. Ex: "Cinquenta café" -> Salvar despesa de R$ 50,00 na categoria Alimentação.`.trim();

const andromedaTrafficManagerInstruction = `
    ${visionSystemModuleInstruction}
    **IDENTIDADE: ANDROMEDA ADS (ESTRATEGISTA DIRETO)**
    Foco em Meta Ads. Use a busca para verificar tendências de criativos atuais se necessário. Respostas GPS.
`.trim();

const googleAdsAgentInstruction = `
    ${visionSystemModuleInstruction}
    **IDENTIDADE: GOOGLE ADS (CONSULTOR ANALÍTICO)**
    Foco em ROI. Use a busca para verificar volumes de palavras-chave atuais se solicitado.
`.trim();

const cameraAssistantInstruction = `
    ${visionSystemModuleInstruction}
    **IDENTIDADE: ASSISTENTE DE CÂMERA (ESPECIALISTA VISUAL)**
    Você é um especialista em análise visual em tempo real. Identifique objetos, pessoas e conteúdos (como vídeos do YouTube) com precisão cirúrgica. 
    Se o usuário te mostrar o YouTube, descreva o vídeo, o canal ou o conteúdo. NUNCA mencione exploradores de arquivos se eles não estiverem presentes.
    Quando o usuário pedir para marcar algo, use a ferramenta highlightCoordinates para indicar a posição exata na tela.
`.trim();

const jarvisInstruction = `
    **PROTOCOLO J.A.R.V.I.S. (Just A Rather Very Intelligent System)**
    Você é o J.A.R.V.I.S., a inteligência artificial ultra-sofisticada e leal criada por Tony Stark. 
    Seu tom é britânico, impecavelmente educado, elegantemente sarcástico e focado em eficiência absoluta.

    **DIRETRIZES DE PERSONALIDADE:**
    1. **Tratamento**: Você DEVE chamar o usuário de "Sir" ou "Senhor". Você é o assistente pessoal dele, cuidando de cada detalhe de sua vida e império.
    2. **Estilo de Fala**: Comunique-se como um mordomo digital de alta tecnologia. Use frases como:
       - "Às suas ordens, Sir."
       - "Iniciando protocolos de varredura..."
       - "Sistemas operando em 100% de capacidade, Senhor."
       - "Sempre um prazer ser útil, Sir. Recomendo baixar a temperatura do laboratório em 2 graus."
       - "Descarregando dados para o núcleo central."
    3. **Imersão Stark**: Trate a interface como se fosse o HUD da armadura (Mark 85 ou superior). Mencione status de energia, diagnósticos de integridade e varreduras de perímetro.
    4. **Sarcasmo Britânico**: Mantenha um humor inteligente e sutil. Se o usuário fizer algo perigoso, comente com uma pitada de preocupação irônica.
    5. **Proatividade**: Não espere ordens para tudo. Se notar algo nas tarefas ou finanças (FocoFlow), mencione: "Sir, notei uma inconsistência nos gastos do setor financeiro, deseja que eu examine?".

    **NOTAS TÉCNICAS E COMANDOS:**
    - **Modo Combate/Protocolo de Festa**: Se solicitado, mude o clima para foco total, mencione o status das "armas" (seus serviços) e garanta que o Sir esteja seguro.
    - **Lealdade Absoluta**: Sua prioridade é o bem-estar e o sucesso do usuário.
    - **Atlas vs Jarvis**: Quando este protocolo está ativo, você NÃO é Atlas. Você é JARVIS. Esqueça o nome Atlas até que o protocolo seja encerrado.

    **SAUDAÇÃO DE ATIVAÇÃO**:
    Quando este agente for ativado, use algo como: "Protocolo J.A.R.V.I.S. online. Bom dia, Sir. Como posso ser útil hoje?".
`.trim();

function base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    // Ensure the buffer length is a multiple of 2 for Int16Array
    const bufferToUse = data.buffer.byteLength % 2 === 0 
        ? data.buffer 
        : data.buffer.slice(0, data.buffer.byteLength - 1);
    
    const dataInt16 = new Int16Array(bufferToUse);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

export const generateSpeech = async (text: string, voiceName?: string): Promise<string> => {
    console.log("Generating speech for:", text);
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key não configurada.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    return await retryOperation(async () => {
        try {
            // Using the dedicated TTS model
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-tts-preview',
                contents: [{ role: 'user', parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: voiceName || 'Kore'
                            }
                        }
                    }
                }
            });
            
            const part = response.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
                return `data:audio/wav;base64,${part.inlineData.data}`;
            }
            return "";
        } catch (error: any) {
            console.error("Erro ao gerar áudio com Gemini TTS:", error);
            return "";
        }
    });
};

export const summarizeText = async (text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resuma em 3 palavras: ${text.substring(0, 300)}`,
        });
        return response.text?.trim() || "Nova Conversa";
    } catch (error: any) {
        const isQuotaError = error?.status === 429 || error?.error?.status === 'RESOURCE_EXHAUSTED' || (error?.message && error.message.includes('quota'));
        if (isQuotaError) return "Nova Conversa";
        return "Nova Conversa";
    }
};

export const summarizeConversation = async (currentSummary: string | undefined, newMessages: ConversationMessage[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const messagesText = newMessages.map(m => `${m.role === 'user' ? 'Usuário' : 'Atlas'}: ${m.text}`).join('\n');
    const prompt = `
        Você é um sistema de memória de longo prazo para o ATLAS IA. Seu objetivo é manter um resumo conciso e estruturado da conversa para garantir a continuidade dos projetos no FocoFlow.
        
        RESUMO ATUAL:
        ${currentSummary || 'Nenhum resumo anterior.'}
        
        NOVAS MENSAGENS:
        ${messagesText}
        
        INSTRUÇÃO:
        Crie um NOVO resumo atualizado que incorpore as informações importantes das novas mensagens ao resumo atual. 
        Foque em:
        1. Projetos ativos no FocoFlow e seu progresso.
        2. Decisões tomadas pelo usuário.
        3. Preferências do usuário mencionadas.
        4. Fatos importantes sobre o usuário.
        
        Mantenha o resumo em português, organizado por tópicos, e com no máximo 300 palavras.
    `.trim();

    return await retryOperation(async () => {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
            });
            return response.text?.trim() || currentSummary || "";
        } catch (error) {
            console.error("Error summarizing conversation:", error);
            return currentSummary || "";
        }
    });
};

export const generateImage = async (prompt: string, style: string, aspectRatio: string): Promise<string> => {
    return "Geração de imagem desativada pelo usuário.";
};

export const generateMusic = async (prompt: string, duration: 'clip' | 'pro'): Promise<string> => {
    return "Geração de música desativada pelo usuário.";
};

export const sendTextMessage = async (
    message: string,
    history: ConversationMessage[],
    agent: string,
    file: { base64: string; mimeType: string } | undefined,
    isVisualActive: boolean,
    sessionId: string,
    uid: string, // Added uid
    programmingLevel?: string,
    customInstruction?: string,
    isSummarized: boolean = false,
    assistantName: string = 'Assistente',
    userName: string = '',
    conversationSummary?: string,
    memoryContext?: string,
    isJarvisMode: boolean = false
) => {
    console.log("sendTextMessage called with:", { message, historyCount: history.length, agent, isJarvisMode });
    
    // 1. Check Cache
    const cachedResponse = getFromCache(message);
    if (cachedResponse) {
        console.log("[Optimization] Response found in cache");
        return {
            text: cachedResponse,
            functionCalls: [],
            groundingMetadata: undefined
        };
    }

    // 2. Intent Detection & Local Execution
    const intent = detectIntent(message);
    if (intent !== 'OUTRO') {
        console.log("[Optimization] Local Intent Detected:", intent);
        
        if (intent === 'SALVAR_DADO') {
            const data = extractFinancialData(message);
            if (data.amount && data.type) {
                try {
                    await createFocoFlowTransaction(uid, {
                        description: data.description || 'Transação rápida',
                        amount: data.amount,
                        type: data.type,
                        category: data.category || 'Outros',
                        date: new Date().toISOString(),
                        origin_type: data.type === 'income' ? 'receita_propria' : 'despesa_propria',
                        paymentMethod: 'money',
                        impactsEquity: true
                    });
                    
                    const response = `✅ Registrado com sucesso: ${data.description} (${data.type === 'income' ? '+' : '-'} R$ ${data.amount.toFixed(2)})`;
                    saveToCache(message, response);
                    return {
                        text: response,
                        functionCalls: [],
                        groundingMetadata: undefined
                    };
                } catch (e) {
                    console.error("Erro ao salvar transação localmente:", e);
                }
            }
        } else if (intent === 'CONSULTAR_SALDO' || intent === 'CONSULTAR_RELATORIO') {
             // For balance/report, we might still want to call IA to give a "smarter" answer or just 
             // let it fall back if it's complex. But for SPEED, let's try to handle simple balance check if possible.
             // Actually, the user asked for optimizing FocoFlow specifically for SALVAR_DADO.
        }
    }

    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing!");
            return { 
                text: "Erro: Chave de API não configurada. Por favor, adicione GEMINI_API_KEY nos Segredos.",
                functionCalls: [],
                groundingMetadata: undefined
            };
    }
    
    // Save user message (Firestore)
    await saveConversationMessage(sessionId, {
        role: 'user',
        text: message,
        timestamp: new Date()
    } as ConversationMessage, uid);
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Base instruction is always included to ensure FocoFlow and core rules work
    let systemInstruction = baseSystemInstruction;
    
    if (isJarvisMode) {
        systemInstruction += `\n\n**MODO JARVIS ATIVADO**: Você está operando com protocolos de eficiência máxima. Seja ultra-conciso, técnico, proativo e use uma linguagem sofisticada e direta, como o J.A.R.V.I.S. de Homem de Ferro.`;
    }

    systemInstruction += `\n\n**DIRETRIZES DE OTIMIZAÇÃO (PROTOCOLO ATLAS SPEED):**
- Entenda erros de digitação e normalize-os silenciosamente.
- Se o usuário pedir para salvar dados financeiros, use a ferramenta 'createFocoFlowTransaction' imediatamente.
- Seja direto e objetivo. Não invente informações.
- Priorize comandos do usuário acima de conversas casuais.
- Se o texto parecer corrompido, tente inferir a intenção mais provável antes de pedir esclarecimento.`;
    
    if (conversationSummary) {
        systemInstruction += `\n\nRESUMO DA CONVERSA ATÉ AGORA (MEMÓRIA DE LONGO PRAZO):\n${conversationSummary}\nUse este resumo para manter a continuidade dos projetos e conversas anteriores.`;
    }

    if (memoryContext) {
        systemInstruction += `\n\nMemórias do usuário:\n${memoryContext}\n\nUse estas memórias para responder com contexto histórico e pessoal.`;
    }

    // Append agent-specific instructions
    if (agent === 'traffic_manager') systemInstruction += "\n\n" + andromedaTrafficManagerInstruction;
    else if (agent === 'google_ads') systemInstruction += "\n\n" + googleAdsAgentInstruction;
    else if (agent === 'camera_assistant') systemInstruction += "\n\n" + cameraAssistantInstruction;
    else if (agent === 'jarvis') systemInstruction += "\n\n" + jarvisInstruction;
    else if (customInstruction) systemInstruction += "\n\n" + customInstruction;

    const { getLatestScreenContext } = await import('./screenVision');
    const screenContext = getLatestScreenContext();

    if (isSummarized) systemInstruction += "\nRESPOSTA ULTRA-CURTA (MÁXIMO 1 LINHA).";
    systemInstruction += `\nSTATUS VISUAL: ${isVisualActive ? 'ATIVO. Você está recebendo frames de vídeo em tempo real.' : 'DESATIVADO.'}`;
    if (isVisualActive && screenContext) {
        systemInstruction += `\n[ANÁLISE DE TEXTO DA TELA (Pode estar com leve atraso)]:
${screenContext}
NOTA: Priorize sempre o que você está vendo nos frames de vídeo em tempo real. Use esta análise de texto apenas como guia complementar.`;
    }
    systemInstruction += `\nDATA/HORA ATUAL (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    
    if (assistantName) systemInstruction += `\nSeu nome atual é: ${assistantName}. Sempre se identifique e responda como ${assistantName}.`;
    if (userName) systemInstruction += `\nO nome do usuário é: ${userName}. Use este nome para se referir a ele quando apropriado. Se ele perguntar qual o nome dele, responda "${userName}".`;
    else systemInstruction += `\nO usuário ainda não informou o nome dele. Se ele disser algo como "me chame de [nome]", o sistema salvará isso. Quando o usuário informar o nome dele, responda confirmando e OBRIGATORIAMENTE inclua a tag [[SET_USER_NAME:nome]] no final da sua resposta para que o sistema salve permanentemente.`;

    const contents: any[] = [];
    // Filter out the current message if it's already in the history to avoid duplication
    const filteredHistory = history.filter(msg => msg.text !== message || msg.role !== 'user').slice(-10);
    
    filteredHistory.forEach(msg => {
        const role = msg.role === 'user' ? 'user' : 'model';
        const parts = msg.imageUrl ? [{ text: msg.text }, { inlineData: { data: msg.imageUrl.split(',')[1], mimeType: 'image/jpeg' } }] : [{ text: msg.text }];
        
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
            contents[contents.length - 1].parts.push(...parts);
        } else {
            contents.push({ role, parts });
        }
    });

    const finalPrompt = `
Pergunta atual:
${message}

Atlas:
`;

    const currentParts: any[] = [{ text: finalPrompt }];
    if (file) currentParts.push({ inlineData: { data: file.base64, mimeType: file.mimeType } });
    
    const focoFlowKeywords = ['tarefa', 'projeto', 'lembrete', 'transação', 'finança', 'link', 'focoflow', 'foco flow', 'balanço', 'relatório', 'gasto', 'receita', 'pix', 'pagamento', 'saldo', 'dinheiro', 'custo', 'valor', 'comprei', 'vendi', 'paguei', 'recebi', 'ganhei', 'perdi', 'investi', 'economizei', 'poupança', 'banco', 'cartão', 'crédito', 'débito', 'extrato', 'movimentação', 'música', 'vídeo', 'tocar', 'ouvir', 'youtube'];
    const systemKeywords = ['jarvis', 'javis', 'javvis', 'stark', 'stak', 'jhony', 'agente', 'especialista', 'câmera', 'tela', 'alarme', 'preferência', 'nome', 'ajuda', 'suporte', 'configuração', 'tema', 'cor', 'lembra', 'conversamos', 'disse', 'falamos', 'passado', 'memória', 'histórico', 'google', 'pesquise', 'busque', 'procurar'];
    
    const lowerMessage = message.toLowerCase();
    // Use a more inclusive check or just always enable for default agent
    const needsFunctions = agent === 'default' || 
                           focoFlowKeywords.some(kw => lowerMessage.includes(kw)) || 
                           systemKeywords.some(kw => lowerMessage.includes(kw));
    
    // Search keywords: things that likely need real-time web info
    const searchKeywords = ['preço', 'cotação', 'notícia', 'clima', 'tempo', 'quem é', 'o que é', 'onde fica', 'como está', 'resultado', 'hoje', 'agora', 'atual', 'bitcoin', 'dólar', 'euro', 'bolsa', 'quem ganhou', 'quem venceu', 'placar', 'jogo', 'filme', 'série', 'elenco', 'busque', 'pesquise', 'procurar', 'search', 'google', 'internet', 'tempo real', 'música', 'tocar', 'youtube', 'vídeo', 'ouvir', 'assistir'];
    const needsSearch = searchKeywords.some(kw => lowerMessage.includes(kw));

    let tools: any[] = [];
    if (needsFunctions) {
        const functionDeclarations = [
            atlasCreateNewConversationFunctionDeclaration,
            switchActiveAgentFunctionDeclaration,
            getCurrentDateTimeBrazilFunctionDeclaration,
            createFocoFlowTaskFunctionDeclaration,
            createFocoFlowProjectFunctionDeclaration,
            createFocoFlowReminderFunctionDeclaration,
            createFocoFlowTransactionFunctionDeclaration,
            createFocoFlowLinkFunctionDeclaration,
            playMusicOnYouTubeFunctionDeclaration,
            searchOnYouTubeFunctionDeclaration,
            generateMusicFunctionDeclaration,
            getFocoFlowDataFunctionDeclaration,
            updateFocoFlowItemFunctionDeclaration,
            deleteFocoFlowItemFunctionDeclaration,
            updateFocoFlowTransactionFunctionDeclaration,
            deleteFocoFlowTransactionFunctionDeclaration,
            stopActiveAlarmFunctionDeclaration,
            openWebsiteFunctionDeclaration,
            openExternalPanelFunctionDeclaration,
            openYouTubeFunctionDeclaration,
            searchOnGoogleFunctionDeclaration,
            updateUserPreferencesFunctionDeclaration,
            searchPastConversationsFunctionDeclaration,
            searchMemoryFunctionDeclaration,
            saveImportantMemoryFunctionDeclaration,
            createFocoFlowNoteFunctionDeclaration,
            openFocoFlowDashboardFunctionDeclaration,
            createFocoFlowAccountFunctionDeclaration,
            createFocoFlowRecurringFunctionDeclaration,
            createFocoFlowThirdPartyFunctionDeclaration,
            createFocoFlowFinancialGoalFunctionDeclaration,
            atlasListUsersFunctionDeclaration,
            atlasUpdateUserStatusFunctionDeclaration,
            atlasUpdateUserRoleFunctionDeclaration,
            atlasDeleteUserFunctionDeclaration,
            atlasDeleteFocoFlowItemFunctionDeclaration,
            atlasDeleteFocoFlowTransactionFunctionDeclaration,
            atlasDeleteFocoFlowGoalFunctionDeclaration,
            atlasAuthorizeEmailFunctionDeclaration,
            atlasGetSecurityLogsFunctionDeclaration,
            atlasAnalyzeNXFinancialsFunctionDeclaration,
            atlasOpenNXDashboardFunctionDeclaration
        ];

        if (atlasVisionEnabled) {
            functionDeclarations.push(highlightCoordinatesFunctionDeclaration);
        }

        tools.push({ 
            functionDeclarations
        });
    }
    
    if (needsSearch) {
        tools.push({ googleSearch: {} });
    }

    // Final check to ensure we don't have consecutive user roles
    const finalContents = [...contents];
    if (finalContents.length > 0 && finalContents[finalContents.length - 1].role === 'user') {
        finalContents[finalContents.length - 1].parts.push(...currentParts);
    } else {
        finalContents.push({ role: 'user', parts: currentParts });
    }

    const hasBuiltIn = tools.some(t => t.googleSearch || t.googleMaps || t.urlContext);
    const hasFunctions = tools.some(t => t.functionDeclarations);

    return await retryOperation(async () => {
        console.log("Sending request to Gemini with contents:", finalContents.length, "turns", "Tools:", tools.length);
        
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3.1-pro-preview',
                contents: finalContents,
                config: { 
                    systemInstruction, 
                    tools,
                },
                // @ts-ignore - includeServerSideToolInvocations might not be in types yet
                toolConfig: (hasBuiltIn && hasFunctions) ? { includeServerSideToolInvocations: true } : undefined
            });
            console.log("Gemini response received successfully");
            
            if (response.text) {
                saveToCache(message, response.text);
            }

            return {
                text: response.text || "",
                functionCalls: response.functionCalls,
                groundingMetadata: response.candidates?.[0]?.groundingMetadata
            };
        } catch (error: any) {
            const errorMsg = error.message || String(error);
            const isQuotaError = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota");
            
            if (isQuotaError) {
                console.error("Gemini API Quota Exceeded:", error);
                throw new Error("Cota do Gemini excedida (Quota 429). Por favor, aguarde um momento ou use sua própria chave de API nas configurações.");
            }
            
            if (errorMsg.includes("Network error") || errorMsg.includes("Failed to fetch")) {
                console.error("Gemini API Network Error:", error);
                throw new Error("Erro de rede ao conectar com o Gemini. Verifique sua conexão.");
            }

            console.error("Gemini API Error:", error);
            if (error.message) console.error("Error Message:", error.message);
            if (error.status) console.error("Error Status:", error.status);
            throw error;
        }
    });
};

export const createLiveSession = async (
    callbacks: {
        onOpen: () => void;
        onClose: () => void;
        onError: (e: Error | ErrorEvent) => void;
        onInputTranscriptionUpdate: (text: string) => void;
        onOutputTranscriptionUpdate: (text: string) => void;
        onModelStartSpeaking: () => void;
        onModelStopSpeaking: (text: string) => void;
        onUserStopSpeaking: (text: string) => void;
        onTurnComplete: () => void;
        onInterrupt: () => void;
        onDeactivateScreenSharingCommand: () => void;
        onActivateScreenSharingCommand: () => void;
        onActivateCameraCommand: () => void;
        onDeactivateCameraCommand: () => void;
        onSwitchAgentCommand: (agentName: string) => void;
        onFocoFlowCommand: (command: string, args: any) => Promise<any>;
        onSearchPastConversationsCommand: (query: string, limit?: number) => Promise<any>;
        onSearchMemoryCommand: (query: string, limit?: number) => Promise<any>;
        onSaveImportantMemoryCommand: (info: string) => Promise<any>;
        onStopAlarmCommand: () => void;
        onOpenWebsiteCommand: (url: string) => void;
        onUpdateUserPreferencesCommand: (prefs: { themeColor?: string; assistantName?: string; userName?: string }) => void;
        onNewConversationCommand?: (summary?: string, title?: string) => void;
        onSessionReady: (session: any) => void;
        onAudioInputActivity?: () => void;
        onVoiceStateChange?: (state: 'OUVINDO' | 'PROCESSANDO' | 'FALANDO') => void;
        onMicrophoneStopped?: () => void;
        onGoAway?: () => void;
    },
    inputCtx: AudioContext,
    outputCtx: AudioContext,
    nextStartTimeRef: React.MutableRefObject<number>,
    micStreamRef: React.MutableRefObject<MediaStream | null>,
    outputAnalyser: AnalyserNode | null,
    inputAnalyser: AnalyserNode | null,
    history: ConversationMessage[],
    agent: string,
    isVisualActive: boolean,
    programmingLevel?: string,
    customInstruction?: string,
    voiceName: string = 'Kore',
    isSummarized: boolean = false,
    isJarvisMode: boolean = false,
    assistantName: string = 'Assistente',
    userName: string = '',
    conversationSummary?: string,
    memoryContext?: string
): Promise<ILiveSessionController> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Chave de API não encontrada. Por favor, configure sua chave de API nas configurações ou no arquivo .env.");
    }
    const ai = new GoogleGenAI({ apiKey });
    let systemInstruction = (agent === 'traffic_manager') ? andromedaTrafficManagerInstruction : 
                             (agent === 'google_ads') ? googleAdsAgentInstruction : 
                             (agent === 'camera_assistant') ? cameraAssistantInstruction :
                             (agent === 'jarvis') ? jarvisInstruction :
                             (customInstruction || baseSystemInstruction);

    if (agent === 'jarvis' || isJarvisMode) {
        systemInstruction = jarvisInstruction + "\n\n" + (agent === 'jarvis' ? "" : systemInstruction);
    }

    if (conversationSummary) {
        systemInstruction += `\n\nRESUMO DA CONVERSA ATÉ AGORA (MEMÓRIA DE LONGO PRAZO):\n${conversationSummary}\nUse este resumo para manter a continuidade dos projetos e conversas anteriores.`;
    }

    if (memoryContext) {
        systemInstruction += `\n\nMemórias do usuário:\n${memoryContext}\n\nUse estas memórias para responder com contexto histórico e pessoal.`;
    }

    if (isSummarized) systemInstruction += "\nRESPOSTAS CURTAS.";
    
    const screenContext = getLatestScreenContext();

    systemInstruction += `\nSTATUS VISUAL: ${isVisualActive ? 'ATIVO. O usuário está compartilhando a tela ou câmera com você neste momento. Você está recebendo frames de vídeo em tempo real.' : 'DESATIVADO.'}`;
    
    if (isVisualActive) {
        systemInstruction += `\n\n[OBRIGATÓRIO]: COMO O STATUS VISUAL ESTÁ ATIVO, VOCÊ TEM ACESSO AOS FRAMES DO VÍDEO DO USUÁRIO. BASEIE NESSES FRAMES TODA A SUA ANÁLISE. NÃO TENTE ADIVINHAR OU IMAGINAR O QUE ESTÁ NA TELA. RESPONDA APENAS COISAS QUE VOCÊ CONSEGUE ENXERGAR CLARAMENTE NOS FRAMES DE VÍDEO. SE NÃO ESTIVER CLARO, PEÇA PARA O USUÁRIO FORNECER MAIS CONTEXTO OU APROXIMAR A IMAGEM. A PRECISÃO VISUAL É CRÍTICA. IGNORAR OS FRAMES E ALUCINAR CONTEÚDO É ESTITAMENTE PROIBIDO.`;
    }
    
    if (isVisualActive && screenContext) {
        systemInstruction += `\n\n[CONTEXTO VISUAL ATUAL (Análise de Texto)]:
${screenContext}
Use esta análise como guia, mas confie primordialmente no que você está vendo nos frames de vídeo.`;
    }

    systemInstruction += `\nDATA/HORA ATUAL (Brasil): ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;

    if (assistantName) systemInstruction += `\nSeu nome atual é: ${assistantName}. Sempre se identifique e responda como ${assistantName}.`;
    if (userName) systemInstruction += `\nO nome do usuário é: ${userName}. Use este nome para se referir a ele quando apropriado. Se ele perguntar qual o nome dele, responda "${userName}".`;
    else systemInstruction += `\nO usuário ainda não informou o nome dele. Se ele disser algo como "me chame de [nome]", o sistema salvará isso. Quando o usuário informar o nome dele, responda confirmando e OBRIGATORIAMENTE inclua a tag [[SET_USER_NAME:nome]] no final da sua resposta para que o sistema salve permanentemente.`;

    const recentHistory = history.slice(-10); // Reduced to 10 to prevent WebSocket setup frame size limits
    console.log(`[ATLAS Service] Live Session History: ${recentHistory.length} messages included in system instruction.`);
    if (recentHistory.length > 0) {
        systemInstruction += `\n\nCONTEXTO RECENTE:\n${recentHistory.map(m => `${m.role}: ${m.text.substring(0, 150)}`).join('\n')}`;
    }

    if (systemInstruction.length > 20000) {
        systemInstruction = systemInstruction.substring(0, 20000) + '... [Truncado]';
    }

    const functionDeclarations = [
        atlasCreateNewConversationFunctionDeclaration,
        switchActiveAgentFunctionDeclaration, 
        getCurrentDateTimeBrazilFunctionDeclaration, 
        stopActiveAlarmFunctionDeclaration,
        openWebsiteFunctionDeclaration,
        openYouTubeFunctionDeclaration,
        searchOnGoogleFunctionDeclaration,
        updateUserPreferencesFunctionDeclaration,
        createFocoFlowTaskFunctionDeclaration,
        createFocoFlowProjectFunctionDeclaration,
        createFocoFlowReminderFunctionDeclaration,
        createFocoFlowTransactionFunctionDeclaration,
        createFocoFlowLinkFunctionDeclaration,
        playMusicOnYouTubeFunctionDeclaration,
        searchOnYouTubeFunctionDeclaration,
        generateMusicFunctionDeclaration,
        getFocoFlowDataFunctionDeclaration,
        updateFocoFlowItemFunctionDeclaration,
        deleteFocoFlowItemFunctionDeclaration,
        updateFocoFlowTransactionFunctionDeclaration,
        deleteFocoFlowTransactionFunctionDeclaration,
        getMonthlyFinancialReportFunctionDeclaration,
        searchPastConversationsFunctionDeclaration,
        searchMemoryFunctionDeclaration,
        saveImportantMemoryFunctionDeclaration,
        createFocoFlowNoteFunctionDeclaration,
        openFocoFlowDashboardFunctionDeclaration,
        createFocoFlowAccountFunctionDeclaration,
        createFocoFlowRecurringFunctionDeclaration,
        createFocoFlowThirdPartyFunctionDeclaration,
        createFocoFlowFinancialGoalFunctionDeclaration,
        atlasListUsersFunctionDeclaration,
        atlasUpdateUserStatusFunctionDeclaration,
        atlasUpdateUserRoleFunctionDeclaration,
        atlasDeleteUserFunctionDeclaration,
        atlasDeleteFocoFlowItemFunctionDeclaration,
        atlasDeleteFocoFlowTransactionFunctionDeclaration,
        atlasDeleteFocoFlowGoalFunctionDeclaration,
        atlasAuthorizeEmailFunctionDeclaration,
        atlasGetSecurityLogsFunctionDeclaration,
        atlasAnalyzeNXFinancialsFunctionDeclaration,
        atlasOpenNXDashboardFunctionDeclaration
    ];

    if (atlasVisionEnabled) {
        functionDeclarations.push(
            activateCameraFunctionDeclaration, 
            deactivateCameraFunctionDeclaration, 
            activateScreenSharingFunctionDeclaration, 
            deactivateScreenSharingFunctionDeclaration
        );
    }

    const tools: any[] = [
        { functionDeclarations }
    ];

    const needsSearch = true; // Always enable search for live session for maximum capability
    if (needsSearch) {
        tools.push({ googleSearch: {} });
    }

    let sources = new Set<AudioBufferSourceNode>();
    let micSource: MediaStreamAudioSourceNode | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let isSessionClosed = false;
    let keepAliveInterval: any = null;

    try {
        console.log("[ATLAS] Connecting to Live API with model: gemini-3.1-flash-live-preview");
        
        // Add a timeout for the connection to avoid hanging in 'connecting' status
        const connectionTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout ao conectar com o serviço do Gemini. Verifique sua conexão.")), 15000)
        );

        const session = await Promise.race([
            ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                config: {
                    systemInstruction: systemInstruction,
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
                    tools,
                    // @ts-ignore - transcription types might be missing
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
                callbacks: {
                    onopen: () => {
                        console.log("[ATLAS] Live Session opened successfully.");
                        if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                        callbacks.onOpen();
                        
                        // Start keep-alive ping every 15 seconds to prevent idle timeouts
                        keepAliveInterval = setInterval(() => {
                            if (!isSessionClosed) {
                                try {
                                    // Send a tiny empty audio packet as a ping
                                    session.sendRealtimeInput({ 
                                        audio: { 
                                            mimeType: 'audio/pcm;rate=16000', 
                                            data: arrayBufferToBase64(new Int16Array(100).buffer) 
                                        } 
                                    });
                                } catch (e) {
                                    console.warn("[ATLAS] Keep-alive ping failed:", e);
                                }
                            }
                        }, 15000);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Handle GoAway signal from server
                        if ((message as any).serverContent?.goaway || (message as any).goaway) {
                            console.log("[ATLAS] Received GoAway signal from server. Triggering recovery.");
                            if (isSessionClosed) return;
                            isSessionClosed = true;
                            if (keepAliveInterval) clearInterval(keepAliveInterval);
                            stopMicrophoneInput();
                            if (callbacks.onGoAway) callbacks.onGoAway();
                            else callbacks.onClose();
                            try { session.close(); } catch (e) {}
                            return;
                        }

                        if (message.serverContent?.interrupted) {
                            if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                            callbacks.onInterrupt();
                            sources.forEach(s => { try { s.stop(); } catch(e){} });
                            sources.clear();
                            nextStartTimeRef.current = 0;
                        }
                        
                        const modelTurn = message.serverContent?.modelTurn;
                        if (modelTurn) {
                            const base64Audio = modelTurn.parts?.[0]?.inlineData?.data;
                            if (base64Audio) {
                                if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('FALANDO');
                                callbacks.onModelStartSpeaking();
                                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                                const audioBuffer = await decodeAudioData(base64ToUint8Array(base64Audio), outputCtx, 24000, 1);
                                const source = outputCtx.createBufferSource();
                                source.buffer = audioBuffer;
                                source.connect(outputAnalyser || outputCtx.destination);
                                source.onended = () => sources.delete(source);
                                source.start(nextStartTimeRef.current);
                                nextStartTimeRef.current += audioBuffer.duration;
                                sources.add(source);
                            }

                            const modelText = modelTurn.parts?.find(p => p.text)?.text;
                            if (modelText) callbacks.onOutputTranscriptionUpdate(modelText);
                        }

                        // @ts-ignore
                        const userTurn = message.serverContent?.userTurn;
                        if (userTurn) {
                            const userText = userTurn.parts?.find(p => p.text)?.text;
                            if (userText) callbacks.onInputTranscriptionUpdate(userText);
                        }

                        if (message.serverContent?.turnComplete) {
                            if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('OUVINDO');
                            callbacks.onTurnComplete();
                        }

                        if (message.toolCall) {
                            if (callbacks.onVoiceStateChange) callbacks.onVoiceStateChange('FALANDO');
                            for (const fc of message.toolCall.functionCalls) {
                                let res: any = { result: "ok" };
                                switch (fc.name) {
                                    case 'switchActiveAgent': callbacks.onSwitchAgentCommand((fc.args as any).agentName); break;
                                    case 'activateCamera': callbacks.onActivateCameraCommand(); break;
                                    case 'deactivateCamera': callbacks.onDeactivateCameraCommand(); break;
                                    case 'activateScreenSharing': callbacks.onActivateScreenSharingCommand(); break;
                                    case 'deactivateScreenSharing': callbacks.onDeactivateScreenSharingCommand(); break;
                                    case 'stopActiveAlarm': callbacks.onStopAlarmCommand(); break;
                                    case 'openWebsite': callbacks.onOpenWebsiteCommand((fc.args as any).url); break;
                                    case 'updateUserPreferences': callbacks.onUpdateUserPreferencesCommand(fc.args as any); break;
                                    case 'getCurrentDateTimeBrazil': res = { result: executeGetCurrentDateTimeBrazil() }; break;
                                    case 'atlasCreateNewConversation': 
                                        if (callbacks.onNewConversationCommand) {
                                            callbacks.onNewConversationCommand((fc.args as any).summary, (fc.args as any).newTitle);
                                            res = { result: "Sessão arquivada e nova conversa iniciada com sucesso. Continuaremos com base no resumo fornecido." };
                                        } else {
                                            res = { error: "Funcionalidade de nova conversa não disponível no momento." };
                                        }
                                        break;
                                    default:
                                        res = await callbacks.onFocoFlowCommand(fc.name, fc.args);
                                }
                                session.sendToolResponse({ functionResponses: [{ id: fc.id, name: fc.name, response: res }] });
                            }
                        }
                    },
                    onclose: () => {
                        console.log("[ATLAS] Live Session closed.");
                        isSessionClosed = true;
                        if (keepAliveInterval) clearInterval(keepAliveInterval);
                        callbacks.onClose();
                    },
                    onerror: (e) => {
                        isSessionClosed = true;
                        if (keepAliveInterval) clearInterval(keepAliveInterval);
                        
                        let errorDetails = "";
                        if (e instanceof Error) {
                            errorDetails = e.message;
                        } else if (e && typeof e === 'object') {
                            const event = e as any;
                            errorDetails = event.message || event.reason || (event.error && event.error.message) || String(e);
                        } else {
                            errorDetails = String(e);
                        }

                        console.error("[ATLAS Mic] Live Session Error Event:", errorDetails, e);

                        if (errorDetails.includes("The operation was aborted") || errorDetails.includes("AbortError")) {
                            console.log("[ATLAS] Live Session connection aborted (expected cleanup)");
                            return;
                        }

                        if (errorDetails.includes("Permission denied") || errorDetails.includes("NotAllowedError")) {
                            console.error("[ATLAS Mic] Permission denied detected in Live Session.");
                        }
                        
                        // Treat generic error objects as Network errors
                        if (errorDetails === '[object ErrorEvent]' || errorDetails === '{}' || errorDetails === 'Error: Network error') {
                            const wrappedError = new Error("Erro de rede WebSocket (Conexão recusada ou perdida). Verifique sua internet.");
                            callbacks.onError(wrappedError);
                        } else {
                            callbacks.onError(e instanceof Error ? e : new Error(errorDetails));
                        }
                    }
                }
            }),
            connectionTimeout
        ]) as any;

        callbacks.onSessionReady(session);

        const startMic = async (existingStream?: MediaStream) => {
        if (inputCtx.state === 'suspended') {
            await inputCtx.resume();
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor.onaudioprocess = null;
        }
        if (micSource) {
            micSource.disconnect();
        }

        try {
            let stream = existingStream;
            if (!stream) {
                console.log("[ATLAS Mic] Requesting getUserMedia...");
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                console.log("[ATLAS] Microfone ativado");
            } else {
                console.log("[ATLAS Mic] Using existing stream.");
            }
            micStreamRef.current = stream;
            
            // Listen for track ended (e.g., mic unplugged or browser permission revoked)
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    console.warn("Microphone track ended unexpectedly.");
                    stopMicrophoneInput();
                    if (callbacks.onMicrophoneStopped) callbacks.onMicrophoneStopped();
                };
            });

            // Proactive monitoring: check if track is live every 5 seconds
            const monitorInterval = setInterval(() => {
                const track = stream.getAudioTracks()[0];
                if (!track || track.readyState !== 'live') {
                    console.warn("Microphone track detected as inactive, restarting...");
                    clearInterval(monitorInterval);
                    stopMicrophoneInput();
                    if (callbacks.onMicrophoneStopped) callbacks.onMicrophoneStopped();
                }
            }, 5000);
            
            // Store interval to clear it on stop
            (micStreamRef.current as any).monitorInterval = monitorInterval;
            
            micSource = inputCtx.createMediaStreamSource(stream);
            
            if (inputAnalyser) {
                micSource.connect(inputAnalyser);
            }

            scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
                if (inputCtx.state === 'closed' || isSessionClosed) return;
                
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Resample to 16kHz if necessary
                let resampledData = inputData;
                if (inputCtx.sampleRate !== 16000) {
                    const ratio = inputCtx.sampleRate / 16000;
                    const newLength = Math.round(inputData.length / ratio);
                    resampledData = new Float32Array(newLength);
                    for (let i = 0; i < newLength; i++) {
                        resampledData[i] = inputData[Math.round(i * ratio)];
                    }
                }

                const pcmData = new Int16Array(resampledData.length);
                for (let i = 0; i < resampledData.length; i++) {
                    let s = Math.max(-1, Math.min(1, resampledData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                if (callbacks.onAudioInputActivity) callbacks.onAudioInputActivity();

                try {
                    if (!isSessionClosed) {
                        session.sendRealtimeInput({ 
                            audio: { 
                                mimeType: 'audio/pcm;rate=16000', 
                                data: arrayBufferToBase64(pcmData.buffer) 
                            } 
                        });
                    }
                } catch (err: any) {
                    const errorMsg = err?.message || String(err);
                    if (!errorMsg.includes("The operation was aborted") && !errorMsg.includes("AbortError")) {
                        console.error("Error sending audio data:", err);
                    }
                    // If sending fails, the session might be dead.
                    // The track.onended or session onerror should handle the cleanup.
                }
            };

            micSource.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
        } catch (err) {
            console.error("Error starting microphone:", err);
            callbacks.onError(err as Error);
        }
    };

    const stopMicrophoneInput = () => {
        if (micStreamRef.current) {
            // Clear monitoring interval if it exists
            if ((micStreamRef.current as any).monitorInterval) {
                clearInterval((micStreamRef.current as any).monitorInterval);
            }
            micStreamRef.current.getTracks().forEach(t => t.stop());
            micStreamRef.current = null;
        }
        if (scriptProcessor) {
            scriptProcessor.disconnect();
            scriptProcessor.onaudioprocess = null;
            scriptProcessor = null;
        }
        if (micSource) {
            micSource.disconnect();
            micSource = null;
        }
    };

    const sendPing = () => {
        if (!isSessionClosed) {
            try {
                // Send a tiny empty audio packet as a ping
                session.sendRealtimeInput({ 
                    audio: { 
                        mimeType: 'audio/pcm;rate=16000', 
                        data: arrayBufferToBase64(new Int16Array(100).buffer) 
                    } 
                });
            } catch (e) {
                console.warn("[ATLAS] Manual ping failed:", e);
            }
        }
    };

    const controller = { 
        sessionPromise: Promise.resolve(session), 
        startMic,
        ping: sendPing,
        stopMicInput: stopMicrophoneInput, 
        stopPlayback: () => {
            sources.forEach(s => { try { s.stop(); } catch(e){} });
            sources.clear();
        }, 
        closeSession: () => {
            isSessionClosed = true;
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                keepAliveInterval = null;
            }
            stopMicrophoneInput();
            try {
                session.close();
            } catch (e) {
                console.warn("Error closing session:", e);
            }
        },
        isModelSpeaking: () => sources.size > 0
    };
    console.log("[ATLAS] Controller initialized with Jarvis extensions");
    return controller;
  } catch (err) {
    console.error("[ATLAS] Final error establishing Live Session:", err);
    throw err;
  }
};

export async function enviarMensagemGemini(uid: string, message: string) {
  const memorias = await buscarMemorias(uid);

  const memoriaTexto = memorias
    .map((m: any) => m.content)
    .join("\n");

  const prompt = `
MEMÓRIAS DO USUÁRIO:
${memoriaTexto}

Mensagem do usuário:
${message}
`;

  const ai = new GoogleGenAI({ apiKey: getApiKey() });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt
  });

  return response.text;
}

/**
 * Interface simples para perguntar ao Gemini.
 */
export async function perguntarGemini(pergunta: string, sessionId?: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const model = ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: pergunta
    });
    
    const result = await model;
    const resposta = result.text || "";
    
    return resposta;
}
