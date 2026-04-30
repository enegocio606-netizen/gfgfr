import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Zap, Cpu, Binary, RefreshCw, AlertCircle } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface DominateInsightsProps {
    data: {
        summary: any;
        transactions: any[];
        operational: any;
    };
}

export const DominateInsights: React.FC<DominateInsightsProps> = ({ data }) => {
    const [insight, setInsight] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    const generateInsight = async () => {
        setLoading(true);
        setError(false);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            const prompt = `
                Analise os seguintes dados financeiros de um usuário do sistema ATLAS (FocoFlow Finance).
                O objetivo é fornecer insights "Dominate" - focados em crescimento, otimização extrema e mentalidade de riqueza.
                
                DADOS:
                - Período: ${data.summary.period}
                - Receitas: R$ ${data.summary.totalIncome}
                - Despesas: R$ ${data.summary.totalExpense}
                - Saldo Liquido: R$ ${data.summary.balance}
                - Inconsistências: ${data.operational.inconsistencies.join(', ')}
                - Top Transações: ${data.transactions.slice(0, 10).map(t => `${t.description}: R$ ${t.amount}`).join('; ')}
                
                REGRAS DE ANÁLISE (CRÍTICO):
                1. Detecte explicitamente gastos que parecem inúteis ou supérfluos com base na descrição das transações.
                2. Sugira ações práticas para reduzir essas despesas e economizar dinheiro.
                3. Use um tom autoritário, motivador e técnico (estilo IA avançada).
                4. Dê 3 pontos de ação específicos para "dominância financeira", focando em: Gastos Inúteis, Sugestão de Economia e Crescimento.
                5. Otimize para o crescimento do capital.
                6. Responda em Português do Brasil.
                7. Formate a resposta com títulos curtos em negrito seguidos de uma breve explicação.
            `;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
                config: {
                    temperature: 0.7,
                    topP: 0.9,
                }
            });

            setInsight(response.text || "Não foi possível gerar insights no momento.");
        } catch (err) {
            console.error("Error generating financial insights:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!insight && data.summary) {
            generateInsight();
        }
    }, [data.summary]);

    return (
        <div className="bg-black/60 border border-cyan-400/20 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0" />
            
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 flex items-center gap-4">
                    <Binary size={16} /> Inteligência Dominate_OS
                </h3>
                <button 
                    onClick={generateInsight}
                    disabled={loading}
                    className="p-2 hover:bg-white/5 rounded-lg text-cyan-400 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-full border-t-2 border-cyan-400 animate-spin" />
                    <p className="text-[10px] font-mono text-cyan-400/40 uppercase tracking-widest animate-pulse">Processando Vantagem Estratégica...</p>
                </div>
            ) : error ? (
                <div className="py-12 flex flex-col items-center text-red-400 gap-2">
                    <AlertCircle size={32} />
                    <p className="text-xs font-bold uppercase tracking-widest">Falha na Matriz Neural</p>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                >
                    <div className="p-6 bg-cyan-400/5 rounded-2xl border border-cyan-400/10">
                        <div className="flex items-start gap-4">
                            <div className="p-2 bg-cyan-400/10 rounded-lg text-cyan-400 shrink-0">
                                <Zap size={18} />
                            </div>
                            <div className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">
                                {insight}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full border border border-black bg-cyan-900 flex items-center justify-center text-[8px] font-bold text-cyan-400">
                             AT
                        </div>
                    ))}
                </div>
                <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Análise Baseada no Core_Atlas_v4</span>
            </div>
        </div>
    );
};
