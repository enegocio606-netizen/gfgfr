import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, DollarSign, PieChart, Link, Bell, Brain, FileText, MessageSquare, Cpu } from 'lucide-react';
import { TaskList, FinanceGoals, FinanceCenter, LinkDirectory, ReminderHub, MemoryCore } from './modules/DashboardModules';

const Modules = {
    tasks: { title: 'Fluxo de Tarefas', icon: CheckSquare, component: TaskList },
    financeGoals: { title: 'Metas Financeiras', icon: DollarSign, component: FinanceGoals },
    financeCenter: { title: 'Centro Financeiro', icon: PieChart, component: FinanceCenter },
    links: { title: 'Diretório de Links', icon: Link, component: LinkDirectory },
    reminders: { title: 'Hub de Lembretes', icon: Bell, component: ReminderHub },
    memory: { title: 'Núcleo de Memória', icon: Brain, component: MemoryCore },
    notes: { title: 'Bloco de Notas', icon: FileText, component: MemoryCore },
    chat: { title: 'Histórico', icon: MessageSquare, component: () => <div>Histórico</div> },
};

export const FocoFlowNewDashboard = () => {
    const [activeModule, setActiveModule] = useState<keyof typeof Modules>('tasks');

    return (
        <div className="w-full h-full bg-slate-950 text-white p-4 flex flex-col font-mono text-xs">
            {/* Topo */}
            <div className="flex justify-between items-center border-b border-cyan-900 pb-2 mb-4">
                <div className="flex gap-4 text-cyan-400">
                    <span>STATUS: ONLINE</span>
                    <span>SINCRONIZAÇÃO: OK</span>
                </div>
                <button className="bg-cyan-900 px-3 py-1 hover:bg-cyan-700">EXECUTAR</button>
            </div>

            <div className="flex flex-1 gap-4 overflow-hidden">
                {/* Lado Esquerdo - Menu */}
                <div className="w-48 border-r border-slate-800 space-y-2">
                    {Object.entries(Modules).map(([key, { title, icon: Icon }]) => (
                        <button key={key} onClick={() => setActiveModule(key as any)} className={`flex items-center gap-2 w-full p-2 ${activeModule === key ? 'bg-cyan-950 text-cyan-300' : 'hover:bg-slate-800'}`}>
                            <Icon size={14} /> {title}
                        </button>
                    ))}
                </div>

                {/* Centro */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-800 p-2"><h3 className="text-cyan-400 mb-2">GRÁFICO FINANCEIRO</h3><FinanceCenter /></div>
                    <div className="border border-slate-800 p-2"><h3 className="text-cyan-400 mb-2">TAREFAS</h3><TaskList /></div>
                    <div className="border border-slate-800 p-2"><h3 className="text-cyan-400 mb-2">METAS</h3><FinanceGoals /></div>
                </div>

                {/* Lado Direito */}
                <div className="w-64 border-l border-slate-800 p-2 space-y-4">
                    <div className="border border-slate-800 p-2"><h3 className="text-cyan-400 mb-2">LEMBRETES</h3><ReminderHub /></div>
                    <div className="border border-slate-800 p-2"><h3 className="text-cyan-400 mb-2">AÇÕES RÁPIDAS</h3></div>
                </div>
            </div>

            {/* Rodapé */}
            <div className="border-t border-slate-800 pt-2 mt-4 flex justify-between text-slate-500">
                <div className='flex gap-4'><Cpu size={14}/> CPU: 12% | RAM: 45%</div>
                <div>v1.0.0-ALPHA</div>
            </div>
        </div>
    );
};

export default FocoFlowNewDashboard;
