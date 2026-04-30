import React from 'react';
import { motion } from 'motion/react';
import { 
    Activity, Database, Zap, Shield, Globe, BarChart3, Layers, 
    Terminal, Bell, FolderKanban, MessageSquare, Plus, Cpu, Settings
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = Array.from({ length: 20 }, (_, i) => ({ name: i, value: Math.random() * 100 }));

const FuturisticDashboard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-4 z-[200] bg-[#05070B]/90 text-[#C7D0E0] font-mono overflow-hidden flex border border-[#1C2A3F] shadow-[0_0_40px_rgba(0,217,255,0.15)] backdrop-blur-xl">
            {/* Left Sidebar */}
            <aside className="w-64 border-r border-[#1C2A3F] bg-[#0B1220]/60 flex flex-col p-6 gap-8">
                <div className="text-[#00D9FF] font-black text-lg tracking-widest flex items-center gap-2">
                    <Activity className="animate-pulse" /> ATLAS_OS_v4
                </div>
                
                <nav className="flex flex-col gap-2 flex-1">
                    {[
                        { icon: FolderKanban, label: 'Fluxo de Tarefas' },
                        { icon: Database, label: 'Centro Financeiro' },
                        { icon: Globe, label: 'Diretório de Links' },
                        { icon: Bell, label: 'Hub de Lembretes' },
                        { icon: Database, label: 'Núcleo de Memória' },
                        { icon: Terminal, label: 'Bloco Operacional' },
                        { icon: MessageSquare, label: 'Histórico de Conversas' },
                    ].map((item, i) => (
                        <button key={i} className="flex items-center gap-4 p-3 rounded-lg transition-all hover:bg-[#1C2A3F]/50 hover:text-[#00D9FF] hover:border-l-2 hover:border-[#00D9FF] border-l-2 border-transparent">
                            <item.icon size={18} />
                            <span className="text-xs uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col">
                {/* Header Global */}
                <header className="h-16 border-b border-[#1C2A3F] flex items-center justify-between px-8 bg-[#0B1220]/80">
                    <div className="flex items-center gap-4">
                        <h1 className="text-[#00D9FF] font-bold tracking-widest text-sm">STATION // SYSTEM_CORE</h1>
                        <span className="text-[10px] text-[#00D9FF]/50 border border-[#00D9FF]/20 px-2 py-0.5 rounded">SYNC_ENABLED</span>
                    </div>
                    <div className="flex items-center gap-6 text-xs">
                        <span className="flex items-center gap-2 text-[#00D9FF]"><div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" /> ONLINE</span>
                        <div className="w-8 h-8 rounded-full bg-[#1C2A3F] border border-[#00D9FF] shadow-[0_0_10px_rgba(0,217,255,0.5)]" />
                    </div>
                </header>

                {/* Dashboard Grid */}
                <main className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-y-auto custom-scrollbar">
                    {/* Status Cards */}
                    <div className="col-span-12 grid grid-cols-4 gap-6">
                        {[
                            { label: 'TAREFAS ATIVAS', val: '08' },
                            { label: 'EVENTOS HOJE', val: '03' },
                            { label: 'MEMÓRIAS SALVAS', val: '124' },
                            { label: 'STATUS SISTEMA', val: 'OPERACIONAL' }
                        ].map((item, i) => (
                            <div key={i} className="bg-[#0B1220]/60 p-5 rounded-xl border border-[#1C2A3F] hover:border-[#00D9FF] transition-all flex flex-col justify-center">
                                <div className="text-[#C7D0E0]/50 text-[10px] tracking-widest mb-1">{item.label}</div>
                                <div className="text-xl font-bold text-[#00D9FF] tracking-tight">{item.val}</div>
                            </div>
                        ))}
                    </div>

                    {/* Left Main (Flow Control) */}
                    <div className="col-span-8 bg-[#0B1220]/60 p-6 rounded-xl border border-[#1C2A3F]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-sm font-bold tracking-widest uppercase">Controle De Fluxo</h2>
                            <button className="bg-[#00D9FF]/10 text-[#00D9FF] border border-[#00D9FF] px-4 py-2 rounded text-[10px] font-bold hover:bg-[#00D9FF] hover:text-[#05070B] transition-all flex items-center gap-2">
                                <Plus size={12} /> CADASTRAR TAREFA
                            </button>
                        </div>
                        <div className="space-y-3">
                            {['Análise de Dados :: 80% COMPLETO', 'Reunião de Equipe :: PENDENTE', 'Ajustes de Infra :: URGENTE'].map(t => (
                                <div key={t} className="p-3 border-l-4 border-[#00D9FF] bg-[#05070B]/50 text-xs text-[#C7D0E0]/80 flex items-center justify-between">
                                    {t}
                                    <Settings size={14} className="opacity-50 hover:opacity-100 cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Sidebar (ATLAS Status) */}
                    <div className="col-span-4 bg-[#0B1220]/60 p-6 rounded-xl border border-[#1C2A3F] flex flex-col gap-4">
                        <h2 className="text-sm font-bold tracking-widest uppercase mb-2">Status ATLAS</h2>
                        <div className="space-y-2 text-[10px] uppercase tracking-widest">
                            <div className="flex justify-between">SYSTEM: <span className="text-[#00D9FF]">Online</span></div>
                            <div className="flex justify-between">MEMORY: <span className="text-[#00D9FF]">Conectada</span></div>
                            <div className="flex justify-between">COMMANDS: <span className="text-[#C7D0E0]">124</span></div>
                            <div className="flex justify-between">LAST_ACT: <span className="text-[#C7D0E0]">Sincronização</span></div>
                        </div>
                        <div className="h-32 mt-auto bg-[#05070B]/50 rounded border border-[#1C2A3F] p-2">
                             <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <Area type="monotone" dataKey="value" stroke="#00D9FF" fill="#00D9FF" fillOpacity={0.1} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </main>

                {/* Footer (Logs) */}
                <footer className="h-24 border-t border-[#1C2A3F] p-4 bg-[#0B1220]/80 overflow-y-auto font-mono text-[10px] text-[#00D9FF] custom-scrollbar">
                    <span className="text-[#C7D0E0]/50">[SYSTEM]</span> LOG::CONNECTION_ESTABLISHED<br/>
                    <span className="text-[#C7D0E0]/50">[DATABASE]</span> LOG::SYNC_COMPLETE<br/>
                    <span className="text-[#C7D0E0]/50">[FOCOFLOW]</span> LOG::TASK_ENGINE_READY
                </footer>
            </div>
        </div>
    );
};

export default FuturisticDashboard;
