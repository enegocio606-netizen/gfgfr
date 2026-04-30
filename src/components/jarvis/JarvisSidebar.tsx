import React from 'react';
import { motion } from 'motion/react';
import { 
  Activity, 
  BarChart3, 
  Link as LinkIcon, 
  Bell, 
  Database, 
  Cpu,
  FileText,
  Layout,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface JarvisSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

const MENU_ITEMS = [
  { id: 'tasks', label: 'Fluxo de Tarefas', icon: Activity },
  { id: 'goals', label: 'Metas Financeiras', icon: TrendingUp },
  { id: 'finances', label: 'Centro Financeiro', icon: BarChart3 },
  { id: 'links', label: 'Diretório de Links', icon: LinkIcon },
  { id: 'reminders', label: 'Hub de Lembretes', icon: Bell },
  { id: 'notes', label: 'Anotações', icon: FileText },
  { id: 'memory', label: 'Núcleo de Memória', icon: Database },
  { id: 'operational', label: 'Bloco Operacional', icon: Cpu },
  { id: 'conversations', label: 'Histórico de Conversas', icon: MessageSquare },
];

const JarvisSidebar: React.FC<JarvisSidebarProps> = ({ activeId, onSelect }) => {
  return (
    <div className="w-72 h-full jarvis-glass border-r border-white/5 p-6 flex flex-col gap-8 relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 jarvis-grid opacity-10 pointer-events-none" />
      
      <div className="relative z-10 flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center jarvis-glow">
            <Layout className="text-cyan-400" size={20} />
        </div>
        <div>
            <h1 className="text-xl font-bold tracking-tighter text-white jarvis-text-glow">FOCOFLOW</h1>
            <p className="text-[8px] tracking-[0.4em] text-cyan-400/40 uppercase font-mono">SISTEMA_DASHBOARD_V4.2</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 relative z-10">
        {MENU_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onSelect(item.id)}
              whileHover={{ x: 5 }}
              className={`relative group flex items-center gap-4 px-6 py-5 transition-all duration-300 overflow-hidden ${
                isActive 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 tab-active-glow' 
                : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {/* Scanline effect for active item */}
              {isActive && (
                 <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/5 to-transparent h-1/2 pointer-events-none animate-jarvis-scanning-v" />
              )}

              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-cyan-400 shadow-[0_0_15px_#00f2ff]"
                />
              )}
              
              <div className="relative">
                 <item.icon size={18} className={`${isActive ? 'text-cyan-400 animate-jarvis-flicker' : 'text-current'} transition-colors relative z-10`} />
                 {isActive && <div className="absolute inset-0 bg-cyan-400/40 blur-md rounded-full animate-pulse" />}
              </div>

              <div className="flex flex-col">
                 <span className="text-[12px] font-black tracking-[0.2em] uppercase">
                   {item.label}
                 </span>
                 {isActive && (
                    <motion.span 
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       className="text-[7px] font-mono tracking-[0.5em] text-cyan-400/60 uppercase"
                    >
                       Acesso_Autorizado
                    </motion.span>
                 )}
              </div>

              {/* HUD corner accents on hover/active */}
              <div className={`absolute inset-0 transition-opacity pointer-events-none ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 <div className="absolute top-2 left-2 w-2 h-2 border-l border-t border-cyan-400/50" />
                 <div className="absolute bottom-2 right-2 w-2 h-2 border-r border-b border-cyan-400/50" />
              </div>
            </motion.button>
          );
        })}
      </nav>

      <div className="mt-auto relative z-10 pt-6 border-t border-white/5">
         <div className="flex items-center justify-between text-[10px] text-cyan-400/30 font-mono tracking-widest uppercase">
            <span>Status</span>
            <span className="text-cyan-400">Operacional</span>
         </div>
      </div>
    </div>
  );
};

export default JarvisSidebar;
