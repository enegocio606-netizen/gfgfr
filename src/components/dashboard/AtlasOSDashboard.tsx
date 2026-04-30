


import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, CheckSquare, Target, DollarSign, Link as LinkIcon, Bell, Brain, FileText, History } from 'lucide-react';
import { auth } from '../../../firebase-singleton';
import { TaskList, FinanceGoals, FinanceCenter, LinkDirectory, ReminderHub, MemoryCore, NotesModule, IaHistoryModule } from './modules/DashboardModules';

const BentoBox = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
    <motion.div 
        whileHover={{ borderColor: 'rgba(34, 211, 238, 0.5)' }}
        className={`border border-slate-800 bg-[#0B1220]/70 backdrop-blur-md p-4 flex flex-col gap-2 transition-colors ${className}`}
    >
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-cyan-400 font-black tracking-[0.2em] text-[10px] uppercase flex items-center gap-2">
                <Icon size={12} />
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-auto custom-scrollbar text-xs text-slate-300">{children}</div>
    </motion.div>
);

interface AtlasOSDashboardProps {
    activeModule?: string | null;
    onClose?: () => void;
}

const AtlasOSDashboard: React.FC<AtlasOSDashboardProps> = ({ activeModule, onClose }) => {
    return (
        <div className="flex flex-col h-full bg-[#05070B] text-slate-200 font-sans p-6 gap-6">
            <header className="flex justify-between items-end border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-black tracking-tighter text-white uppercase flex items-center gap-3">
                    <LayoutDashboard className="text-cyan-400" />
                    {activeModule ? activeModule.toUpperCase() : 'ATLAS_OS V2'}
                </h1>
                {onClose && <button onClick={onClose} className="text-slate-400 hover:text-white">Fechar</button>}
            </header>

            <div className="flex-1 overflow-auto custom-scrollbar">
                {activeModule === 'tasks' && <TaskList />}
                {activeModule === 'financial-goals' && <FinanceGoals />}
                {activeModule === 'finance' && <FinanceCenter />}
                {activeModule === 'links' && <LinkDirectory />}
                {activeModule === 'reminders' && <ReminderHub />}
                {activeModule === 'memory' && <MemoryCore />}
                {activeModule === 'notes' && <NotesModule />}
                {activeModule === 'conversations' && <IaHistoryModule />}
                {!activeModule && (
                    <div className="grid grid-cols-4 grid-rows-2 gap-4">
                        <BentoBox title="Fluxo de Tarefas" icon={CheckSquare}><TaskList /></BentoBox>
                        <BentoBox title="Metas Financeiras" icon={Target}><FinanceGoals /></BentoBox>
                        <BentoBox title="Centro Financeiro" icon={DollarSign}><FinanceCenter /></BentoBox>
                        <BentoBox title="Diretório de Links" icon={LinkIcon}><LinkDirectory /></BentoBox>
                        <BentoBox title="Hub de Lembretes" icon={Bell}><ReminderHub /></BentoBox>
                        <BentoBox title="Núcleo de Memória" icon={Brain}><MemoryCore /></BentoBox>
                        <BentoBox title="Bloco de Notas" icon={FileText}><NotesModule /></BentoBox>
                        <BentoBox title="Histórico IA" icon={History}><IaHistoryModule /></BentoBox>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AtlasOSDashboard;


