import React from 'react';
import { Eye, Download, MoreVertical } from 'lucide-react';
import { motion } from 'motion/react';

const historyData = [
  { month: 'Março/2026', income: 'R$ 5.000,00', expense: 'R$ 3.500,00', balance: 'R$ 1.500,00', status: 'positive' },
  { month: 'Fevereiro/2026', income: 'R$ 4.800,00', expense: 'R$ 4.200,00', balance: 'R$ 600,00', status: 'positive' },
  { month: 'Janeiro/2026', income: 'R$ 6.200,00', expense: 'R$ 3.800,00', balance: 'R$ 2.400,00', status: 'positive' },
];

export const MonthlyHistory: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Histórico Mensal</h3>
        <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Ver todos</button>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-[10px] uppercase tracking-widest font-bold text-slate-600 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Mês</th>
              <th className="px-4 py-3">Receitas</th>
              <th className="px-4 py-3">Despesas</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {historyData.map((item, index) => (
              <motion.tr 
                key={item.month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group hover:bg-slate-800/20 transition-all"
              >
                <td className="px-4 py-4 font-bold text-white">{item.month}</td>
                <td className="px-4 py-4 text-green-400 font-medium">{item.income}</td>
                <td className="px-4 py-4 text-red-400 font-medium">{item.expense}</td>
                <td className="px-4 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'positive' ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'bg-red-600/10 text-red-400 border border-red-500/20'
                  }`}>
                    {item.balance}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-blue-400 transition-all">
                      <Eye size={14} />
                    </button>
                    <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-blue-400 transition-all">
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
