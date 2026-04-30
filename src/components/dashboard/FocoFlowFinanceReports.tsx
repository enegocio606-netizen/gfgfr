import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart3, 
    TrendingUp, 
    PieChart, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight, 
    ChevronLeft, 
    ChevronRight,
    Filter,
    Download,
    RefreshCw
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { getMonthlyFinancialReport, getFocoFlowData, FocoFlowTransaction } from '../../../services/focoFlowService';

const COLORS = ['#00f2ff', '#8b5cf6', '#00ff9d', '#ff9d00', '#ff007f', '#22d3ee'];

interface FocoFlowFinanceReportsProps {
    userId: string;
}

export const FocoFlowFinanceReports: React.FC<FocoFlowFinanceReportsProps> = ({ userId }) => {
    const [loading, setLoading] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState<any>(null);
    const [evolutionData, setEvolutionData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<FocoFlowTransaction[]>([]);
    const [selectedView, setSelectedView] = useState<'monthly' | 'category' | 'evolution'>('monthly');

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Get Monthly Report
            const report = await getMonthlyFinancialReport(userId);
            setMonthlyReport(report);

            // 2. Get Recent Transactions for detailed Analysis
            const recentTx = await getFocoFlowData(userId, 'transacoes_financeiras_focoflow', 100);
            setTransactions(recentTx as unknown as FocoFlowTransaction[]);

            // 3. Process Evolution Data (simplified for now - last 6 months)
            // In a real app, we would query each month specifically, but for now we aggregate from recentTx
            const evolution: { [key: string]: { month: string, income: number, expense: number } } = {};
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            recentTx.forEach((tx: any) => {
                const date = new Date(tx.data || tx.date);
                const monthYear = `${months[date.getMonth()]}/${date.getFullYear()}`;
                
                if (!evolution[monthYear]) {
                    evolution[monthYear] = { month: monthYear, income: 0, expense: 0 };
                }
                
                const amount = Number(tx.valor || tx.amount || 0);
                if (tx.tipo === 'income') {
                    evolution[monthYear].income += amount;
                } else {
                    evolution[monthYear].expense += amount;
                }
            });

            const evolutionList = Object.values(evolution).sort((a: any, b: any) => {
                const [mA, yA] = a.month.split('/');
                const [mB, yB] = b.month.split('/');
                const dateA = new Date(parseInt(yA), months.indexOf(mA));
                const dateB = new Date(parseInt(yB), months.indexOf(mB));
                return dateA.getTime() - dateB.getTime();
            });

            setEvolutionData(evolutionList.slice(-6));
        } catch (error) {
            console.error("Error fetching report data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, [userId]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <RefreshCw className="text-cyan-400 animate-spin" size={40} />
                    <p className="text-cyan-400/50 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Analizando Dados Financeiros...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col pt-2">
            {/* Header / Sub-navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
                        <BarChart3 className="text-cyan-400" /> Relatórios Financeiros
                    </h2>
                    <p className="text-[10px] text-cyan-400/40 uppercase tracking-widest font-mono mt-1">SISTEMA_DE_INTELIGENCIA_FINANCEIRA // {monthlyReport?.period || 'CONTROLE_ATIVO'}</p>
                </div>

                <div className="flex bg-cyan-950/40 border border-cyan-400/20 rounded-xl p-1 p-x">
                    {[
                        { id: 'monthly', label: 'Mensal', icon: Calendar },
                        { id: 'category', label: 'Categorias', icon: PieChart },
                        { id: 'evolution', label: 'Evolução', icon: TrendingUp },
                    ].map(view => (
                        <button
                            key={view.id}
                            onClick={() => setSelectedView(view.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                selectedView === view.id 
                                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,242,255,0.4)]' 
                                : 'text-cyan-400/50 hover:text-cyan-400 hover:bg-cyan-400/10'
                            }`}
                        >
                            <view.icon size={14} />
                            <span className="hidden sm:inline">{view.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {/* View Summary Cards (Always visible or contextual) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="jarvis-glass p-6 rounded-2xl border border-cyan-400/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-400/5 -rotate-12 translate-x-4 -translate-y-4 rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <span className="text-[8px] uppercase tracking-widest text-cyan-400/60 font-mono">Receitas Totais</span>
                        <div className="text-2xl font-black text-cyan-400 mt-1">R$ {monthlyReport?.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="flex items-center gap-1 text-[10px] text-green-400 mt-2 font-mono">
                            <ArrowUpRight size={10} /> RECUPERAÇÃO_ATIVA
                        </div>
                    </div>
                    <div className="jarvis-glass p-6 rounded-2xl border border-pink-500/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 -rotate-12 translate-x-4 -translate-y-4 rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <span className="text-[8px] uppercase tracking-widest text-pink-500/60 font-mono">Despesas Totais</span>
                        <div className="text-2xl font-black text-pink-500 mt-1">R$ {monthlyReport?.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <div className="flex items-center gap-1 text-[10px] text-red-500 mt-2 font-mono">
                            <ArrowDownRight size={10} /> FLUXO_DE_SAIDA
                        </div>
                    </div>
                    <div className="jarvis-glass p-6 rounded-2xl border border-purple-500/20 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 -rotate-12 translate-x-4 -translate-y-4 rounded-full group-hover:scale-150 transition-transform duration-700" />
                        <span className="text-[8px] uppercase tracking-widest text-purple-500/60 font-mono">Saldo Líquido</span>
                        <div className={`text-2xl font-black mt-1 ${monthlyReport?.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            R$ {monthlyReport?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-purple-400 mt-2 font-mono uppercase tracking-[0.2em]">
                             SISTEMA_{monthlyReport?.balance >= 0 ? 'POSITIVO' : 'DEFICITARIO'}
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {selectedView === 'monthly' && (
                        <motion.div 
                            key="monthly"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="space-y-6"
                        >
                            <div className="jarvis-glass p-8 rounded-2xl border border-cyan-400/10 min-h-[400px]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2">
                                        <Calendar size={14} className="text-cyan-400" /> Distribuição Diária (Simulado)
                                    </h3>
                                    <span className="text-[10px] font-mono text-cyan-400/40">AMOSTRAGEM_REALTIME</span>
                                </div>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={evolutionData.length > 0 ? evolutionData : [
                                            { month: 'W1', income: 400, expense: 200 },
                                            { month: 'W2', income: 300, expense: 450 },
                                            { month: 'W3', income: 600, expense: 300 },
                                            { month: 'W4', income: 200, expense: 150 },
                                        ]}>
                                            <defs>
                                                <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ff007f" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#ff007f" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 242, 255, 0.05)" vertical={false} />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                                                tickFormatter={(val) => `R$${val}`}
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#05070B', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#00f2ff', fontSize: '12px' }}
                                            />
                                            <Area type="monotone" dataKey="income" stroke="#00f2ff" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" />
                                            <Area type="monotone" dataKey="expense" stroke="#ff007f" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedView === 'category' && (
                        <motion.div 
                            key="category"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                        >
                            <div className="jarvis-glass p-8 rounded-2xl border border-cyan-400/10 min-h-[450px] flex flex-col">
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-8 flex items-center gap-2">
                                    <PieChart size={14} className="text-cyan-400" /> Divisão por Categoria
                                </h3>
                                <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8">
                                    <div className="w-full max-w-[250px] h-[250px] relative">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RePieChart>
                                                <Pie
                                                    data={monthlyReport?.categoryBreakdown || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={85}
                                                    paddingAngle={8}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {(monthlyReport?.categoryBreakdown || []).map((entry: any, index: number) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip 
                                                     contentStyle={{ backgroundColor: '#05070B', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px' }}
                                                     itemStyle={{ color: '#00f2ff', fontSize: '12px' }}
                                                />
                                            </RePieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-[8px] text-cyan-400/50 uppercase tracking-widest font-mono">Expensa Total</span>
                                            <span className="text-lg font-black text-white">R$ {monthlyReport?.totalExpense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4 w-full">
                                        {(monthlyReport?.categoryBreakdown || []).map((cat: any, i: number) => (
                                            <div key={i} className="flex flex-col gap-1">
                                                <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                                                    <span className="text-white/60 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                        {cat.name}
                                                    </span>
                                                    <span className="text-cyan-400">R$ {cat.value.toFixed(2)}</span>
                                                </div>
                                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(cat.value / monthlyReport.totalExpense) * 100}%` }}
                                                        transition={{ duration: 1, delay: i * 0.1 }}
                                                        className="h-full rounded-full"
                                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="jarvis-glass p-8 rounded-2xl border border-cyan-400/10 flex flex-col">
                                <h3 className="text-sm font-bold tracking-widest uppercase text-white mb-6 flex items-center gap-2">
                                    <ArrowUpRight size={14} className="text-cyan-400" /> Maiores Fluxos
                                </h3>
                                <div className="space-y-4">
                                    {transactions
                                        .sort((a, b) => b.amount - a.amount)
                                        .slice(0, 6)
                                        .map((tx, i) => (
                                            <div key={i} className="group p-4 bg-white/5 border border-white/5 hover:border-cyan-400/30 rounded-xl transition-all flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-pink-500/10 text-pink-500'}`}>
                                                        {tx.type === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-bold text-white group-hover:text-cyan-400 transition-colors uppercase tracking-[0.1em]">{tx.description}</p>
                                                        <p className="text-[9px] text-white/30 font-mono tracking-widest uppercase mt-0.5">{tx.category || 'GERAL'}</p>
                                                    </div>
                                                </div>
                                                <div className={`text-sm font-black ${tx.type === 'income' ? 'text-green-400' : 'text-pink-500'}`}>
                                                    {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedView === 'evolution' && (
                        <motion.div 
                            key="evolution"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="space-y-6"
                        >
                            <div className="jarvis-glass p-8 rounded-2xl border border-cyan-400/10 min-h-[450px]">
                                <div className="flex items-center justify-between mb-10">
                                    <h3 className="text-sm font-bold tracking-widest uppercase text-white flex items-center gap-2">
                                        <TrendingUp size={14} className="text-cyan-400" /> Histórico de Performance Semestral
                                    </h3>
                                    <div className="flex items-center gap-4 text-[9px] font-mono tracking-widest">
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-cyan-400" /> RECEITA</div>
                                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded bg-pink-500" /> DESPESA</div>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={evolutionData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                            <XAxis 
                                                dataKey="month" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }} 
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 'bold' }}
                                                tickFormatter={(val) => `R$${val}`}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: 'rgba(0, 242, 255, 0.05)' }}
                                                contentStyle={{ backgroundColor: '#05070B', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '12px' }}
                                            />
                                            <Legend />
                                            <Bar dataKey="income" name="Receita" fill="#00f2ff" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="expense" name="Despesa" fill="#ff007f" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="jarvis-glass p-6 rounded-2xl border border-cyan-400/10 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-cyan-400/10 flex items-center justify-center text-cyan-400 border border-cyan-400/30">
                                        <TrendingUp size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-cyan-400/60 font-mono">Taxa de Crescimento</h4>
                                        <p className="text-xl font-black text-white">+12.4% <span className="text-[10px] text-green-400 font-normal">VS MÊS ANTERIOR</span></p>
                                    </div>
                                </div>
                                <div className="jarvis-glass p-6 rounded-2xl border border-cyan-400/10 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                        <RefreshCw size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] uppercase tracking-[0.2em] text-purple-400/60 font-mono">Consistência de Caixa</h4>
                                        <p className="text-xl font-black text-white">ÓTIMA <span className="text-[10px] text-cyan-400 font-normal">SCORE_8.5</span></p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 transition-all text-[10px] font-bold uppercase tracking-widest">
                        <Download size={14} /> Exportar Relatório PDF
                    </button>
                    <button 
                        onClick={fetchAllData}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 hover:bg-cyan-400 hover:text-black transition-all text-[10px] font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,242,255,0.1)]"
                    >
                        <RefreshCw size={14} /> Sincronizar Agora
                    </button>
                </div>
            </div>
        </div>
    );
};
