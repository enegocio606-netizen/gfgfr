
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomAgent } from '../types';
import { SYSTEM_AGENTS } from '../constants';
import { 
  X, 
  Plus, 
  CheckCircle2, 
  MessageSquare, 
  BarChart3, 
  Search, 
  Code2, 
  User, 
  Cpu, 
  Zap, 
  Shield, 
  Globe, 
  Layout, 
  Settings2,
  Trash2,
  Edit3,
  ChevronRight,
  Activity,
  Users,
  Terminal,
  Sparkles
} from 'lucide-react';

type Agent = string;

interface AgentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (agent: Agent) => void;
  onDeactivate: () => void;
  activeAgent: Agent;
  customAgents: CustomAgent[];
  onCreateAgent: (name: string, description: string, instruction: string) => void;
  onUpdateAgent: (id: string, name: string, description: string, instruction: string) => void;
  onDeleteAgent: (id: string) => void;
  initialMode?: 'list' | 'create';
  initialCategory?: 'system' | 'custom';
}

const AgentsModal: React.FC<AgentsModalProps> = ({ 
  isOpen, 
  onClose, 
  onActivate, 
  onDeactivate, 
  activeAgent, 
  customAgents, 
  onCreateAgent, 
  onUpdateAgent, 
  onDeleteAgent,
  initialMode = 'list',
  initialCategory = 'system'
}) => {
  const [isFormOpen, setIsFormOpen] = useState(initialMode === 'create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');
  const [activeCategory, setActiveCategory] = useState<'system' | 'custom'>(initialCategory);

  // Sync state when isOpen or initialMode/Category changes
  React.useEffect(() => {
    if (isOpen) {
      setIsFormOpen(initialMode === 'create');
      setActiveCategory(initialCategory);
      if (initialMode === 'create') {
        setEditingId(null);
        setName('');
        setDescription('');
        setInstruction('');
      }
    }
  }, [isOpen, initialMode, initialCategory]);

  if (!isOpen) return null;

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setInstruction('');
    setActiveCategory('custom');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (agent: CustomAgent) => {
    setEditingId(agent.id);
    setName(agent.name);
    setDescription(agent.description);
    setInstruction(agent.systemInstruction);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && description && instruction) {
      if (editingId) {
        onUpdateAgent(editingId, name, description, instruction);
      } else {
        onCreateAgent(name, description, instruction);
        setActiveCategory('custom');
      }
      setIsFormOpen(false);
      setEditingId(null);
      setName('');
      setDescription('');
      setInstruction('');
    }
  };

  const getAgentIcon = (id: string) => {
    const size = 32;
    switch(id) {
      case 'default': return <MessageSquare size={size} />;
      case 'social_media': return <Sparkles size={size} />;
      case 'traffic_manager': return <Layout size={size} />;
      case 'google_ads': return <Search size={size} />;
      case 'programmer': return <Code2 size={size} />;
      case 'jarvis': return <Shield size={size} />;
      case 'camera_assistant': return <Activity size={size} />;
      default: return <User size={size} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-3xl" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-6xl h-full md:h-[85vh] space-starfield rounded-[2.5rem] glassy-modal-container border border-cyan-400/30 overflow-hidden relative shadow-[0_0_80px_rgba(0,234,255,0.15)] focus:outline-none focus:ring-0" 
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Nebula Glow Effects */}
        <div className="nebula-glow -top-40 -left-40 opacity-30 animate-float-gentle" />
        <div className="nebula-glow -bottom-40 -right-40 opacity-20 animate-float-gentle" style={{ animationDelay: '3s' }} />

        {/* Content Layout */}
        <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <header className="px-10 py-8 flex items-center justify-between border-b border-white/5 backdrop-blur-md">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-bold text-white tracking-tight">Agentes Especialistas</h2>
                    <div className="flex items-center gap-4 mt-2">
                      <button 
                        onClick={() => { setActiveCategory('system'); setIsFormOpen(false); }}
                        className={`text-xs font-black tracking-[0.2em] uppercase transition-all pb-1 border-b-2 ${activeCategory === 'system' ? 'text-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'text-white/30 border-transparent hover:text-white/60'}`}
                      >
                        Agentes do Sistema
                      </button>
                      <button 
                        onClick={() => { setActiveCategory('custom'); setIsFormOpen(false); }}
                        className={`text-xs font-black tracking-[0.2em] uppercase transition-all pb-1 border-b-2 ${activeCategory === 'custom' ? 'text-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(0,242,255,0.3)]' : 'text-white/30 border-transparent hover:text-white/60'}`}
                      >
                        Personalizados
                      </button>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Criar Agente Personalizado</span>
                    </button>
                    <button onClick={onClose} className="p-3 bg-white/5 hover:bg-red-500/20 rounded-full border border-white/10 transition-colors">
                        <X size={20} className="text-white" />
                    </button>
                </div>
            </header>

            {/* Main Area */}
            <div className="flex flex-1 overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {isFormOpen ? (
                            <motion.div 
                                key="form"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="max-w-4xl mx-auto glassy-modal-container p-8 md:p-12 rounded-[2rem] border border-white/10 relative overflow-hidden"
                            >
                                 <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Edit3 size={120} className="text-cyan-400" />
                                 </div>
                                 
                                 <div className="relative z-10 space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white tracking-tight uppercase">{editingId ? 'Editar Especialista' : 'Novo Especialista'}</h3>
                                        <p className="text-sm text-cyan-400/40 font-medium">Configure os parâmetros neurais do seu agente customizado.</p>
                                    </div>

                                     <form onSubmit={handleSubmit} className="space-y-8">
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest ml-1">Identificação (Nome)</label>
                                                <input 
                                                    value={name} 
                                                    onChange={e => setName(e.target.value)} 
                                                    placeholder="JARVIS" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-white text-sm focus:outline-none focus:border-cyan-400/50 transition-all" 
                                                    required 
                                                />
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest ml-1">Função Primária</label>
                                                <input 
                                                    value={description} 
                                                    onChange={e => setDescription(e.target.value)} 
                                                    placeholder="Analista de Dados" 
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-5 text-white text-sm focus:outline-none focus:border-cyan-400/50 transition-all" 
                                                    required 
                                                />
                                            </div>
                                       </div>

                                       <div className="space-y-3">
                                         <label className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest ml-1">Diretrizes Neurais (Prompt do Sistema)</label>
                                         <textarea 
                                           value={instruction} 
                                           onChange={e => setInstruction(e.target.value)} 
                                           placeholder="Você é um assistente focado em..." 
                                           className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-sm min-h-[300px] focus:outline-none focus:border-cyan-400/50 transition-all resize-none custom-scrollbar" 
                                           required 
                                         />
                                       </div>
                                       
                                       <div className="flex gap-4 pt-6">
                                           <button type="button" onClick={() => setIsFormOpen(false)} className="px-10 py-5 rounded-2xl text-white/60 font-bold text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all">Descartar</button>
                                           <button type="submit" className="flex-1 py-5 agent-button-blue text-white rounded-2xl font-bold text-[11px] uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98]">Integrar Módulo</button>
                                       </div>
                                     </form>
                                 </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
                            >
                                 {activeCategory === 'system' ? (
                                    SYSTEM_AGENTS.map((agent, index) => (
                                        <AgentCard 
                                            key={agent.id}
                                            agent={agent}
                                            index={index}
                                            isActive={activeAgent === agent.id}
                                            icon={getAgentIcon(agent.id)}
                                            onActivate={onActivate}
                                            onDeactivate={onDeactivate}
                                        />
                                    ))
                                ) : (
                                    <>
                                        {customAgents.length === 0 ? (
                                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-6">
                                                <div className="w-24 h-24 bg-white/5 border border-white/5 rounded-full flex items-center justify-center">
                                                    <Users size={40} className="text-white/10" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">NENHUM AGENTE PERSONALIZADO</h3>
                                                    <p className="text-sm text-cyan-400/30 max-w-xs mx-auto mt-2 font-medium">Crie seu primeiro especialista para expandir as capacidades do Atlas.</p>
                                                </div>
                                                <button onClick={handleOpenCreate} className="px-8 py-4 bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-cyan-500 hover:text-black transition-all">Criar Agora</button>
                                            </div>
                                        ) : (
                                            customAgents.map((agent, index) => (
                                                <AgentCard 
                                                    key={agent.id}
                                                    agent={agent}
                                                    index={index}
                                                    isActive={activeAgent === agent.id}
                                                    icon={<User size={24} />}
                                                    isCustom
                                                    onActivate={onActivate}
                                                    onDeactivate={onDeactivate}
                                                    onEdit={() => handleOpenEdit(agent)}
                                                    onDelete={() => onDeleteAgent(agent.id)}
                                                />
                                            ))
                                        )}
                                    </>
                                 )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

             {/* Scanline Animation */}
             <motion.div className="fixed left-0 w-full h-1 bg-cyan-400/10 z-[301] pointer-events-none" animate={{ top: ['0%', '100%'] }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} />
        </div>
      </motion.div>
    </div>
  );
};

