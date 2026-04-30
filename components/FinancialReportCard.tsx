import React from 'react';
import { BarChart3 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface FinancialReportData {
    period: string;
    totalIncome: number;
    totalExpense: number;
    balance: number;
    categoryBreakdown: { name: string; value: number }[];
}

const COLORS = ['#00f2ff', '#8b5cf6', '#00ff9d', '#ff9d00', '#ff007f', '#22d3ee'];

const FinancialReportCard: React.FC<{ data: FinancialReportData }> = ({ data }) => {
    if (!data) return null;
    const totalIncome = data.totalIncome || 0;
    const totalExpense = data.totalExpense || 0;
    const balance = data.balance || 0;
    const { categoryBreakdown, period } = data;

    const barData = [
        { name: 'Receitas', value: totalIncome, fill: '#00ff9d' },
        { name: 'Despesas', value: totalExpense, fill: '#ff007f' },
    ];

    return (
        <div className="bg-black/60 backdrop-blur-xl border border-cyan-400/20 rounded-3xl p-6 my-4 shadow-[0_0_30px_rgba(0,242,255,0.1)] w-full max-w-md mx-auto relative overflow-hidden group">
            {/* HUD Decorative Elements */}
            <div className="absolute top-0 left-0 w-2 h-2 border-l-2 border-t-2 border-cyan-400/40 rounded-tl-lg" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-cyan-400/40 rounded-br-lg" />
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BarChart3 size={80} className="text-cyan-400" />
            </div>

            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <div className="flex flex-col">
                    <span className="text-[8px] font-mono text-cyan-400/60 uppercase tracking-[0.4em]">Report_Summary</span>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{period}</h3>
                </div>
                <div className="text-right">
                    <span className={`text-xs font-black px-3 py-1 rounded-full border ${balance >= 0 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                        {balance >= 0 ? '+' : ''} R$ {balance.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-green-400/20 transition-all">
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1 font-mono">Receitas_In</p>
                    <p className="text-green-400 font-black text-lg tracking-tight">R$ {totalIncome.toLocaleString('pt-BR')}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 group-hover:border-red-500/20 transition-all">
                    <p className="text-[8px] text-white/30 uppercase tracking-widest mb-1 font-mono">Despesas_Out</p>
                    <p className="text-pink-500 font-black text-lg tracking-tight">R$ {totalExpense.toLocaleString('pt-BR')}</p>
                </div>
            </div>

            {/* Income vs Expense Bar Chart */}
            <div className="h-44 w-full mb-8 bg-black/20 rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={60} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#05070a', border: '1px solid rgba(0,242,255,0.2)', borderRadius: '12px' }}
                            itemStyle={{ color: '#00f2ff', fontSize: '10px' }}
                            formatter={(value: number) => [`R$ ${(value || 0).toFixed(2)}`, '']}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                            {barData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Expense Breakdown */}
            {categoryBreakdown && categoryBreakdown.length > 0 && (
                <div className="space-y-4">
                    <p className="text-[8px] text-white/30 uppercase tracking-[0.4em] mb-4 font-mono text-center">Neural_Category_Map</p>
                    <div className="grid grid-cols-2 gap-3">
                         {categoryBreakdown.slice(0, 4).map((entry, index) => (
                             <div key={index} className="flex flex-col gap-1 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                 <div className="flex justify-between items-center">
                                     <span className="text-[8px] font-black text-white/50 truncate pr-2 uppercase tracking-tighter">{entry.name}</span>
                                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                 </div>
                                 <span className="text-[10px] font-black text-white">R$ {entry.value.toFixed(0)}</span>
                             </div>
                         ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinancialReportCard;
