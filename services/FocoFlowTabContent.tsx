import React, { useState, useEffect } from 'react';
import { getFocoFlowData, deleteFocoFlowItem, createFocoFlowTask, createFocoFlowLink, createFocoFlowReminder, updateFocoFlowItem, createFocoFlowNote } from '../services/focoFlowService';
import { getRecentConversationMessages as getConversationMessages } from '../services/conversationMemory';
import { buscarHistorico as getConversations } from '../services/conversationService';
import { FocoFlowFuturisticFinance } from '../src/components/dashboard/FocoFlowFuturisticFinance';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, CheckCircle, Circle, Link, Bell, Map, FileText, Copy, Check, MessageSquare, ChevronLeft, Calendar, User, UserCheck, TrendingUp, Hexagon, Activity, Cpu, Shield, Zap, Terminal } from 'lucide-react';

interface TabContentProps {
    userId: string;
    activeTab: string;
}

export const FocoFlowTabContent: React.FC<TabContentProps> = ({ userId, activeTab }) => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState("");
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // Conversation specific states
    const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);
    const [convoMessages, setConvoMessages] = useState<any[]>([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const fetchItems = async () => {
        if (activeTab === 'reports') {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (activeTab === 'conversations') {
                const data = await getConversations(userId);
                setItems(data);
                setLoading(false);
                return;
            }

            let cat: string | string[] = activeTab; // monitoring? notes? tasks?
            if (activeTab === 'tasks') cat = ['task', 'tarefa', 'tarefas', 'ideias', 'objetivos', 'metas', 'melhorias', 'orçamentos'];
            if (activeTab === 'links') cat = 'link';
            if (activeTab === 'reminders') cat = 'reminder';
            if (activeTab === 'notes') cat = 'note';
            if (activeTab === 'monitoring') cat = 'project'; // Operational Block maps to projects
            
            // if links, fetch both link and youtube
            if (activeTab === 'links') {
                const arr1 = await getFocoFlowData(userId, 'itens_focoflow', 30, 'link');
                const arr2 = await getFocoFlowData(userId, 'itens_focoflow', 30, 'youtube');
                setItems([...arr1, ...arr2].sort((a: any, b: any) => b.criado_em - a.criado_em));
            } else {
                const data = await getFocoFlowData(userId, 'itens_focoflow', 50, cat);
                setItems(data.sort((a: any, b: any) => b.criado_em - a.criado_em));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setSelectedConvoId(null);
        setConvoMessages([]);
        fetchItems();
        
        const handleRefresh = () => fetchItems();
        window.addEventListener('focoflow_refresh', handleRefresh);
        window.addEventListener('focoflow_refresh_notes', handleRefresh);
        
        return () => {
            window.removeEventListener('focoflow_refresh', handleRefresh);
            window.removeEventListener('focoflow_refresh_notes', handleRefresh);
        };
    }, [activeTab, userId]);

    const handleSelectConversation = async (convoId: string) => {
        setSelectedConvoId(convoId);
        setLoadingMessages(true);
        try {
            const msgs = await getConversationMessages(convoId, 100);
            console.log("CONVERSATION MESSAGES:", msgs);
            setConvoMessages(msgs);
        } catch (e) {
            console.error("Error fetching messages:", e);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteFocoFlowItem(id);
        setItems(items.filter(i => i.id !== id));
    };

    const handleToggleTask = async (item: any) => {
        if(activeTab !== 'tasks') return;
        const newStatus = item.status === 'done' ? 'todo' : 'done';
        await updateFocoFlowItem(item.id, { status: newStatus });
        setItems(items.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!inputValue.trim()) return;

        if (activeTab === 'tasks') {
            await createFocoFlowTask(userId, { title: inputValue, status: 'todo' });
        } else if (activeTab === 'links') {
            await createFocoFlowLink(userId, { url: inputValue, title: inputValue });
        } else if (activeTab === 'reminders') {
            await createFocoFlowReminder(userId, { title: inputValue });
        } else if (activeTab === 'notes') {
            await createFocoFlowNote(userId, { text: inputValue });
        }
        setInputValue("");
        fetchItems();
    };

    let title = "";
    switch(activeTab) {
        case 'tasks': title = "Fluxo de Tarefas"; break;
        case 'links': title = "Diretório de Links"; break;
        case 'reminders': title = "Hub de Lembretes"; break;
        case 'notes': title = "Bloco de Notas"; break;
        case 'monitoring': title = "Bloco Operacional"; break;
        case 'conversations': title = "Histórico de Conversas"; break;
        case 'reports': title = "Relatórios Financeiros"; break;
    }

    if (activeTab === 'reports') {
        return <FocoFlowFuturisticFinance userId={userId} />;
    }

    if (activeTab === 'conversations' && selectedConvoId) {
        const selectedConvo = items.find(c => c.id === selectedConvoId);
        return (
            <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="w-full h-full flex flex-col relative z-30"
            >
                <div className="flex items-center gap-6 mb-8 p-4 jarvis-glass rounded-2xl border border-cyan-400/20">
                    <motion.button 
                        whileHover={{ scale: 1.1, backgroundColor: 'rgba(0, 242, 255, 0.2)' }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedConvoId(null)}
                        className="p-3 bg-cyan-500/10 border border-cyan-400/30 rounded-xl text-cyan-400 transition-all hover:shadow-[0_0_15px_rgba(0,242,255,0.3)]"
                    >
                        <ChevronLeft size={24} />
                    </motion.button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                             <span className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-[0.3em]">Neural_Link_Established</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-[0.1em] text-white uppercase jarvis-text-glow leading-none">
                            {selectedConvo?.title || selectedConvo?.summary || "CONVERSA_RECUPERADA"}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                             <p className="text-[9px] text-cyan-400/30 uppercase tracking-widest font-mono border-r border-white/10 pr-3">
                                UID: {selectedConvoId.substring(0, 12)}
                             </p>
                             <p className="text-[9px] text-cyan-400/30 uppercase tracking-widest font-mono">
                                {selectedConvo?.updatedAt?.toDate ? selectedConvo.updatedAt.toDate().toLocaleString('pt-BR') : "DATA_STREAM_ERR"}
                             </p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1 px-4 border-l border-white/10">
                         <span className="text-[7px] font-mono text-cyan-400/30 uppercase tracking-[0.2em]">Data_Integrity</span>
                         <div className="flex gap-0.5">
                              {[...Array(8)].map((_, i) => (
                                  <div key={i} className="w-1 h-3 bg-cyan-400/40 rounded-full" />
                              ))}
                         </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-6 pb-20">
                    {loadingMessages ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                             <div className="w-10 h-10 border-2 border-cyan-400/10 border-t-cyan-400 rounded-full animate-spin" />
                             <div className="text-cyan-400/50 text-center tracking-[0.5em] text-[10px] animate-pulse font-mono uppercase">Decodificando_Fluxo_Neural...</div>
                        </div>
                    ) : convoMessages.length === 0 ? (
                        <div className="text-cyan-400/30 text-center py-20 tracking-[0.4em] text-[10px] border border-dashed border-cyan-400/10 rounded-3xl jarvis-glass flex flex-col items-center gap-4">
                            <Shield size={32} className="opacity-10" />
                            BUFFER_DE_MEMÓRIA_VAZIO
                        </div>
                    ) : (
                        convoMessages.map((msg, i) => (
                            <motion.div 
                                key={i} 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`relative group max-w-[85%] p-5 rounded-2xl border transition-all duration-300 ${
                                    msg.role === 'user' 
                                    ? 'bg-cyan-500/5 border-cyan-400/20 text-white rounded-tr-none hover:bg-cyan-500/10' 
                                    : 'bg-white/5 border-white/10 text-cyan-50 rounded-tl-none hover:bg-white/10'
                                } shadow-xl backdrop-blur-md`}>
                                    {/* Bubble Decoration */}
                                    <div className={`absolute top-0 ${msg.role === 'user' ? 'right-0' : 'left-0'} w-2 h-2 border-t border-${msg.role === 'user' ? 'cyan' : 'white'}-400/40 ${msg.role === 'user' ? 'border-r' : 'border-l'}`} />

                                    <div className="flex items-center gap-3 mb-3 opacity-60">
                                        <div className={`w-6 h-6 rounded-lg ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-white'} flex items-center justify-center`}>
                                            {msg.role === 'user' ? <User size={14} /> : <Cpu size={14} className="text-cyan-400" />}
                                        </div>
                                        <span className="text-[10px] uppercase font-black tracking-[0.2em] font-mono">
                                            {msg.role === 'user' ? 'Operador' : 'Atlas_Jarvis'}
                                        </span>
                                        <div className="flex-1 h-[1px] bg-white/5" />
                                        <span className="text-[8px] font-mono opacity-50 tracking-widest">
                                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-light tracking-wide">{msg.text}</p>
                                    
                                    {/* Hover HUD corners */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-white/0 group-hover:border-white/20 transition-all" />
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full flex flex-col items-center relative overflow-hidden"
        >
            {/* HUD Background Decorations */}
            <div className="absolute inset-0 jarvis-grid opacity-[0.02] pointer-events-none" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] pointer-events-none" />

            <header className="flex flex-col items-center mb-8 relative z-20">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="flex items-center gap-2 mb-2">
                         <div className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                         <span className="text-[7px] font-black tracking-[1em] text-cyan-400/40 uppercase">Nucleo_Operacional</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-[0.2em] text-white uppercase jarvis-text-glow text-center">
                        {title}
                    </h2>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
                        <div className="w-3 h-3 border border-cyan-400 rotate-45 flex items-center justify-center">
                           <div className="w-1 h-1 bg-cyan-400" />
                        </div>
                        <div className="w-16 h-[1px] bg-gradient-to-l from-transparent via-cyan-400 to-transparent" />
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                         <span className="text-[8px] font-mono tracking-[0.5em] text-cyan-400/40 uppercase bg-cyan-400/5 px-4 py-1 rounded-full border border-cyan-400/10">
                            PROTOCOLO_SINC_{activeTab.toUpperCase()}_v.7.4.2
                         </span>
                         <div className="hidden md:flex gap-1">
                             {[...Array(4)].map((_, i) => (
                                 <div key={i} className="w-1.5 h-1.5 bg-white/5 border border-white/10" />
                             ))}
                         </div>
                    </div>
                </motion.div>
            </header>
            
            {activeTab !== 'monitoring' && activeTab !== 'conversations' && (
                <motion.form 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    onSubmit={handleAdd} 
                    className="w-full max-w-2xl flex gap-3 mb-10 relative z-20"
                >
                    <div className="relative flex-1 group">
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={`INSERIR DADOS EM ${title.toUpperCase()}...`}
                            className="w-full bg-black/40 backdrop-blur-md border border-cyan-400/20 text-white rounded-xl px-6 py-4 focus:outline-none focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/30 transition-all placeholder:text-cyan-400/20 text-sm font-mono tracking-wider"
                        />
                        <div className="absolute top-0 left-0 w-3 h-3 border-l border-t border-cyan-400/40" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-r border-b border-cyan-400/40" />
                        
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-20 group-focus-within:opacity-50 transition-opacity">
                            <Terminal size={14} className="text-cyan-400" />
                            <span className="text-[10px] font-mono text-cyan-400">READY_</span>
                        </div>
                    </div>
                    <button 
                        type="submit" 
                        className="bg-cyan-500/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/60 px-8 py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] transition-all jarvis-glow active:scale-95 flex items-center gap-2"
                    >
                        <Zap size={14} className="animate-pulse" />
                        Executar
                    </button>
                </motion.form>
            )}

            <div className="w-full max-w-5xl flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-3 pb-20 relative z-10">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-2 border-cyan-400/10 border-t-cyan-400 rounded-full animate-spin" />
                            <div className="absolute inset-0 w-16 h-16 border-r-2 border-purple-400/20 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }} />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <span className="text-cyan-400/40 text-[10px] font-mono tracking-[0.6em] uppercase animate-pulse">Acessando_Fluxo_Neural</span>
                            <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="w-1 h-1 bg-cyan-400/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : items.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-cyan-400/20 text-center py-24 tracking-[0.4em] text-[10px] jarvis-glass rounded-3xl flex flex-col items-center gap-6 border-dashed"
                    >
                        <div className="relative">
                            <Activity size={48} className="opacity-10" />
                            <div className="absolute inset-0 bg-cyan-400/5 blur-2xl rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-2">
                           <span className="uppercase font-mono">Status: Nenhum Registro Ativo</span>
                           <span className="text-[8px] opacity-50">SISTEMA_AGUARDANDO_ENTRADA_DE_DADOS</span>
                        </div>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {items.map((item, idx) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                onClick={() => activeTab === 'conversations' ? handleSelectConversation(item.id) : null}
                                className={`
                                    group w-full jarvis-glass p-6 flex items-center justify-between hover:bg-cyan-900/10 transition-all relative overflow-hidden rounded-2xl border border-white/5
                                    ${activeTab === 'conversations' ? 'cursor-pointer hover:translate-x-2' : ''}
                                `}
                            >
                                {/* HUD Inner Details */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400/5 group-hover:bg-cyan-400 transition-all duration-500 shadow-[0_0_15px_#00f2ff]" />
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-center gap-6 relative z-10 w-full">
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <span className="text-[8px] font-mono text-cyan-400/40 uppercase group-hover:text-cyan-400 transition-colors">
                                            {idx + 1 < 10 ? `REF_0${idx + 1}` : `REF_${idx + 1}`}
                                        </span>
                                        <motion.div 
                                            whileHover={{ scale: 1.1 }}
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30 transition-all"
                                        >
                                            {activeTab === 'tasks' ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleToggleTask(item); }} 
                                                    className={`transition-all duration-500 hover:scale-110 ${item.status === 'done' ? 'text-green-400 filter drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-cyan-400/40 group-hover:text-cyan-400'}`}
                                                >
                                                    {item.status === 'done' ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                </button>
                                            ) : (
                                                <div className="text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
                                                    {activeTab === 'links' && <Link size={22} />}
                                                    {activeTab === 'reminders' && <Bell size={22} />}
                                                    {activeTab === 'notes' && <FileText size={22} />}
                                                    {activeTab === 'monitoring' && <Map size={22} />}
                                                    {activeTab === 'conversations' && <MessageSquare size={22} />}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                                        <div className="flex items-center gap-3">
                                            {activeTab === 'monitoring' && (
                                                <div className="px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-[8px] font-mono text-cyan-400 uppercase tracking-widest">PROJETO_ATV</div>
                                            )}
                                            <span className={`text-[15px] font-semibold tracking-wide transition-all truncate ${
                                                (activeTab === 'tasks' && item.status === 'done') 
                                                ? 'line-through text-white/20' 
                                                : 'text-white/90 group-hover:text-white'
                                            }`}>
                                                {item.titulo || item.title || item.text || item.url || item.nome || item.summary || "REGISTRO_DADOS_SISTEMA"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {item.reminderTime && (
                                                <div className="flex items-center gap-1.5 text-[9px] text-orange-400/60 font-mono uppercase tracking-widest bg-orange-400/5 px-2 py-0.5 rounded border border-orange-400/10">
                                                    <Calendar size={10} />
                                                    <span>{new Date(item.reminderTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-[9px] text-cyan-400/30 font-mono uppercase tracking-widest">
                                                <Hexagon size={10} className="group-hover:rotate-90 transition-transform duration-500" />
                                                <span>
                                                    {item.updatedAt?.toDate 
                                                        ? item.updatedAt.toDate().toLocaleDateString('pt-BR') 
                                                        : item.criado_em 
                                                            ? new Date(item.criado_em * 1000).toLocaleDateString('pt-BR')
                                                            : 'ID_VALIDADO'
                                                    }
                                                </span>
                                            </div>
                                            <div className="hidden group-hover:flex items-center gap-1 text-[8px] text-cyan-400/20 font-mono tracking-widest animate-pulse">
                                                <Cpu size={10} />
                                                <span>DATA_STREAM_ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {activeTab === 'notes' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleCopy(item.titulo || item.text || "", item.id); }}
                                                className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-cyan-400/30 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/10 transition-all shadow-lg shadow-black/50"
                                                title="Copiar nota"
                                            >
                                                {copiedId === item.id ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        )}
                                        {activeTab !== 'conversations' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                                className="w-10 h-10 rounded-xl bg-red-500/0 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 flex items-center justify-center text-red-500/30 hover:text-red-400 transition-all shadow-lg shadow-black/50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {activeTab === 'conversations' && (
                                            <div className="w-10 h-10 rounded-xl bg-cyan-400/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400/20 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
                                                <ChevronLeft className="rotate-180" size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* HUD Scanning corners */}
                                <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Inner animated scanline for the item */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/20 group-hover:animate-jarvis-scan opacity-0 group-hover:opacity-100" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
                {activeTab === 'notes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item, idx) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                className="group jarvis-glass p-5 rounded-2xl border border-white/5 hover:border-cyan-400/30 transition-all flex flex-col gap-3 relative overflow-hidden"
                            >
                                <div className="absolute left-0 top-0 h-full w-[2px] bg-cyan-400/20 group-hover:bg-cyan-400 transition-all duration-500" />
                                <div className="flex justify-between items-start">
                                    <span className="text-[8px] font-mono text-cyan-400/40 uppercase">
                                        {idx + 1 < 10 ? `REF_0${idx + 1}` : `REF_${idx + 1}`}
                                    </span>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleCopy(item.text || "", item.id); }}
                                            className="text-cyan-400/30 hover:text-cyan-400 transition-all"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                            className="text-red-500/30 hover:text-red-400 transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-white/90 font-light leading-relaxed flex-1">
                                    {item.text || "Sem conteúdo"}
                                </p>
                                <div className="text-[9px] text-cyan-400/30 font-mono uppercase tracking-widest mt-2 pt-2 border-t border-white/5">
                                    {item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString('pt-BR') : 'DATA_VAL'}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
                {activeTab !== 'conversations' && activeTab !== 'notes' && (
                    <AnimatePresence mode="popLayout">
                        {items.map((item, idx) => (
                            <motion.div 
                                key={item.id} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                onClick={() => activeTab === 'conversations' ? handleSelectConversation(item.id) : null}
                                className={`
                                    group w-full jarvis-glass p-6 flex items-center justify-between hover:bg-cyan-900/10 transition-all relative overflow-hidden rounded-2xl border border-white/5
                                    ${activeTab === 'conversations' ? 'cursor-pointer hover:translate-x-2' : ''}
                                `}
                            >
                                {/* HUD Inner Details */}
                                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400/5 group-hover:bg-cyan-400 transition-all duration-500 shadow-[0_0_15px_#00f2ff]" />
                                <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="flex items-center gap-6 relative z-10 w-full">
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <span className="text-[8px] font-mono text-cyan-400/40 uppercase group-hover:text-cyan-400 transition-colors">
                                            {idx + 1 < 10 ? `REF_0${idx + 1}` : `REF_${idx + 1}`}
                                        </span>
                                        <motion.div 
                                            whileHover={{ scale: 1.1 }}
                                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-cyan-400/10 group-hover:border-cyan-400/30 transition-all"
                                        >
                                            {activeTab === 'tasks' ? (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleToggleTask(item); }} 
                                                    className={`transition-all duration-500 hover:scale-110 ${item.status === 'done' ? 'text-green-400 filter drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-cyan-400/40 group-hover:text-cyan-400'}`}
                                                >
                                                    {item.status === 'done' ? <CheckCircle size={24} /> : <Circle size={24} />}
                                                </button>
                                            ) : (
                                                <div className="text-cyan-400/60 group-hover:text-cyan-400 transition-colors">
                                                    {activeTab === 'links' && <Link size={22} />}
                                                    {activeTab === 'reminders' && <Bell size={22} />}
                                                    {activeTab === 'monitoring' && <Map size={22} />}
                                                    {activeTab === 'conversations' && <MessageSquare size={22} />}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>
                                    
                                    <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                                        <div className="flex items-center gap-3">
                                            {activeTab === 'monitoring' && (
                                                <div className="px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/20 text-[8px] font-mono text-cyan-400 uppercase tracking-widest">PROJETO_ATV</div>
                                            )}
                                            <span className={`text-[15px] font-semibold tracking-wide transition-all truncate ${
                                                (activeTab === 'tasks' && item.status === 'done') 
                                                ? 'line-through text-white/20' 
                                                : 'text-white/90 group-hover:text-white'
                                            }`}>
                                                {item.titulo || item.title || item.text || item.url || item.nome || item.summary || "REGISTRO_DADOS_SISTEMA"}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            {item.reminderTime && (
                                                <div className="flex items-center gap-1.5 text-[9px] text-orange-400/60 font-mono uppercase tracking-widest bg-orange-400/5 px-2 py-0.5 rounded border border-orange-400/10">
                                                    <Calendar size={10} />
                                                    <span>{new Date(item.reminderTime).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-[9px] text-cyan-400/30 font-mono uppercase tracking-widest">
                                                <Hexagon size={10} className="group-hover:rotate-90 transition-transform duration-500" />
                                                <span>
                                                    {item.updatedAt?.toDate 
                                                        ? item.updatedAt.toDate().toLocaleDateString('pt-BR') 
                                                        : item.criado_em 
                                                            ? new Date(item.criado_em * 1000).toLocaleDateString('pt-BR')
                                                            : 'ID_VALIDADO'
                                                    }
                                                </span>
                                            </div>
                                            <div className="hidden group-hover:flex items-center gap-1 text-[8px] text-cyan-400/20 font-mono tracking-widest animate-pulse">
                                                <Cpu size={10} />
                                                <span>DATA_STREAM_ACTIVE</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {activeTab !== 'conversations' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} 
                                                className="w-10 h-10 rounded-xl bg-red-500/0 hover:bg-red-500/10 border border-transparent hover:border-red-500/30 flex items-center justify-center text-red-500/30 hover:text-red-400 transition-all shadow-lg shadow-black/50"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                        {activeTab === 'conversations' && (
                                            <div className="w-10 h-10 rounded-xl bg-cyan-400/5 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-400/20 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all">
                                                <ChevronLeft className="rotate-180" size={20} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* HUD Scanning corners */}
                                <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                {/* Inner animated scanline for the item */}
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/20 group-hover:animate-jarvis-scan opacity-0 group-hover:opacity-100" />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

            </div>

            {/* Global HUD Stats Footer */}
            <footer className="w-full max-w-5xl px-6 py-4 flex items-center justify-between border-t border-cyan-400/10 relative z-20 mt-auto bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[7px] font-mono text-cyan-400/40 uppercase tracking-widest">Interface_Status</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80] animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">ONLINE</span>
                        </div>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="flex flex-col">
                        <span className="text-[7px] font-mono text-cyan-400/40 uppercase tracking-widest">Total_Records</span>
                        <span className="text-[10px] font-black text-white">{items.length} UNITS</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 rounded-full ${i < 3 ? 'bg-cyan-400 shadow-[0_0_5px_#00f2ff]' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <span className="text-[8px] font-mono text-cyan-400/40 uppercase tracking-[0.3em]">JARVIS_CORE_LOAD</span>
                </div>
            </footer>
        </motion.div>
    );
}

