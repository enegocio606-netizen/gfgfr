import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, TrendingUp, AlertTriangle, ShieldCheck, PieChart, Activity, Zap, DollarSign, Target } from 'lucide-react';
import { getMonthlyFinancialReport, getOperationalAnalysis } from '@/services/focoFlowService';
import { auth } from '@/firebase';

const SmartReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [report, setReport] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!auth.currentUser) return;
            const r = await getMonthlyFinancialReport(auth.currentUser.uid);
            const a = await getOperationalAnalysis(auth.currentUser.uid);
            setReport(r);
            setAnalysis(a);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) return <div className="fixed inset-0 z-[300] bg-[#05070B] flex items-center justify-center text-[#00D9FF] text-sm font-mono tracking-widest animate-pulse">PROCESSANDO_DADOS_FINANCEIROS_JARVIS...</div>;

    const runwayMonths = report?.totalExpense > 0 ? report.balance / report.totalExpense : 0;
    const riskLevel = runwayMonths > 6 ? 'BAIXO' : runwayMonths > 3 ? 'MÉDIO' : 'ALTO';
    const burnRate = report?.totalExpense || 0;

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-[#05070B]/95 flex items-center justify-center p-8 backdrop-blur-sm"
        >
            <div className="bg-[#0B1220] w-full max-w-5xl max-h-[90vh] rounded border border-[#1C2A3F] p-8 overflow-y-auto custom-scrollbar shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <div className="flex justify-between items-center mb-8 border-b border-[#1C2A3F] pb-4">
                    <h2 className="text-[#00D9FF] font-bold tracking-widest text-lg flex items-center gap-3">
                        <Activity className="text-[#00D9FF]" /> PAINEL INTELIGENTE JARVIS
                    </h2>
                    <button onClick={onClose} className="text-white hover:text-[#00D9FF] font-mono tracking-widest">CLOSE [X]</button>
                </div>

                {/* Métricas Principais - Painel Jarvis */}
                <div className="grid grid-cols-5 gap-4 mb-8">
                    {analysis?.metrics.map((m: any, i: number) => (
                        <div key={i} className="bg-[#05070B] p-4 border border-[#1C2A3F] rounded-none hover:border-[#00D9FF]/50 transition-colors">
                            <div className="text-[10px] text-[#C7D0E0]/60 mb-2 uppercase tracking-tighter">{m.label}</div>
                            <div className="text-2xl font-bold font-mono" style={{ color: m.color }}>{m.value}{isNaN(m.value) ? '' : '%'}</div>
                            <div className="text-[8px] mt-1 text-[#00D9FF]/70 uppercase tracking-widest">{m.status}</div>
                        </div>
                    ))}
                    <div className="bg-[#05070B] p-4 border border-[#1C2A3F] rounded-none">
                        <div className="text-[10px] text-[#C7D0E0]/60 mb-2 uppercase tracking-tighter">BURN RATE</div>
                        <div className="text-2xl font-bold font-mono text-white">R$ {burnRate.toFixed(2)}</div>
                        <div className="text-[8px] mt-1 text-[#00D9FF]/70 uppercase tracking-widest">MENSAIS</div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-8">
                    {/* Insights, Alertas, Projeções */}
                    <div className="col-span-1 space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[#C7D0E0]">
                             <AlertTriangle size={16} className="text-[#ff9d00]" /> Alertas Operacionais
                        </h3>
                        {analysis?.inconsistencies.length > 0 ? analysis?.inconsistencies.map((inc: string, i: number) => (
                            <div key={i} className="p-3 bg-red-900/10 border-l border-red-500 text-xs text-red-200 font-mono">
                                {inc}
                            </div>
                        )) : <div className="text-xs text-[#00ff9d] font-mono">SISTEMA_OPERACIONAL_ESTÁVEL</div>}
                        
                        <div className="mt-8">
                             <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[#C7D0E0]">
                                <Target size={16} className="text-[#00D9FF]" /> Sugestões Inteligentes
                             </h3>
                             <div className="p-3 bg-[#05070B] border border-[#1C2A3F] text-xs text-[#C7D0E0] mt-2 font-mono">
                                 {burnRate > 5000 ? "Reduzir custos fixos em categorias não essenciais aumentará o runway em 15%." : "Manter ritmo atual de gastos é sustentável."}
                             </div>
                        </div>
                    </div>

                    <div className="col-span-2 space-y-6">
                         <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-[#C7D0E0]">
                            <ShieldCheck size={16} className="text-[#00ff9d]" /> Risco de Caixa & Projeção
                        </h3>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-[#05070B] border border-[#1C2A3F]">
                                 <div className="text-[10px] text-[#C7D0E0]/60 uppercase">Runway</div>
                                 <div className="text-3xl font-bold font-mono text-white mt-1">{Math.max(0, Math.round(runwayMonths))}</div>
                                 <div className="text-[10px] text-[#C7D0E0]/70 uppercase">Meses de sustentabilidade</div>
                             </div>
                             <div className="p-4 bg-[#05070B] border border-[#1C2A3F]">
                                 <div className="text-[10px] text-[#C7D0E0]/60 uppercase">Nível de Risco</div>
                                 <div className={`text-3xl font-bold font-mono mt-1 ${riskLevel === 'ALTO' ? 'text-red-500' : riskLevel === 'MÉDIO' ? 'text-[#ff9d00]' : 'text-[#00ff9d]'}`}>
                                     {riskLevel}
                                 </div>
                                 <div className="text-[10px] text-[#C7D0E0]/70 uppercase">Classificação de Liquidez</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SmartReportModal;
