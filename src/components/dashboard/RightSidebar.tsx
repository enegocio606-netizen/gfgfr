import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bot, 
  Layers, 
  Plus, 
  Settings, 
  ChevronRight,
  Shield,
  Zap,
  Activity,
  Cpu,
  Binary
} from 'lucide-react';
import { CustomAgent } from '../../../types';
import { SYSTEM_AGENTS } from '../../../constants';

interface RightSidebarProps {
  onClose?: () => void;
  customAgents?: CustomAgent[];
  activeAgentId?: string;
  onActivateAgent?: (id: string) => void;
  onCreateAgent?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ 
  onClose,
  customAgents = [],
  activeAgentId,
  onActivateAgent,
  onCreateAgent
}) => {
  return (
    <div className="h-screen w-80 lg:w-96 flex flex-col bg-[#05070B]/98 text-[#C7D0E0] font-mono border-l-2 border-[#00D9FF]/30 shadow-[-20px_0_60px_rgba(0,217,255,0.1)] backdrop-blur-3xl overflow-hidden relative group">
      {/* HUD Scan Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10 z-0">
        <div className="w-full h-[1px] bg-cyan-400 animate-scanline" />
      </div>

      {/* Header */}
      <header className="p-6 border-b-2 border-[#1C2A3F] relative z-10 flex justify-between items-center bg-[#0B1220]/40">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-3 h-3 bg-[#00D9FF] animate-pulse shadow-[0_0_15px_rgba(0,217,255,1)] rounded-none" />
            <div className="absolute -inset-1.5 border border-[#00D9FF]/20 animate-spin-slow rounded-none" />
          </div>
          <div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase jarvis-text-glow">NÚCLEO_AGENTES</h2>
            <div className="text-[8px] text-[#00D9FF] font-black tracking-widest mt-0.5 opacity-70">SYNC_STATUS: 100%</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-[#00D9FF] hover:text-[#05070B] border border-[#00D9FF]/30 transition-all">
            <X size={16} />
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-6 space-y-8">
        {/* System Agents Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <motion.h3 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]"
            >
              Protocolos_Sistema
            </motion.h3>
            <div className="h-px bg-cyan-400/20 flex-1 ml-4" />
          </div>
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="grid grid-cols-1 gap-3"
          >
            {SYSTEM_AGENTS.map((agent, i) => (
              <motion.button
                key={agent.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ 
                  scale: 1.02, 
                  x: 5,
                  backgroundColor: 'rgba(0, 217, 255, 0.08)'
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onActivateAgent?.(agent.id)}
                className={`flex flex-col gap-3 p-4 border transition-all text-left group/card relative overflow-hidden ${
                  activeAgentId === agent.id 
                    ? 'border-[#00D9FF] bg-[#00D9FF]/20 text-white shadow-[0_0_30px_rgba(0,217,255,0.25)]' 
                    : 'border-[#1C2A3F] hover:border-[#00D9FF]/50 bg-[#05070B]/40 text-[#C7D0E0]/60'
                }`}
              >
                {activeAgentId === agent.id && (
                  <>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D9FF] shadow-[0_0_15px_#00D9FF]" />
                    <motion.div 
                      layoutId="active-glow-sidebar"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-transparent pointer-events-none"
                    />
                    <div className="absolute top-0 right-0 p-1">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="text-[#00D9FF]/20"
                      >
                        <Zap size={40} />
                      </motion.div>
                    </div>
                  </>
                )}
                
                <div className="flex justify-between items-start z-10">
                  <div className={`p-2.5 border flex items-center justify-center ${activeAgentId === agent.id ? 'border-[#00D9FF] text-[#00D9FF] bg-[#00D9FF]/20' : 'border-[#1C2A3F] text-[#C7D0E0]/40 group-hover/card:text-[#00D9FF] group-hover/card:bg-[#00D9FF]/5 transition-all duration-300'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={agent.icon} />
                    </svg>
                  </div>
                  <div className="text-right">
                    <span className={`text-[7px] font-mono uppercase block ${activeAgentId === agent.id ? 'text-[#00D9FF]' : 'text-[#00D9FF]/40'}`}>UNIT_S_{i+10}</span>
                    <span className="text-[6px] font-mono text-[#C7D0E0]/20 uppercase">STABLE_OS</span>
                  </div>
                </div>
                
                <div className="z-10 mt-1">
                  <h4 className="text-sm font-black tracking-widest uppercase flex items-center gap-2 group-hover/card:text-[#00D9FF] transition-all">
                    {agent.name}
                    {activeAgentId === agent.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex gap-0.5"
                      >
                        {[1, 2, 3].map(dot => (
                          <motion.div 
                            key={dot}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: dot * 0.2 }}
                            className="w-1 h-1 rounded-full bg-cyan-400"
                          />
                        ))}
                      </motion.div>
                    )}
                  </h4>
                  <p className="text-[10px] mt-2.5 leading-relaxed opacity-40 line-clamp-2 font-sans group-hover/card:opacity-90 transition-all">
                    {agent.description}
                  </p>
                </div>
                
                {/* Visual feedback on bottom */}
                <div className="flex items-center gap-1 mt-1 opacity-20 group-hover/card:opacity-100 transition-opacity">
                  <Activity size={8} className={activeAgentId === agent.id ? 'text-cyan-400' : ''} />
                  <div className="flex-1 h-[1px] bg-gradient-to-r from-cyan-400/50 to-transparent" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        </section>

        {/* Custom Agents Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Módulos_Interface</h3>
            <div className="h-px bg-purple-400/20 flex-1 ml-4" />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateAgent}
            className="w-full py-4 border-2 border-dashed border-[#8B5CF6]/20 text-[#8B5CF6]/60 hover:border-[#8B5CF6]/50 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 group/add bg-purple-900/5"
          >
            <Plus size={16} className="group-hover/add:rotate-90 transition-transform" />
            Integrar_Novo_Agente
          </motion.button>

          <div className="grid grid-cols-1 gap-3 mt-4">
            {customAgents.map((agent, i) => (
              <motion.button
                key={agent.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, x: 5 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onActivateAgent?.(agent.id)}
                className={`flex flex-col gap-3 p-4 border transition-all text-left group/card relative overflow-hidden ${
                  activeAgentId === agent.id 
                    ? 'border-[#8B5CF6] bg-[#8B5CF6]/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.2)]' 
                    : 'border-[#1C2A3F] hover:border-[#8B5CF6]/50 bg-[#05070B]/40 text-[#C7D0E0]/60'
                }`}
              >
                {activeAgentId === agent.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8B5CF6] shadow-[0_0_10px_#8B5CF6]" />
                )}
                
                <div className="flex justify-between items-start">
                  <div className={`p-2 border ${activeAgentId === agent.id ? 'border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/10' : 'border-[#1C2A3F] text-[#C7D0E0]/40 group-hover/card:text-[#8B5CF6] transition-colors'}`}>
                    <Cpu size={20} />
                  </div>
                  <div className="text-right">
                    <span className="text-[7px] font-mono text-[#8B5CF6]/40 uppercase block">CUSTOM_ID_{i+100}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-black tracking-widest uppercase group-hover/card:text-white transition-colors flex items-center gap-2">
                    🧠 {agent.name}
                  </h4>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </div>

      {/* Footer Stats */}
      <footer className="p-6 border-t border-[#1C2A3F] bg-[#0B1220]/40 z-10 transition-all">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[7px] text-[#C7D0E0]/30 font-black tracking-widest uppercase block">SISTEMA</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 shadow-[0_0_8px_#22c55e]" />
              <span className="text-[9px] font-black text-white/60 tracking-wider">ESTÁVEL</span>
            </div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[7px] text-[#C7D0E0]/30 font-black tracking-widest uppercase block">LATÊNCIA</span>
            <span className="text-[9px] font-black text-cyan-400/60 tracking-wider">24MS / NOMINAL</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
