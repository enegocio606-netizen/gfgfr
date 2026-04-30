import React from 'react';
import { Wallet, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { motion } from 'motion/react';

interface CardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  glow: string;
  percentage?: string;
}

const Card: React.FC<CardProps> = ({ title, value, subtitle, icon: Icon, color, glow, percentage }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={`p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800 hover:border-${color}-500/30 transition-all duration-300 relative overflow-hidden group shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-${color}-500/20 transition-all duration-500`}></div>
    
    <div className="flex items-center justify-between mb-4">
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
      <div className={`p-2 rounded-xl bg-slate-800/50 border border-slate-700 text-${color}-400 shadow-[0_0_15px_rgba(var(--${glow}),0.2)]`}>
        <Icon size={20} />
      </div>
    </div>

    <div className="flex flex-col">
      <h3 className={`text-2xl font-bold text-white tracking-tight drop-shadow-[0_0_10px_rgba(var(--${glow}),0.3)]`}>{value}</h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-slate-500">{subtitle}</span>
        {percentage && (
          <span className={`text-[10px] font-bold text-${color}-400 flex items-center gap-0.5`}>
            {percentage.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {percentage}
          </span>
        )}
      </div>
    </div>
  </motion.div>
);

export const SummaryCards: React.FC<{ summary?: any }> = ({ summary }) => {
  const realBalance = summary?.realBalance || 0;
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  const savings = income - expense;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card 
        title="Saldo Atual" 
        value={`R$ ${realBalance.toFixed(2)}`} 
        subtitle="Disponível para uso" 
        icon={Wallet} 
        color="blue" 
        glow="59,130,246"
      />
      <Card 
        title="Entradas do mês" 
        value={`R$ ${income.toFixed(2)}`} 
        subtitle="Total recebido" 
        icon={TrendingUp} 
        color="green" 
        glow="34,197,94"
      />
      <Card 
        title="Saídas do mês" 
        value={`R$ ${expense.toFixed(2)}`} 
        subtitle="Total gasto" 
        icon={TrendingDown} 
        color="red" 
        glow="239,68,68"
      />
      <Card 
        title="Economia do mês" 
        value={`R$ ${savings.toFixed(2)}`} 
        subtitle="Total economizado" 
        icon={Target} 
        color="purple" 
        glow="168,85,247"
      />
    </div>
  );
};
