import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
    BarChart3, 
    TrendingUp, 
    PieChart, 
    Calendar, 
    ArrowUpRight, 
    ArrowDownRight, 
    RefreshCw,
    Cpu,
    Zap,
    Shield,
    Terminal,
    Activity,
    Layers,
    Waves,
    Target,
    AlertTriangle,
    CheckCircle2,
    Database,
    Binary,
    Plus,
    BarChart,
    Coins,
    DollarSign,
    CreditCard,
    Wallet
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    BarChart as ReBarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    getMonthlyFinancialReport, 
    getFocoFlowData, 
    FocoFlowTransaction, 
    getOperationalAnalysis,
    FocoFlowFinancialGoal,
    createFocoFlowTransaction,
    createFocoFlowFinancialGoal
} from '../../../services/focoFlowService';
import { FinancialGoalCard } from './FinancialGoalCard';
import { DominateInsights } from './DominateInsights';

const COLORS = ['#00f2ff', '#8b5cf6', '#00ff9d', '#ff9d00', '#ff007f', '#22d3ee'];

interface FocoFlowFuturisticFinanceProps {
    userId: string;
    initialView?: 'matrix' | 'performance' | 'neural' | 'goals';
}

const FloatingIcon = ({ icon: Icon, delay = 0, x = 0, y = 0, size = 20 }: { icon: any, delay?: number, x?: number, y?: number, size?: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            x: [x, x + 20, x],
            y: [y, y - 20, y],
        }}
        transition={{ 
            duration: 10, 
            repeat: Infinity, 
            delay,
            ease: "easeInOut"
        }}
        className="absolute pointer-events-none z-0"
        style={{ left: `${50 + x}%`, top: `${50 + y}%` }}
    >
        <Icon size={size} className="text-cyan-400/30" />
    </motion.div>
);

