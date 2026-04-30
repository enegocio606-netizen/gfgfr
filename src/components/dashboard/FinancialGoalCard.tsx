import React from 'react';
import { motion } from 'motion/react';
import { Target, Calendar, Trash2, Edit3, CheckCircle2, Sparkles, Star } from 'lucide-react';
import { FocoFlowFinancialGoal } from '../../../services/focoFlowService';

interface FinancialGoalCardProps {
    goal: FocoFlowFinancialGoal;
    onDelete?: (id: string) => void;
    onUpdate?: (id: string, current: number) => void;
}

export const FinancialGoalCard: React.FC<FinancialGoalCardProps> = ({ goal, onDelete, onUpdate }) => {
    const progress = Math.min(100, (goal.valor_atual / goal.valor_alvo) * 100);
    const isCompleted = goal.status === 'completed' || progress >= 100;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02, rotate: [0, -0.5, 0.5, 0] }}
            className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-cyan-400/30 transition-all shadow-2xl"
        >
            {isCompleted && (
                <div className="absolute inset-0 pointer-events-none">
                    <motion.div 
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute top-4 right-4"
                    >
                        <Sparkles className="text-yellow-400" size={32} />
                    </motion.div>
                </div>
            )}

            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                <Target size={100} style={{ color: goal.cor || '#00f2ff' }} />
            </div>

            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="p-3.5 rounded-2xl border border-white/10 shadow-lg" 
                        style={{ backgroundColor: `${goal.cor || '#00f2ff'}15`, color: goal.cor || '#00f2ff' }}
                    >
                        <Target size={24} />
                    </motion.div>
                    <div>
                        <h4 className="text-base font-black text-white uppercase tracking-wider">{goal.titulo}</h4>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: goal.cor || '#00f2ff' }} />
                            <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-mono">{goal.categoria || 'NÚCLEO_ATIVO'}</p>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => onUpdate?.(goal.id, goal.valor_atual)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-cyan-400"
                    >
                        <Edit3 size={14} />
                    </button>
                    <button 
                        onClick={() => onDelete?.(goal.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-red-500"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <span className="text-[8px] text-white/30 uppercase tracking-widest block mb-1">Progresso</span>
                        <div className="text-lg font-black text-white">
                            R$ {goal.valor_atual.toLocaleString('pt-BR')} <span className="text-white/20 text-[10px]">/ R$ {goal.valor_alvo.toLocaleString('pt-BR')}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs font-black" style={{ color: goal.cor || '#00f2ff' }}>{progress.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "backOut" }}
                        className="h-full relative rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        style={{ backgroundColor: goal.cor || '#00f2ff' }}
                    >
                        <motion.div 
                            animate={{ x: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />
                    </motion.div>
                </div>

                <div className="flex justify-between items-center pt-2">
                    {goal.prazo ? (
                        <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-mono">
                            <Calendar size={12} />
                            {new Date(goal.prazo).toLocaleDateString('pt-BR')}
                        </div>
                    ) : <div />}
                    
                    {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-[9px] text-green-400 font-black uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Meta Atingida
                        </div>
                    ) : (
                        <div className="text-[9px] text-cyan-400/40 font-mono tracking-widest animate-pulse">EM_PROCESSO</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
