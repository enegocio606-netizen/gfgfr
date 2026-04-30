import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  CircleDot,
  Hexagon,
  Activity,
  CreditCard,
  Users,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Plus,
  RefreshCw,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  ShieldCheck,
  FileText,
  Zap
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from 'recharts';
import { 
  getFinancialSummary, 
  getMonthlyFinancialReport, 
  getFocoFlowData, 
  getOperationalAnalysis 
} from '../../../services/focoFlowService';
import { auth } from '../../../firebase';

interface FinanceCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: any;
  color: string;
  trend?: { value: string; isPositive: boolean };
}

const FinanceCard: React.FC<FinanceCardProps> = ({ label, value, subtext, icon: Icon, color, trend }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="relative jarvis-glass p-5 group flex flex-col gap-3 overflow-hidden border border-white/5 shadow-[0_0_20px_rgba(0,0,0,0.3)]"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 transition-opacity group-hover:opacity-20`} style={{ backgroundColor: color }} />
    
    <div className="flex justify-between items-start relative z-10">
      <div className="flex flex-col">
        <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-400/40 uppercase font-mono">{label}</span>
        <h3 className="text-2xl font-black text-white jarvis-text-glow mt-1">{value}</h3>
      </div>
      <div className="w-9 h-12 border border-cyan-400/20 flex items-center justify-center bg-white/5 group-hover:border-cyan-400 group-hover:bg-cyan-400/10 transition-all">
        <Icon size={18} className="text-cyan-400" />
      </div>
    </div>

    <div className="flex items-center justify-between mt-auto pt-2">
      <p className="text-[9px] text-white/30 tracking-wider font-mono uppercase">{subtext}</p>
      {trend && (
        <span className={`text-[9px] font-bold ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.value}
        </span>
      )}
    </div>

    <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/20" />
    <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/20" />
  </motion.div>
);

interface JarvisFinanceProps {
  initialView?: 'overview' | 'detailed' | 'dashboard';
}

import JarvisNewTransactionModal from './JarvisNewTransactionModal';

