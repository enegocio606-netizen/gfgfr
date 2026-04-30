import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'motion/react';

const data = [
  { name: 'Moradia', value: 40, color: '#3b82f6' },
  { name: 'Alimentação', value: 25, color: '#22c55e' },
  { name: 'Transporte', value: 15, color: '#eab308' },
  { name: 'Saúde', value: 10, color: '#ef4444' },
  { name: 'Lazer', value: 5, color: '#a855f7' },
  { name: 'Outros', value: 5, color: '#64748b' },
];

export const CategoryChart: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-900 tracking-tight">Gastos por Categoria</h3>
        <select className="bg-slate-100 border border-slate-200 text-xs text-slate-600 rounded-lg px-2 py-1 outline-none focus:border-blue-500/50 transition-all">
          <option>Este Mês</option>
          <option>Mês Passado</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="w-full h-64 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#0f172a'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900">R$ 0,00</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Total</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {data.map((item) => (
            <div key={item.name} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}></div>
                <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">{item.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold text-slate-500">{item.value}%</span>
                <span className="text-xs font-bold text-slate-900 w-16 text-right">R$ 0,00</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