const AgentCard = ({ 
  agent, 
  index, 
  isActive, 
  icon, 
  isCustom, 
  onActivate, 
  onDeactivate, 
  onEdit, 
  onDelete 
}: any) => {
  const isPurpleTheme = agent.id === 'social_media';
  
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative agent-card-glass rounded-3xl p-6 transition-all duration-500 flex flex-col h-full border ${
        isActive 
        ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-[0_0_40px_rgba(0,234,255,0.2)]' 
        : isPurpleTheme ? 'hover:border-purple-400/50' : 'hover:border-cyan-400/50'
      }`}
    >
      {/* Background Graphic */}
      <div className="absolute inset-0 agent-card-pattern opacity-30 pointer-events-none" />
      
      {/* Glow Effect */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] rounded-full transition-all duration-1000 ${
        isActive 
        ? 'bg-cyan-400/20 opacity-100 scale-110' 
        : isPurpleTheme ? 'bg-purple-500/5 opacity-0 group-hover:opacity-100' : 'bg-cyan-500/5 opacity-0 group-hover:opacity-100'
      }`}></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-4 rounded-2xl transition-all duration-500 ${
            isActive 
            ? 'bg-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.5)]' 
            : isPurpleTheme ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-400/10 text-cyan-400'
        }`}>
            {isActive ? <CheckCircle2 size={32} className="agent-card-checked-glow" /> : icon}
        </div>
        
        {isCustom && !isActive && (
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button onClick={onEdit} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5">
              <Edit3 size={16} />
            </button>
            <button onClick={onDelete} className="p-2.5 bg-white/5 hover:bg-rose-500/20 rounded-xl text-slate-400 hover:text-rose-400 transition-all border border-white/10">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 relative z-10">
        <h4 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-cyan-100 transition-colors">
          {agent.name}
        </h4>
        <p className="text-sm leading-relaxed text-slate-400/80 font-medium line-clamp-4">
          {agent.description}
        </p>
      </div>

      <div className="mt-8 relative z-10">
        {isActive ? (
          <div className="w-full py-4 agent-button-active rounded-2xl flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
             Ativo
          </div>
        ) : (
          <button
            onClick={() => onActivate(agent.id)}
            className={`w-full py-4 rounded-2xl text-white font-bold text-xs uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                isPurpleTheme ? 'agent-button-purple' : 'agent-button-blue'
            }`}
          >
            Ativar
          </button>
        )}
      </div>
    </motion.div>
  );
};


export default AgentsModal;
