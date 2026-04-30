import { GoogleGenAI } from "@google/genai";
import { FocoFlowFinancialGoal, FocoFlowTransaction } from './focoFlowService';

// Helper to get API Key consistently with other services
const getApiKey = (): string => {
    return process.env.GEMINI_API_KEY || "";
};

export interface FinancialAnalysisResult {
    currentProgress: number;
    estimatedTimeToGoal: number | null; // In months
    risks: string[];
    optimizationSuggestions: string[];
}

export const analyzeFinancialData = async (prompt: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API Key não configurada.");
    const ai = new GoogleGenAI({ apiKey });
    
    // Using a reliable model for reasoning
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash',
        contents: prompt
    });
    
    return response.text || "";
};

export const analyzeFinancialGoal = async (
    userId: string,
    goal: FocoFlowFinancialGoal,
    transactions: FocoFlowTransaction[]
): Promise<FinancialAnalysisResult> => {
    // 1. Calculate basic progress
    const progress = (goal.valor_atual / goal.valor_alvo) * 100;
    
    // 2. Use Gemini to do the complex analysis
    // We send goal and transaction context
    const analysisPrompt = `
    Função: Você é o módulo de planejamento financeiro do ATLAS.
    Entrada:
    Meta: ${goal.titulo}, Valor Alvo: ${goal.valor_alvo}, Atual: ${goal.valor_atual}, Prazo: ${goal.prazo || 'N/A'} meses.
    Transações recentes: ${JSON.stringify(transactions.slice(0, 10))}

    Regras:
    - Sempre calcular tempo estimado para atingir metas (com base no saldo mensal atual ou última transação).
    - Sugerir ajustes realistas.
    - Identificar riscos financeiros (ex: despesas muito altas em relação à receita).
    - Otimizar economia.

    Retorne APENAS um JSON com o seguinte formato, sem formatação markdown:
    {
        "estimatedTimeToGoal": number | null, 
        "risks": ["risco1", "risco2"],
        "optimizationSuggestions": ["sugestao1", "sugestao2"]
    }
    `;

    try {
        const geminiResult = await analyzeFinancialData(analysisPrompt);
        // Remove markdown formatting if present
        const cleanedResult = geminiResult.replace(/```json\n?|\n?```/g, '');
        const parsedResult = JSON.parse(cleanedResult);
        
        return {
            currentProgress: progress,
            ...parsedResult
        };
    } catch (error) {
        console.error("Erro na análise financeira:", error);
        return {
            currentProgress: progress,
            estimatedTimeToGoal: null,
            risks: ["Não foi possível realizar análise detalhada no momento."],
            optimizationSuggestions: ["Tente revisar seus gastos mensais."]
        };
    }
};