export const FocoFlowFuturisticFinance: React.FC<FocoFlowFuturisticFinanceProps> = ({ userId, initialView = 'performance' }) => {
    const [loading, setLoading] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState<any>(null);
    const [operationalData, setOperationalData] = useState<any>(null);
    const [evolutionData, setEvolutionData] = useState<any[]>([]);
    const [transactions, setTransactions] = useState<FocoFlowTransaction[]>([]);
    const [goals, setGoals] = useState<FocoFlowFinancialGoal[]>([]);
    const [selectedView, setSelectedView] = useState(initialView);
    const [scanActive, setScanActive] = useState(false);
    const [showTransactionForm, setShowTransactionForm] = useState(false);

    useEffect(() => {
        setSelectedView(initialView);
    }, [initialView]);

    const fetchAllData = async () => {
        setLoading(true);
        setScanActive(true);
        try {
            const [report, operational, recentTx, goalsRes] = await Promise.all([
                getMonthlyFinancialReport(userId),
                getOperationalAnalysis(userId),
                getFocoFlowData(userId, 'transacoes_financeiras_focoflow', 100),
                getFocoFlowData(userId, 'metas_financeiras_focoflow', 20)
            ]);

            setMonthlyReport(report);
            setOperationalData(operational);
            setTransactions(recentTx as unknown as FocoFlowTransaction[]);
            setGoals(goalsRes as unknown as FocoFlowFinancialGoal[]);

            // Process Evolution Data
            const evolution: { [key: string]: { month: string, income: number, expense: number } } = {};
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            
            recentTx.forEach((tx: any) => {
                const date = new Date(tx.data || tx.date);
                const monthYear = `${months[date.getMonth()]}/${date.getFullYear()}`;
                
                if (!evolution[monthYear]) {
                    evolution[monthYear] = { month: monthYear, income: 0, expense: 0 };
                }
                
                const amount = Number(tx.valor || tx.amount || 0);
                const type = tx.tipo || tx.type;
                if (type === 'income' || type === 'receita') {
                    evolution[monthYear].income += amount;
                } else if (type === 'expense' || type === 'despesa') {
                    evolution[monthYear].expense += amount;
                }
            });

            const evolutionList = Object.values(evolution).sort((a: any, b: any) => {
                const [mA, yA] = a.month.split('/');
                const [mB, yB] = b.month.split('/');
                const dateA = new Date(parseInt(yA), months.indexOf(mA));
                const dateB = new Date(parseInt(yB), months.indexOf(mB));
                return dateA.getTime() - dateB.getTime();
            }).map(item => ({
                ...item,
                balance: item.income - item.expense
            }));

            setEvolutionData(evolutionList.slice(-6));
        } catch (error) {
            console.error("Error fetching futuristic report data:", error);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setScanActive(false);
            }, 1000);
        }
    };

    useEffect(() => {
        fetchAllData();

        const handleSwitchView = (e: any) => {
            if (e.detail?.view) {
                setSelectedView(e.detail.view);
            }
        };
        window.addEventListener('focoflow_switch_finance_view', handleSwitchView);
        return () => window.removeEventListener('focoflow_switch_finance_view', handleSwitchView);
    }, [userId]);

    // Derived metrics for "Deep Performance"
    const deepMetrics = useMemo(() => {
        if (!monthlyReport) return null;
        const income = monthlyReport.totalIncome || 0;
        const expense = monthlyReport.totalExpense || 0;
        const balance = monthlyReport.balance || 0;
        
        // Burn Rate (Simplified: daily avg)
        const daysInMonth = new Date().getDate();
        const dailyBurn = expense / daysInMonth;
        
        // Progress to "Financial Freedom" (Mocked target relative to income)
        const targetSavings = income * 0.3;
        const progress = income > 0 ? (Math.max(0, balance) / targetSavings) * 100 : 0;

        return {
            dailyBurn,
            savingsRate: income > 0 ? (balance / income) * 100 : 0,
            financialSecurityProgress: Math.min(100, progress),
            projectedBalance: balance + (income / 30) * (30 - daysInMonth) - dailyBurn * (30 - daysInMonth)
        };
    }, [monthlyReport]);

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-md relative overflow-hidden">
                <div className="absolute inset-0 jarvis-grid opacity-10" />
                <div className="relative z-10 flex flex-col items-center gap-8">
                    <div className="relative">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full border-2 border-dashed border-cyan-400/20"
                        />
                        <motion.div 
                            animate={{ rotate: -360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 w-32 h-32 rounded-full border-t-2 border-cyan-400"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Cpu className="text-cyan-400 animate-pulse" size={40} />
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-mono text-cyan-400 tracking-[0.5em] uppercase animate-pulse">Iniciando_Nucleo_Financeiro</span>
                        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 1 }}
                                className="h-full bg-cyan-400 jarvis-glow"
                             />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-[#05070a]/80 backdrop-blur-xl relative overflow-hidden p-6 md:p-8">
            {/* Background HUD Layers with more animated fun */}
            <div className="absolute inset-0 jarvis-grid opacity-[0.03] pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                 <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/5 blur-[150px] rounded-full animate-pulse" />
                 <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/5 blur-[150px] rounded-full animate-pulse-slow" />
                 
                 {/* Floating animated currency items */}
                 <FloatingIcon icon={Coins} delay={0} x={-40} y={-30} size={32} />
                 <FloatingIcon icon={DollarSign} delay={2} x={30} y={-20} size={24} />
                 <FloatingIcon icon={Wallet} delay={4} x={-20} y={40} size={40} />
                 <FloatingIcon icon={CreditCard} delay={1} x={45} y={35} size={28} />
                 <FloatingIcon icon={TrendingUp} delay={3} x={-35} y={15} size={36} />
            </div>

            {/* Header HUD section */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 relative z-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-400/10 border border-cyan-400/30 rounded-xl">
                            <TrendingUp className="text-cyan-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white uppercase tracking-tighter jarvis-text-glow">FocoFlow <span className="text-cyan-400">Finance</span></h1>
                            <div className="flex items-center gap-4 text-[9px] font-mono text-cyan-400/40 uppercase tracking-[0.2em]">
                                <span>Core_System: Active</span>
                                <span className="w-1 h-1 rounded-full bg-cyan-400" />
                                <span>Ver: 8.4.1_stable</span>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex bg-black/40 border border-white/5 p-1.5 rounded-2xl backdrop-blur-md shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                    {[
                        { id: 'performance', label: 'Performance', icon: Activity },
                        { id: 'goals', label: 'Metas', icon: Target },
                        { id: 'neural', label: 'Insight Dominate', icon: Binary },
                        { id: 'matrix', label: 'Transações', icon: Layers },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedView(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                selectedView === tab.id 
                                ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,242,255,0.4)]' 
                                : 'text-white/40 hover:text-cyan-400 hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={14} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </nav>
            </header>

            {/* Main Operational Container */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-10 relative z-10">
                
                {/* Global Status Bar with bouncy hover effects */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Saldo Atual', value: `R$ ${monthlyReport?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, status: monthlyReport?.balance >= 0 ? 'Lucrativo' : 'Atenção', icon: Wallet, color: 'cyan' },
                        { label: 'Entradas', value: `R$ ${monthlyReport?.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, status: 'Fluxo Positivo', icon: ArrowUpRight, color: 'green' },
                        { label: 'Saídas', value: `R$ ${monthlyReport?.totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, status: 'Fluxo Negativo', icon: ArrowDownRight, color: 'pink' },
                        { label: 'Saúde Geral', value: `${(deepMetrics?.savingsRate || 0).toFixed(1)}%`, status: 'Eficiente', icon: Activity, color: 'purple' },
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-black/30 border border-white/5 rounded-2xl p-5 group hover:border-cyan-400/30 transition-all relative overflow-hidden cursor-default shadow-lg"
                        >
                            <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent group-hover:via-cyan-400/50 transition-all" />
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 bg-white/5 rounded-lg group-hover:bg-${stat.color}-400/10 transition-colors`}>
                                    <stat.icon size={18} className="text-white/40 group-hover:text-cyan-400" />
                                </div>
                                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${stat.color === 'pink' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-400'}`}>{stat.status}</span>
                            </div>
                            <h3 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">{stat.label}</h3>
                            <div className="text-xl font-black text-white group-hover:text-cyan-400 transition-all drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{stat.value}</div>
                            
                            {/* Inner graph sparkline representation */}
                            <div className="mt-4 flex gap-1 h-3 items-end">
                                {[...Array(12)].map((_, j) => (
                                    <motion.div 
                                        key={j}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${20 + Math.random() * 80}%` }}
                                        transition={{ 
                                            repeat: Infinity, 
                                            repeatType: 'reverse', 
                                            duration: 1.5 + Math.random(), 
                                            delay: j * 0.05 
                                        }}
                                        className={`w-full bg-${stat.color}-400/20 rounded-t-sm group-hover:bg-cyan-400/40 transition-colors`}
                                        style={{ backgroundColor: stat.color === 'cyan' ? 'rgba(34,211,238,0.2)' : stat.color === 'green' ? 'rgba(74,222,128,0.2)' : stat.color === 'pink' ? 'rgba(236,72,153,0.2)' : 'rgba(168,85,247,0.2)' }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {selectedView === 'performance' && (
                        <motion.div 
                            key="perf"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            className="space-y-8"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Waves size={100} className="text-cyan-400" />
                                    </div>
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Evolução do Fluxo de Caixa</h3>
                                            <p className="text-[10px] font-mono text-cyan-400/40 uppercase tracking-widest">SISTEMA_DE_VARREDURA_S6</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-[9px] font-mono border border-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f2ff]" /> ENTRADA</div>
                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" /> SAÍDA</div>
                                            <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#fbbf24]" /> SALDO</div>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={evolutionData}>
                                                <defs>
                                                    <linearGradient id="glowCyan" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#00f2ff" stopOpacity={0.2}/>
                                                        <stop offset="100%" stopColor="#00f2ff" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,242,255,0.05)" vertical={false} />
                                                <XAxis 
                                                    dataKey="month" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} 
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }}
                                                    tickFormatter={(val) => `R$${val}`}
                                                />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#05070a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '16px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }}
                                                    itemStyle={{ color: '#00f2ff', fontSize: '11px', fontWeight: 'bold' }}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="income" 
                                                    stroke="#00f2ff" 
                                                    strokeWidth={4} 
                                                    fill="url(#glowCyan)" 
                                                    animationDuration={2000}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="expense" 
                                                    stroke="#ff007f" 
                                                    strokeWidth={4} 
                                                    fill="transparent" 
                                                    strokeDasharray="10 5"
                                                    animationDuration={2500}
                                                />
                                                <Area 
                                                    type="monotone" 
                                                    dataKey="balance" 
                                                    stroke="#fbbf24" 
                                                    strokeWidth={4} 
                                                    fill="transparent" 
                                                    animationDuration={3000}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8 flex flex-col">
                                    <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white mb-10 flex items-center gap-3">
                                        <PieChart size={16} className="text-cyan-400" /> Distribuição Ativa
                                    </h3>
                                    <div className="flex-1 flex flex-col items-center justify-center relative">
                                        <div className="w-full h-[250px] relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RePieChart>
                                                    <Pie
                                                        data={monthlyReport?.categoryBreakdown || []}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={95}
                                                        paddingAngle={10}
                                                        dataKey="value"
                                                        stroke="none"
                                                    >
                                                        {(monthlyReport?.categoryBreakdown || []).map((entry: any, index: number) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                         contentStyle={{ backgroundColor: '#05070a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px' }}
                                                         itemStyle={{ fontSize: '12px' }}
                                                    />
                                                </RePieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none group">
                                                <span className="text-[7px] text-cyan-400/50 uppercase tracking-[0.3em] font-mono">Consumo_Total</span>
                                                <span className="text-2xl font-black text-white group-hover:scale-110 transition-transform">R$ {monthlyReport?.totalExpense.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                            </div>
                                        </div>
                                        <div className="w-full space-y-3 mt-8">
                                            {(monthlyReport?.categoryBreakdown || []).slice(0, 4).map((cat: any, i: number) => (
                                                <div key={i} className="flex flex-col gap-1.5">
                                                    <div className="flex justify-between items-center text-[9px] uppercase tracking-widest font-black">
                                                        <span className="text-white/40 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                                            {cat.name}
                                                        </span>
                                                        <span className="text-white">R$ {cat.value.toFixed(2)}</span>
                                                    </div>
                                                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${(cat.value / monthlyReport.totalExpense) * 100}%` }}
                                                            transition={{ duration: 1.5, delay: i * 0.1 }}
                                                            className="h-full rounded-full"
                                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Growth Metrics Deep Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-gradient-to-br from-cyan-400/10 to-transparent border border-cyan-400/20 p-8 rounded-[2rem] relative group">
                                    <div className="flex flex-col gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                                            <Target size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-cyan-400/60 mb-1 font-mono">Segurança Financeira</h4>
                                            <div className="text-2xl font-black text-white">{deepMetrics?.financialSecurityProgress.toFixed(1)}%</div>
                                            <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${deepMetrics?.financialSecurityProgress}%` }}
                                                    className="h-full bg-cyan-400 shadow-[0_0_10px_#00f2ff]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-8 rounded-[2rem] relative group">
                                    <div className="flex flex-col gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                                            <RefreshCw size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-purple-400/60 mb-1 font-mono">Taxa de Poupança</h4>
                                            <div className="text-2xl font-black text-white">{deepMetrics?.savingsRate.toFixed(1)}%</div>
                                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] mt-1">META: 30.0%</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-400/10 to-transparent border border-orange-400/20 p-8 rounded-[2rem] relative group">
                                    <div className="flex flex-col gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center text-orange-400">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-400/60 mb-1 font-mono">Inconsistências</h4>
                                            <div className="text-2xl font-black text-white">{operationalData?.inconsistencies?.length || 0}</div>
                                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] mt-1">SISTEMA_SCAN_OK</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-green-400/10 to-transparent border border-green-400/20 p-8 rounded-[2rem] relative group">
                                    <div className="flex flex-col gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-green-400/20 border border-green-400/30 flex items-center justify-center text-green-400">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-black uppercase tracking-widest text-green-400/60 mb-1 font-mono">Status Operacional</h4>
                                            <div className="text-2xl font-black text-white">ÓTIMO</div>
                                            <p className="text-[8px] text-white/30 uppercase tracking-[0.2em] mt-1">STABILITY_94%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Deep Performance: Insights Cluster */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-black/60 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden">
                                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400/0 via-cyan-400/50 to-cyan-400/0 animate-pulse" />
                                     <div className="absolute -inset-1 bg-cyan-400/5 blur-xl animate-pulse -z-10 rounded-[3rem]" />
                                     <h3 className="text-xs font-black uppercase tracking-[0.4em] text-cyan-400 mb-8 flex items-center gap-4">
                                         <motion.div
                                            animate={{ rotate: [0, 90, 180, 270, 360] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                         >
                                            <Binary size={16} />
                                         </motion.div>
                                         Digital_Advisor_Insight
                                     </h3>
                                     <div className="space-y-6">
                                         <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-cyan-400/20 transition-all">
                                             <div className="flex items-start gap-4">
                                                 <div className="p-2 bg-cyan-400/10 rounded-lg text-cyan-400 shrink-0">
                                                     <Zap size={18} />
                                                 </div>
                                                 <div>
                                                     <p className="text-sm text-white/90 font-medium mb-1">Otimização de Custos Detectada</p>
                                                     <p className="text-xs text-white/50 leading-relaxed">
                                                         Sua categoria <span className="text-cyan-400">"{monthlyReport?.categoryBreakdown?.[0]?.name || 'Geral'}"</span> representou {(monthlyReport?.categoryBreakdown?.[0]?.value / monthlyReport?.totalExpense * 100).toFixed(1)}% dos gastos. 
                                                         Sugerimos uma revisão de 15% nos custos fixos deste setor para maximizar o seu runway em +22 dias.
                                                     </p>
                                                 </div>
                                             </div>
                                         </div>
                                         <div className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-purple-500/20 transition-all">
                                             <div className="flex items-start gap-4">
                                                 <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 shrink-0">
                                                     <TrendingUp size={18} />
                                                 </div>
                                                 <div>
                                                     <p className="text-sm text-white/90 font-medium mb-1">Padrão de Crescimento de Receita</p>
                                                     <p className="text-xs text-white/50 leading-relaxed">
                                                         Detectamos um padrão de entrada sazonal. Seu fluxo de caixa está se estabilizando. 
                                                         A taxa de retenção de capital atual é de <span className="text-purple-400">{deepMetrics?.savingsRate.toFixed(1)}%</span>.
                                                     </p>
                                                 </div>
                                             </div>
                                         </div>
                                     </div>
                                </div>
                                
                                <div className="bg-black/60 border border-white/5 rounded-[2.5rem] p-8">
                                     <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white mb-8 flex items-center gap-4">
                                         <Activity size={16} className="text-pink-500" /> Métricas de Alta Fidelidade
                                     </h3>
                                     <div className="grid grid-cols-2 gap-6">
                                         {[
                                             { label: 'Volatilidade', value: '1.4%', desc: 'Baixo Risco' },
                                             { label: 'Eficiência', value: `${operationalData?.metrics?.find((m: any) => m.label === 'Eficiência Financeira')?.value || 85}%`, desc: 'Alocação Equilibrada' },
                                             { label: 'Impacto Geral', value: 'Positivo', desc: 'Sustentabilidade' },
                                             { label: 'Previsão Anual', value: `R$ ${(monthlyReport?.balance * 12).toLocaleString('pt-BR')}`, desc: 'Projeção Base' },
                                         ].map((m, i) => (
                                             <div key={i} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col gap-2 group hover:bg-white/[0.05] transition-all">
                                                 <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{m.label}</span>
                                                 <span className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">{m.value}</span>
                                                 <span className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-widest">{m.desc}</span>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {selectedView === 'matrix' && (
                        <motion.div 
                            key="matrix"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="bg-black/40 border border-white/10 rounded-[2.5rem] p-8"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white">Registro Global de Ativos</h3>
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} className="text-cyan-400/40" />
                                    <span className="text-[9px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">Query_Limit: 100_Nodes</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {transactions.slice(0, 10).map((tx, i) => (
                                    <motion.div 
                                        key={tx.uid || i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="group p-4 bg-white/[0.02] hover:bg-cyan-400/[0.05] border border-white/5 hover:border-cyan-400/30 rounded-2xl transition-all flex items-center gap-6"
                                    >
                                        <div className={`p-3 rounded-xl ${tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-pink-500/10 text-pink-500'}`}>
                                            {tx.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{i + 1 < 10 ? `0${i + 1}` : i + 1}</span>
                                                <p className="text-xs font-black text-white group-hover:text-cyan-400 transition-colors uppercase tracking-widest truncate">{tx.description}</p>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 opacity-40">
                                                <span className="text-[8px] font-mono uppercase tracking-widest">{tx.category || 'Geral'}</span>
                                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                                <span className="text-[8px] font-mono uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-black tracking-tight ${tx.type === 'income' ? 'text-green-400' : 'text-pink-500'}`}>
                                            {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {selectedView === 'neural' && (
                        <motion.div 
                            key="neural"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <DominateInsights data={{ summary: monthlyReport, transactions, operational: operationalData }} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-black/40 border border-cyan-400/20 rounded-[2.5rem] p-10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-cyan-400/40 transition-all">
                                    <div className="absolute inset-0 jarvis-grid opacity-5" />
                                    <Database className="text-cyan-400/20 absolute -bottom-10 -right-10 w-64 h-64 rotate-12" />
                                    
                                    <div className="relative z-10 text-center">
                                    <div className="w-20 h-20 rounded-full bg-cyan-400/10 border border-cyan-400/40 flex items-center justify-center mx-auto mb-8 jarvis-glow">
                                        <Binary className="text-cyan-400 animate-pulse" size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] mb-4">Módulo de IA Financeira</h3>
                                    <p className="text-white/60 text-sm font-light leading-relaxed mb-8 max-w-sm mx-auto">
                                        Analizando trilhões de bytes de dados de transações para identificar padrões de gastos e oportunidades de otimização de ativos.
                                    </p>
                                    <div className="p-6 bg-cyan-500/5 border border-cyan-400/20 rounded-2xl text-left space-y-4">
                                        <h4 className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-4">Destaques_da_Analise:</h4>
                                        {operationalData?.inconsistencies?.map((inc: string, i: number) => (
                                            <div key={i} className="flex gap-4 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0" />
                                                <p className="text-[11px] text-white/80 font-medium leading-tight">{inc}</p>
                                            </div>
                                        ))}
                                        {!operationalData?.inconsistencies?.length && (
                                             <div className="flex gap-4 items-start">
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1 shrink-0 shadow-[0_0_10px_#4ade80]" />
                                                <p className="text-[11px] text-white/80 font-medium leading-tight">Nenhuma anomalia crítica detectada no perído atual. Estabilidade sistêmica confirmada.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-black/40 border border-white/5 rounded-[2rem] p-8">
                                    <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                        <Target size={16} className="text-purple-400" /> Projeção de Ativos
                                    </h4>
                                    <div className="space-y-6">
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-mono mb-2">
                                                <span className="text-white/40">Saldo Projetado Final</span>
                                                <span className="text-white">R$ {deepMetrics?.projectedBalance.toLocaleString('pt-BR')}</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-purple-500 w-[65%]" />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] uppercase font-mono mb-2">
                                                <span className="text-white/40">Índice de Volatilidade</span>
                                                <span className="text-white">BAIXO_1.2%</span>
                                            </div>
                                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-cyan-400 w-[15%]" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-cyan-400/20 to-purple-500/20 border border-white/10 rounded-[2rem] p-8 relative overflow-hidden">
                                    <div className="absolute inset-0 jarvis-grid opacity-20" />
                                    <div className="relative z-10 flex flex-col items-center">
                                         <Shield className="text-white mb-4" size={32} />
                                         <h4 className="text-sm font-black text-white uppercase tracking-widest text-center">Protocolo de Backup Ativo</h4>
                                         <p className="text-[10px] text-white/60 text-center mt-2 max-w-[200px]">Dados protegidos pelo núcleo ATLAS. redundância de segurança triple-layer ativa.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    )}
                    {selectedView === 'goals' && (
                        <motion.div 
                            key="goals"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 p-6 rounded-[2rem] border border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                                        <Target className="text-cyan-400" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-[0.2em]">Metas de Expansão</h3>
                                        <p className="text-[10px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">Nível_do_Usuário: Platinum_Asset</p>
                                    </div>
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(6,182,212,0.5)" }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-4 bg-cyan-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg transition-all flex items-center gap-3"
                                    onClick={() => {/* Open Modal to create goal */}}
                                >
                                    <Plus size={18} strokeWidth={3} />
                                    Definir Nova Meta
                                </motion.button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {goals.length > 0 ? goals.map(goal => (
                                    <FinancialGoalCard 
                                        key={goal.id} 
                                        goal={goal} 
                                        onDelete={() => {}} 
                                        onUpdate={() => {}} 
                                    />
                                )) : (
                                    <div className="col-span-full py-20 flex flex-col items-center text-white/20">
                                        <Target size={64} className="mb-4 opacity-10" />
                                        <p className="text-xs uppercase tracking-widest font-mono">Nenhuma meta ativa de expansão detectada</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/30 border border-white/5 rounded-[2rem] p-8">
                                <div className="flex items-center gap-4 mb-6">
                                    <BarChart3 className="text-purple-400" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-widest">Análise de Curto Prazo vs Longo Prazo</h4>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ReBarChart data={[
                                            { name: 'Emergência', current: 5000, target: 10000 },
                                            { name: 'Viagem', current: 2000, target: 8000 },
                                            { name: 'Investimento', current: 15000, target: 50000 },
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="white" strokeOpacity={0.05} vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'white', fillOpacity: 0.4, fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'white', fillOpacity: 0.4, fontSize: 10 }} />
                                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)' }} />
                                            <Bar dataKey="current" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="target" fill="rgba(255,255,255,0.1)" radius={[4, 4, 0, 0]} />
                                        </ReBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            {/* Bottom System Actions */}
            <footer className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                <div className="flex items-center gap-8">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[7px] font-mono text-white/30 uppercase tracking-widest">Sincronização_Rede</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f2ff]" />
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">PROTOCOLO_LINK</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => {/* UI to open transaction form */}}
                        className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-cyan-400 hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <Plus size={14} /> Nova Transação
                    </button>
                    <button 
                        onClick={fetchAllData}
                        disabled={scanActive}
                        className={`px-8 py-3 bg-cyan-500 text-black rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all jarvis-glow shadow-[0_0_20px_rgba(0,242,255,0.3)] flex items-center gap-3 ${scanActive ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                    >
                        <RefreshCw size={14} className={scanActive ? 'animate-spin' : ''} />
                        Reiniciar Varredura
                    </button>
                </div>
            </footer>
        </div>
    );
};
