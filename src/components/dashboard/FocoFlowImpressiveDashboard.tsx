import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Zap, 
    TrendingUp, 
    DollarSign, 
    Activity, 
    Calendar,
    Bell,
    Settings,
    ChevronRight,
    Target
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from 'recharts';

// Data placeholders for functionality
const taskData = [
    { name: 'SEG', v: 5 }, { name: 'TER', v: 10 }, { name: 'QUA', v: 8 }, 
    { name: 'QUI', v: 18 }, { name: 'SEX', v: 12 }, { name: 'SAB', v: 15 }, { name: 'DOM', v: 8 }
];
const financeData = [
    { name: 'Jan', val: 1200 }, { name: 'Fev', val: 1900 }, { name: 'Mar', val: 1500 }, 
    { name: 'Abr', val: 2400 }, { name: 'Mai', val: 2100 }, { name: 'Jun', val: 2800 }
];

const GlassPanel = ({ children, className = "", title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`agent-card-glass p-6 rounded-none border border-cyan-500/20 backdrop-blur-md ${className}`}
    >
        {title && (
            <div className="flex items-center gap-2 mb-4">
                {Icon && <Icon className="text-cyan-400" size={16} />}
                <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-100">{title}</h3>
            </div>
        )}
        {children}
    </motion.div>
);

const MetricCard = ({ title, value, trend, icon: Icon, colorClass }: { title: string, value: string, trend: string, icon: any, colorClass: string }) => (
    <div className={`agent-card-glass p-5 border-l-2 ${colorClass} hover:bg-white/5 transition-colors`}>
        <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold uppercase text-gray-400">{title}</span>
            <Icon className="text-cyan-500/50" size={16} />
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-[10px] text-cyan-400/70 mt-1">{trend}</div>
    </div>
);

const FocoFlowImpressiveDashboard: React.FC = () => {
  return (
    <div className="grid grid-cols-12 gap-6 p-6 h-full overflow-y-auto bg-[#010409]">
        
        {/* Header/Quick Action */}
        <div className="col-span-12 flex justify-between items-center bg-black/40 p-6 border border-cyan-500/20 backdrop-blur-sm">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight italic">FocoFlow <span className="text-cyan-400 font-normal not-italic">NX</span></h1>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Sistema de Otimização Cognitiva e Financeira</p>
            </div>
            <button className="bg-cyan-500/10 border border-cyan-500 text-cyan-400 px-6 py-2 flex items-center gap-2 hover:bg-cyan-500 hover:text-white transition-all uppercase text-xs font-bold">
                <Plus size={16} /> Nova Ação
            </button>
        </div>

        {/* Metrics Row */}
        <div className="col-span-12 grid grid-cols-4 gap-6">
            <MetricCard title="Fluxo de Caixa" value="R$ 14.500" trend="+12% esse mês" icon={DollarSign} colorClass="border-cyan-500" />
            <MetricCard title="Tarefas Ativas" value="18" trend="3 com alta prioridade" icon={Zap} colorClass="border-purple-500" />
            <MetricCard title="Metas Batidas" value="84%" trend="Em ritmo acelerado" icon={Target} colorClass="border-green-500" />
            <MetricCard title="Produtividade" value="92 pts" trend="+5 pts hoje" icon={Activity} colorClass="border-orange-500" />
        </div>

        {/* Charts Section */}
        <GlassPanel className="col-span-8 h-80" title="Performance Financeira" icon={TrendingUp}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financeData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#00f2ff' }} />
                  <Area type="monotone" dataKey="val" stroke="#00f2ff" fillOpacity={1} fill="url(#colorVal)" />
                </AreaChart>
            </ResponsiveContainer>
        </GlassPanel>

        {/* Aside/List Section */}
        <GlassPanel className="col-span-4 h-80" title="Próximas Tarefas" icon={Calendar}>
             <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                     <div key={i} className="flex items-center justify-between p-3 border border-white/5 hover:border-cyan-500/50 transition-colors">
                         <div className="text-xs text-white">Reunião de Projeto Alpha</div>
                         <ChevronRight size={14} className="text-cyan-500" />
                     </div>
                 ))}
             </div>
        </GlassPanel>

    </div>
  );
};

export default FocoFlowImpressiveDashboard;
