import React, { useState } from 'react';
import { 
  Clock,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Link as LinkIcon,
  Bell,
  MessageSquare,
  FileText,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Conversation } from '../../../types';

const AtlasLogo = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
    <path d="M16 19h6" />
    <path d="M19 16v6" />
    <rect x="7" y="9" width="10" height="6" rx="1" />
  </svg>
);

interface SidebarProps {
  conversations?: Conversation[];
  activeConversationId?: string | null;
  activeId?: string;
  onSelectConversation?: (id: string) => void;
  onNewConversation?: () => void;
  onNavItemClick?: (id: string) => void;
  assistantName?: string;
}

const navItems = [
  { id: 'conversations', emoji: '💬', label: 'Histórico de Conversas', color: 'blue' },
  { id: 'focoflow-nx', emoji: '📈', label: 'FocoFlow NX', color: 'cyan' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  conversations = [], 
  activeConversationId, 
  activeId = 'conversations',
  onSelectConversation,
  onNewConversation,
  onNavItemClick,
  assistantName = 'ATLAS'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getActiveClasses = (id: string, color: string) => {
    if (activeId !== id) return 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent';
    
    const colorMap: any = {
      cyan: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
      purple: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      green: 'text-green-400 bg-green-400/10 border-green-400/20',
      pink: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
      orange: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
      blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      yellow: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    };
    
    return colorMap[color] || colorMap.blue;
  };

  const getEmojiGlow = (id: string, color: string) => {
    if (activeId !== id) return '';
    const glowMap: any = {
      cyan: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]',
      purple: 'drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]',
      green: 'drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]',
      pink: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.4)]',
      orange: 'drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]',
      blue: 'drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]',
      yellow: 'drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]',
    };
    return glowMap[color] || '';
  };

  return (
    <aside className={`h-screen fixed left-0 top-0 bg-[#0B1220] border-r border-slate-800 flex flex-col items-center lg:items-stretch py-4 z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-20 lg:w-64'}`}>
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
          <AtlasLogo className="text-white w-6 h-6" />
        </div>
        {!isCollapsed && (
          <div className="hidden lg:flex flex-col">
            <span className="font-black text-xl tracking-[0.2em] text-white uppercase">{assistantName}</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <nav className="px-4 space-y-2 mb-6 mt-4">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onNavItemClick?.(item.id);
              }}
              className={`w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all duration-200 ${getActiveClasses(item.id, item.color)}`}
            >
              <span className={`text-xl ${getEmojiGlow(item.id, item.color)}`}>{item.emoji}</span>
              {!isCollapsed && <span className="hidden lg:block font-bold text-[10px] tracking-widest uppercase">{item.label}</span>}
            </motion.button>
          ))}
        </nav>


        {!isCollapsed && (
          <div className="hidden lg:flex flex-col flex-1 px-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-slate-500" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico</span>
              </div>
              <button 
                onClick={onNewConversation}
                className="p-1 hover:bg-white/5 rounded-md text-slate-500 hover:text-blue-400 transition-all nova-conversa-btn"
                title="Nova Conversa"
              >
                <Plus size={14} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
              {conversations.length === 0 ? (
                <div className="text-[10px] text-slate-600 text-center py-8 px-4 border border-dashed border-slate-800 rounded-xl">
                  Nenhuma conversa encontrada
                </div>
              ) : (
                conversations
                  .filter(c => !c.isArchived)
                  .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
                    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
                    return dateB - dateA;
                  })
                  .map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation?.(conv.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition-all relative group ${
                        activeConversationId === conv.id 
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]' 
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 border border-transparent'
                      }`}
                    >
                      <div className="truncate pr-4">{conv.title || 'Conversa sem título'}</div>
                      {activeConversationId === conv.id && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                      )}
                    </button>
                  ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 mb-4">
        <motion.button
          whileHover={{ x: 5 }}
          onClick={() => onNavItemClick?.('settings')}
          className={`w-full flex items-center justify-center px-4 py-3 rounded-full transition-all duration-300 ${
            activeId === 'settings' 
              ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          {!isCollapsed && <span className="hidden lg:block font-black tracking-[0.2em] text-[12px] uppercase">Ajustes</span>}
          {isCollapsed && <span className="block lg:hidden font-black tracking-widest text-[10px] uppercase">AJ</span>}
        </motion.button>
      </div>

      <div className="px-6 pt-4 border-t border-blue-500/5">
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-center lg:justify-start gap-4 text-slate-500 hover:text-white transition-colors group"
        >
          <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          {!isCollapsed && <span className="hidden lg:block text-sm font-medium">Recolher</span>}
        </button>
      </div>
    </aside>
  );
};
