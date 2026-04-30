import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, DollarSign, PieChart, Link as LinkIcon, Bell, Brain, FileText, MessageSquare, Cpu, Zap, Activity } from 'lucide-react';
import { TaskList, FinanceGoals, FinanceCenter, LinkDirectory, ReminderHub, MemoryCore, NotesModule, IaHistoryModule } from './modules/DashboardModules';
import { motion } from 'framer-motion';

const BentoBox = ({ title, icon: Icon, children, className = "" }: { title: string, icon: any, children: React.ReactNode, className?: string }) => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-slate-900 border border-cyan-900/40 p-4 rounded-none shadow-[0_0_15px_rgba(0,255,255,0.05)] hover:shadow-[0_0_20px_rgba(0,255,255,0.15)] transition-all ${className}`}
    >
        <div className="flex items-center gap-2 mb-3 text-cyan-400 font-bold tracking-wider uppercase text-[10px]">
            <Icon size={14} /> {title}
        </div>
        <div className="text-[12px] text-slate-300 font-mono">{children}</div>
    </motion.div>
);

export const FocoFlowUnifiedDashboard = () => {
    return (
        <div className="w-full h-full bg-[#010409] text-slate-200 p-6 flex flex-col font-mono text-[11px] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-cyan-900/50 pb-4 mb-6">
                <div className="flex items-center gap-3">
                    <Activity className="text-cyan-500" size={24} />
                    <h1 className="text-xl tracking-tighter text-white font-bold">FOCOFLOW <span className="text-cyan-600 font-light">CORE</span></h1>
                </div>
                <div className="flex gap-6 text-[10px] text-slate-400 uppercase tracking-widest">
                    <span>Sys: <span className="text-green-500">Active</span></span>
                    <span>Sync: <span className="text-cyan-500">Realtime</span></span>
                    <span>Memory: <span className="text-purple-500">Optimized</span></span>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 overflow-y-auto">
                <BentoBox title="Finanças" icon={DollarSign} className="col-span-2 row-span-1"><FinanceCenter /></BentoBox>
                <BentoBox title="Tarefas" icon={CheckSquare} className="col-span-2 row-span-2"><TaskList /></BentoBox>
                <BentoBox title="Metas" icon={PieChart} className="col-span-1 row-span-1"><FinanceGoals /></BentoBox>
                <BentoBox title="Notas" icon={FileText} className="col-span-1 row-span-1"><NotesModule /></BentoBox>
                <BentoBox title="Memória" icon={Brain} className="col-span-1 row-span-1"><MemoryCore /></BentoBox>
                <BentoBox title="Lembretes" icon={Bell} className="col-span-1 row-span-1"><ReminderHub /></BentoBox>
                <BentoBox title="Histórico IA" icon={MessageSquare} className="col-span-2 row-span-1"><IaHistoryModule /></BentoBox>
                <BentoBox title="Links" icon={LinkIcon} className="col-span-2 row-span-1"><LinkDirectory /></BentoBox>
            </div>
        </div>
    );
};
