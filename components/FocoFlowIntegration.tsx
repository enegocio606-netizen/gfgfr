import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X, Cpu, Database, Activity, Zap } from 'lucide-react';

interface FocoFlowIntegrationProps {
    isOpen: boolean;
    onClose: () => void;
}

const FocoFlowIntegration: React.FC<FocoFlowIntegrationProps> = ({ isOpen, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative jarvis-glass max-w-md w-full overflow-hidden rounded-[2rem] border border-cyan-400/20 shadow-[0_0_50px_rgba(0,242,255,0.15)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* HUD Animated background */}
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                             <div className="absolute inset-0 jarvis-grid" />
                             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-jarvis-scanning-v" />
                        </div>

                        {/* HUD Decor Corners */}
                        <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-cyan-400/40 rounded-tl-xl" />
                        <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-cyan-400/40 rounded-br-xl" />

                        <div className="relative z-10 p-8 pt-12 text-center">
                            <motion.button 
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose} 
                                className="absolute top-6 right-6 p-2 bg-white/5 border border-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <X size={20} />
                            </motion.button>

                            <motion.div 
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', damping: 12, delay: 0.2 }}
                                className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6 jarvis-glow shadow-[0_0_30px_#00f2ff33]"
                            >
                                <ShieldCheck className="text-cyan-400 animate-pulse" size={40} />
                            </motion.div>

                            <h2 className="text-[10px] font-black tracking-[0.5em] text-cyan-400 uppercase mb-2">SYST_INTEGRATION_V4</h2>
                            <h3 className="text-3xl font-black text-white jarvis-text-glow uppercase mb-4 tracking-tight">Sincronização Ativa</h3>
                            
                            <p className="text-white/60 text-sm font-light leading-relaxed mb-8 px-4">
                                Os núcleos neurais do <span className="text-cyan-400 font-bold">Assistente</span> e <span className="text-cyan-400 font-bold">FocoFlow</span> operam em uma única frequência. 
                                Todos os dados salvos são roteados instantaneamente para o seu Painel Operacional Central.
                            </p>
                            
                            <div className="space-y-3 mb-8">
                                {[
                                    { icon: Activity, label: "Fluxo de Tarefas Sincronizado", color: "cyan" },
                                    { icon: Zap, label: "Gestão Financeira Compartilhada", color: "cyan" },
                                    { icon: Database, label: "Histórico em Tempo Real", color: "cyan" }
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.1) }}
                                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-400/30 transition-all hover:bg-cyan-400/5 group"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center group-hover:jarvis-glow transition-all">
                                            <item.icon size={16} className="text-cyan-400" />
                                        </div>
                                        <span className="text-[11px] font-bold uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{item.label}</span>
                                        <div className="ml-auto w-1 h-1 rounded-full bg-cyan-400 opacity-20 group-hover:opacity-100 group-hover:animate-pulse transition-all" />
                                    </motion.div>
                                ))}
                            </div>

                            <motion.button 
                                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 242, 255, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                                className="w-full py-4 bg-cyan-500 text-black font-black uppercase text-xs tracking-[0.4em] rounded-xl transition-all shadow-[0_0_15px_#00f2ff]"
                            >
                                Confirmar_Protocolo
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default FocoFlowIntegration;
