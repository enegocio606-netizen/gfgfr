import React from 'react';
import { motion } from 'motion/react';
import { Activity, X, Zap, Target, BarChart3, Users, Bot, Layers, Plus, ChevronRight, Settings } from 'lucide-react';

const Specialists = [
    { name: 'MODO JARVIS', desc: 'Ativa o protocolo de assistência avançada, interface de controle total e monitoramento contínuo.', icon: Bot },
    { name: 'Especialista em Mídias Sociais', desc: 'Analisa seus painéis de métricas, busca tendências na web e fornece estratégias para crescimento.', icon: BarChart3 },
    { name: 'Andrômeda Ads Operative', desc: 'Especialista em Meta Ads focado em Criativos, CBO e Advantage+. Guia passo a passo como um GPS.', icon: Zap },
    { name: 'Engajamento AI', desc: 'Otimização de respostas e interação com usuários.', icon: Users },
    { name: 'Analista de Conteúdo', desc: 'Geração e curadoria de conteúdo de alto impacto.', icon: Bot }
];

const SpecialistCore: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-4 z-[200] bg-[#05070B]/98 text-[#C7D0E0] font-mono p-8 flex flex-col border-2 border-[#00D9FF]/30 shadow-[0_0_60px_rgba(0,217,255,0.1)] backdrop-blur-3xl overflow-hidden group">
            {/* HUD Scan Line */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                <div className="w-full h-[1px] bg-cyan-400 animate-scanline" />
            </div>

            {/* Corner Markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-[#00D9FF]" />
            <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-[#00D9FF]" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-[#00D9FF]" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-[#00D9FF]" />

            {/* Header */}
            <header className="flex justify-between items-center mb-8 pb-6 border-b-2 border-[#1C2A3F] relative">
                <div className="flex items-center gap-6">
                    <div className="relative">
                        <div className="w-4 h-4 bg-[#00D9FF] animate-pulse shadow-[0_0_15px_rgba(0,217,255,1)]" />
                        <div className="absolute -inset-2 border border-[#00D9FF]/20 animate-jarvis-spin-slow" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-[0.3em] uppercase jarvis-text-glow">NÚCLEO_DE_ESPECIALISTAS::V4.0</h1>
                        <div className="text-[10px] text-[#00D9FF] font-black tracking-widest mt-1 opacity-70">STATUS_DO_NÚCLEO: OPERACIONAL_SYNC_100%</div>
                    </div>
                </div>
                <button onClick={onClose} className="p-3 hover:bg-[#00D9FF] hover:text-[#05070B] border border-[#00D9FF]/30 transition-all">
                    <X size={24} />
                </button>
            </header>

            <div className="flex flex-1 gap-10 overflow-hidden relative">
                {/* Left SideNav */}
                <aside className="w-72 flex flex-col gap-3">
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'AGENTES_SISTEMA', active: true },
                            { label: 'MÓDULOS_EXTERNAL', active: false },
                            { label: 'PROTOCOLOS_JARVIS', active: false }
                        ].map((item) => (
                          <button key={item.label} className={`flex items-center gap-4 p-4 text-left border ${item.active ? 'border-[#00D9FF] bg-[#00D9FF]/10 text-white shadow-[inset_0_0_10px_rgba(0,217,255,0.2)]' : 'border-[#1C2A3F] hover:border-[#C7D0E0]/50 text-[#C7D0E0]/50'} transition-all relative overflow-hidden group/btn`}>
                              {item.active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00D9FF]" />}
                              <Layers size={18} className={item.active ? 'text-[#00D9FF]' : ''} />
                              <span className="text-xs font-black uppercase tracking-[0.2em]">{item.label}</span>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/btn:opacity-50 transition-opacity">
                                  <ChevronRight size={14} />
                              </div>
                          </button>
                        ))}
                    </div>
                    
                    <div className="mt-auto p-6 border-2 border-dashed border-[#00D9FF]/20 flex flex-col gap-4">
                        <div className="text-[10px] text-[#00D9FF]/40 font-black tracking-widest uppercase italic">Comando_Direto</div>
                        <button className="w-full py-4 bg-transparent border border-[#00D9FF] text-[#00D9FF] font-black hover:bg-[#00D9FF] hover:text-[#05070B] transition-all flex items-center justify-center gap-3 active:scale-95 group/new">
                             <Plus size={20} className="group-hover/new:rotate-90 transition-transform" /> 
                             <span className="tracking-[0.2em]">INTEGRAR_NOVO_AGENTE</span>
                        </button>
                    </div>
                </aside>

            {/* Grid Area */}
                <main className="flex-1 overflow-y-auto pr-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start custom-scrollbar">
                    {Specialists.map((spec, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#05070B]/60 backdrop-blur-md p-6 border border-[#1C2A3F] hover:border-[#00D9FF]/50 transition-all flex flex-col gap-4 group/card relative overflow-hidden rounded-xl"
                        >
                            {/* Card Accent Glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#00D9FF]/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                            
                            <div className="flex justify-between items-start relative z-10">
                                <div className="p-3 bg-[#0B1220] border border-[#1C2A3F] group-hover/card:border-[#00D9FF]/50 transition-all">
                                    <spec.icon size={28} className="text-[#00D9FF]" />
                                </div>
                                <span className="text-[8px] text-[#00D9FF] font-black tracking-[0.2em] font-mono bg-[#00D9FF]/10 px-2 py-1 rounded">SESSÃO_ATIVA</span>
                            </div>
                            
                            <div className="space-y-2 relative z-10">
                                <h3 className="font-bold text-base text-white tracking-wider uppercase">{spec.name}</h3>
                                <p className="text-[11px] text-[#C7D0E0]/60 leading-relaxed group-hover/card:text-[#C7D0E0] transition-colors">{spec.desc}</p>
                            </div>

                            <div className="mt-auto pt-4 flex gap-3 relative z-10">
                                <button className="flex-1 py-3 bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF]/30 text-[10px] font-bold uppercase tracking-widest hover:bg-[#00D9FF] hover:text-[#05070B] transition-all">INICIALIZAR</button>
                            </div>
                        </motion.div>
                    ))}
                </main>
            </div>

            {/* Footer */}
            <footer className="mt-8 pt-6 border-t border-[#1C2A3F] text-[9px] text-[#C7D0E0]/30 flex justify-between uppercase tracking-[0.4em] font-black relative">
                <div className="flex gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#00FF9D] rounded-none shadow-[0_0_5px_#00FF9D]" />
                        SISTEMA: ESTÁVEL
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-[#00D9FF] rounded-none shadow-[0_0_5px_#00D9FF]" />
                        AGENTE_SYNC: 100%
                    </div>
                </div>
                <div className="text-[#00D9FF]/50 border-b border-[#00D9FF]/20 pb-1">ATLAS_PROTOCOL_OVERRIDE_ACTIVE</div>
            </footer>
        </div>
    );
};

export default SpecialistCore;
