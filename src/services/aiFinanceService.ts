import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string => {
  if (typeof window !== 'undefined') {
    const userKey = localStorage.getItem('userGideonApiKey');
    if (userKey && userKey.trim() !== '') return userKey;
  }
  return process.env.GEMINI_API_KEY || "";
};

export interface AiFinancialInsightsInput {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  transactions: any[];
  spendingDistribution: any[];
  financialGoals?: any[];
}

export interface AiFinancialInsightsOutput {
  overallSummary: string;
  savingsSuggestions: string[];
  highSpendingAlerts: string[];
  improvementOpportunities: string[];
}

export async function aiFinancialInsights(input: AiFinancialInsightsInput): Promise<AiFinancialInsightsOutput> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key não configurada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Analise os seguintes dados financeiros e forneça insights inteligentes.
Responda APENAS em JSON no seguinte formato:
{
  "overallSummary": "string",
  "savingsSuggestions": ["string"],
  "highSpendingAlerts": ["string"],
  "improvementOpportunities": ["string"]
}

DADOS:
- Saldo Atual: R$ ${input.currentBalance}
- Receita Total: R$ ${input.totalIncome}
- Despesa Total: R$ ${input.totalExpenses}
- Lucro Líquido: R$ ${input.netProfit}

DISTRIBUIÇÃO DE GASTOS:
${JSON.stringify(input.spendingDistribution, null, 2)}

TRANSAÇÕES RECENTES:
${JSON.stringify(input.transactions, null, 2)}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    // Clean up JSON if model adds markdown blocks
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Erro ao gerar insights financeiros:", error);
    return {
      overallSummary: "Não foi possível gerar um resumo no momento.",
      savingsSuggestions: ["Tente revisar suas despesas fixas."],
      highSpendingAlerts: ["Monitorar categorias com maiores gastos."],
      improvementOpportunities: ["Considere estabelecer metas de economia."]
    };
  }
}