const JarvisFinance: React.FC<JarvisFinanceProps> = ({ initialView = 'dashboard' }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    realBalance: 0,
    income: 0,
    expense: 0,
    toReceive: 0,
    toPay: 0,
    thirdPartiesBalance: 0
  });

  const [report, setReport] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    categoryBreakdown: [] as { name: string, value: number }[]
  });

  const [analysis, setAnalysis] = useState({
    metrics: [] as any[],
    inconsistencies: [] as string[]
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    fetchData();
    window.addEventListener('focoflow_refresh', fetchData);
    return () => window.removeEventListener('focoflow_refresh', fetchData);
  }, []);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const [sum, rep, ana, accData, transData] = await Promise.all([
        getFinancialSummary(user.uid),
        getMonthlyFinancialReport(user.uid),
        getOperationalAnalysis(user.uid),
        getFocoFlowData(user.uid, 'contas_focoflow', 20),
        getFocoFlowData(user.uid, 'transacoes_financeiras_focoflow', 100)
      ]);

      setSummary(sum);
      setReport({
        totalIncome: rep.totalIncome,
        totalExpense: rep.totalExpense,
        balance: rep.balance,
        categoryBreakdown: rep.categoryBreakdown
      });
      setAnalysis(ana);
      setAccounts(accData);
      
      const sorted = transData.sort((a: any, b: any) => (b.data || 0) - (a.data || 0));
      setTransactions(sorted);

      // Process Evolution Data (last 6 months)
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const evolutionMap: { [key: string]: any } = {};
      
      transData.forEach((tx: any) => {
        const d = new Date(tx.data);
        const key = `${months[d.getMonth()]}/${d.getFullYear()}`;
        if (!evolutionMap[key]) evolutionMap[key] = { name: key, receita: 0, despesa: 0 };
        if (tx.tipo === 'income' || tx.tipo === 'receita') evolutionMap[key].receita += (tx.valor || tx.amount || 0);
        else evolutionMap[key].despesa += (tx.valor || tx.amount || 0);
      });

      const evolution = Object.values(evolutionMap).sort((a: any, b: any) => {
          const [mA, yA] = a.name.split('/');
          const [mB, yB] = b.name.split('/');
          const dateA = new Date(parseInt(yA), months.indexOf(mA));
          const dateB = new Date(parseInt(yB), months.indexOf(mB));
          return dateA.getTime() - dateB.getTime();
      }).map(item => ({
          ...item,
          saldo: item.receita - item.despesa
      })).slice(-6);
      
      setEvolutionData(evolution);

    } catch (error) {
      console.error("Jarvis Finance Link Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const openTransactionModal = (type: 'income' | 'expense') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const COLORS = ['#00f2ff', '#8b5cf6', '#00ff9d', '#ff9d00', '#ff007f', '#22d3ee'];

  if (loading && transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-2 border-cyan-400/20 border-t-cyan-400 animate-spin" />
        <span className="text-cyan-400/40 text-[10px] font-mono tracking-[0.6em] uppercase animate-pulse">Sincronizando_Fluxo_Financeiro</span>
      </div>
    );
  }

  // Find efficiency metric
  const efficiencyMetric = analysis.metrics.find(m => m.label.includes('Eficiência')) || { value: 75 };
  const riskMetric = analysis.metrics.find(m => m.label.includes('Risco')) || { value: 20 };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full relative">
      <div className="absolute inset-0 jarvis-grid opacity-[0.03] pointer-events-none" />
      
      {/* HEADER: KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <FinanceCard 
          label="Saldo Consolidado" 
          value={`R$ ${summary.realBalance.toLocaleString('pt-BR')}`}
          subtext="Disponível em Contas"
          icon={Wallet}
          color="#00f2ff"
          trend={{ value: "+4.2%", isPositive: true }}
        />
        <FinanceCard 
          label="Receita Mensal" 
          value={`R$ ${summary.income.toLocaleString('pt-BR')}`}
          subtext={`${transactions.filter(t => t.tipo === 'income').length} Transações`}
          icon={TrendingUp}
          color="#00ff9d"
          trend={{ value: "+12%", isPositive: true }}
        />
        <FinanceCard 
          label="Despesa Mensal" 
          value={`R$ ${summary.expense.toLocaleString('pt-BR')}`}
          subtext="Fluxo de Saída"
          icon={TrendingDown}
          color="#ff4b4b"
          trend={{ value: "-5.1%", isPositive: false }}
        />
        <FinanceCard 
          label="Projeção Mensal" 
          value={`R$ ${(summary.income - summary.expense).toLocaleString('pt-BR')}`}
          subtext="Resultado Estimado"
          icon={Activity}
          color="#8b5cf6"
          trend={{ value: "Em curso", isPositive: true }}
        />
      </div>

      {/* MAIN ANALYTICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* EVOLUTION CHART */}
        <div className="lg:col-span-8 jarvis-glass p-6 border border-white/5 relative overflow-hidden flex flex-col gap-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layers className="text-cyan-400" size={16} />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Evolução_Financeira_Semestral</span>
            </div>
            <div className="flex gap-4 text-[8px] font-mono tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> RECEITA</div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> DESPESA</div>
              <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> SALDO</div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData}>
                <defs>
                  <linearGradient id="receitaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="despesaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4b4b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ff4b4b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} />
                <Tooltip contentStyle={{ background: 'rgba(0,10,20,0.95)', border: '1px solid rgba(0,242,255,0.2)', fontSize: '10px' }} />
                <Area type="monotone" dataKey="receita" stroke="#00f2ff" strokeWidth={3} fill="url(#receitaGrad)" />
                <Area type="monotone" dataKey="despesa" stroke="#ff4b4b" strokeWidth={2} strokeDasharray="5 5" fill="url(#despesaGrad)" />
                <Area type="monotone" dataKey="saldo" stroke="#fbbf24" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DRE SUMMARY */}
        <div className="lg:col-span-4 jarvis-glass p-6 border border-white/5 relative overflow-hidden flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <PieChartIcon className="text-purple-400" size={16} />
            <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">DRE_Sintético</span>
          </div>
          <div className="space-y-3 font-mono">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[9px] text-white/40 uppercase">Receita Bruta</span>
              <span className="text-xs font-bold text-white">R$ {summary.income.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[9px] text-white/40 uppercase">Custos Fiscais</span>
              <span className="text-xs font-bold text-red-400">- R$ {(summary.income * 0.06).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10 bg-white/5 px-2">
              <span className="text-[9px] text-cyan-400 font-bold uppercase">Líquido Operacional</span>
              <span className="text-xs font-black text-cyan-400">R$ {(summary.income * 0.94).toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-[9px] text-white/40 uppercase">Demos. Despesas</span>
              <span className="text-xs font-bold text-red-500">- R$ {summary.expense.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center py-4 mt-2 bg-cyan-400/10 px-3 border border-cyan-400/20">
              <span className="text-[10px] font-black text-white uppercase">EBITDA_ESTIMADO</span>
              <span className="text-sm font-black text-cyan-400 jarvis-text-glow">
                R$ {(summary.income - summary.expense).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Margem Líquida</span>
              <span className="text-xs font-bold text-green-400">{((summary.income - summary.expense) / (summary.income || 1) * 100).toFixed(1)}%</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-white/20 uppercase tracking-[0.2em]">Eficiência</span>
              <span className="text-xs font-bold text-purple-400">{efficiencyMetric.value}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* OPERATIONS & DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 pb-8">
        {/* RECENT TRANSACTIONS */}
        <div className="lg:col-span-5 jarvis-glass p-6 border border-white/5 relative overflow-hidden flex flex-col gap-4 max-h-[500px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="text-cyan-400" size={16} />
              <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Histórico_Operacional</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openTransactionModal('income')} className="p-1.5 hover:bg-green-500/10 text-green-400 transition-colors border border-green-400/20"><Plus size={14}/></button>
              <button onClick={() => openTransactionModal('expense')} className="p-1.5 hover:bg-red-500/10 text-red-400 transition-colors border border-red-400/20"><TrendingDown size={14}/></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
            {transactions.slice(0, 20).map((tx, idx) => (
              <div key={tx.id || idx} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:border-cyan-400/30 transition-all group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center border ${tx.tipo === 'income' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {tx.tipo === 'income' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-white uppercase truncate max-w-[120px]">{tx.descricao || 'Transação'}</span>
                    <span className="text-[7px] text-white/30 font-mono">{new Date(tx.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
                <span className={`text-[11px] font-black ${tx.tipo === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.tipo === 'income' ? '+' : '-'} R$ {Number(tx.valor).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CATEGORY BREAKDOWN */}
        <div className="lg:col-span-4 jarvis-glass p-6 border border-white/5 relative overflow-hidden flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Hexagon className="text-orange-400" size={16} />
            <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Alocação_por_Categoria</span>
          </div>
          <div className="flex-1 min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.categoryBreakdown.length > 0 ? report.categoryBreakdown : [{ name: 'N/A', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {report.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', fontSize: '10px' }} />
                </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {report.categoryBreakdown.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[8px] text-white/50 uppercase truncate">{cat.name}</span>
                <span className="text-[8px] font-bold text-white ml-auto">{((cat.value / report.totalExpense) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* SMART METRICS & RISK */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="jarvis-glass p-5 border border-white/5 flex flex-col gap-4 flex-1">
             <div className="flex items-center gap-3">
                <ShieldCheck className="text-blue-400" size={16} />
                <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase">Metricas_de_Segurança</span>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <div>
                      <span className="text-[8px] text-white/30 uppercase block">Risco de Caixa</span>
                      <span className={`text-sm font-black ${riskMetric.value > 50 ? 'text-red-500' : 'text-green-500'}`}>
                        {riskMetric.value > 50 ? 'ELEVADO' : 'CONTROLADO'}
                      </span>
                   </div>
                   <span className="text-lg font-black text-white">{riskMetric.value}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                   <div className={`h-full ${riskMetric.value > 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${riskMetric.value}%` }} />
                </div>
                
                <div className="pt-2">
                   <span className="text-[8px] text-white/30 uppercase block mb-2">Inconsistências Detectadas</span>
                   <div className="space-y-1">
                      {analysis.inconsistencies.length > 0 ? analysis.inconsistencies.slice(0, 2).map((inc, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-red-500/5 border border-red-500/10">
                           <AlertTriangle size={10} className="text-red-500 mt-0.5" />
                           <span className="text-[8px] text-red-200/60 leading-tight">{inc}</span>
                        </div>
                      )) : (
                        <div className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/10">
                           <ShieldCheck size={10} className="text-green-500" />
                           <span className="text-[8px] text-green-400/60 font-mono">INTEGRIDADE_CONFIRMADA</span>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
          
          <div className="jarvis-glass p-5 border border-white/5 flex flex-col gap-2">
             <span className="text-[8px] text-white/30 uppercase tracking-[0.2em]">Sync_Status</span>
             <div className="flex items-center gap-2">
                <RefreshCw size={10} className="text-cyan-400 animate-spin" />
                <span className="text-[10px] font-mono text-cyan-400/60">CONEXÃO_ESTÁVEL_V8.4</span>
             </div>
          </div>
        </div>
      </div>

      <JarvisNewTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default JarvisFinance;
