import React from 'react';
import { Plus, Search, Filter, MoreVertical, FileText } from 'lucide-react';
import { motion } from 'motion/react';

export const RecentTransactions: React.FC = () => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-white tracking-tight">Transações Recentes</h3>
          <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">0 Total</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-blue-400 transition-all">
            <Search size={16} />
          </button>
          <button className="p-2 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-blue-400 transition-all">
            <Filter size={16} />
          </button>
          <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors ml-2">Ver todas</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-3xl bg-slate-800/30 border border-slate-700 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]"
        >
          <FileText size={32} className="text-slate-600 drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
        </motion.div>
        <h4 className="text-white font-bold text-lg mb-2">Nenhuma transação encontrada</h4>
        <p className="text-slate-500 text-sm max-w-[240px] mb-8">Suas transações aparecerão aqui assim que você começar a registrar via voz.</p>
        
        {/* Manual add button removed - Voice input only */}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <div className="grid grid-cols-5 text-[10px] uppercase tracking-widest font-bold text-slate-600 mb-4 px-4">
          <span className="col-span-1">Data</span>
          <span className="col-span-2">Descrição</span>
          <span className="col-span-1">Categoria</span>
          <span className="col-span-1 text-right">Valor</span>
        </div>
      </div>
    </div>
  );
};
