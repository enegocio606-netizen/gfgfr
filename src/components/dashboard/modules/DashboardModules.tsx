import React, { useState, useEffect } from 'react';
import { getDashboardItems, createDashboardItem } from '@/services/dashboardDataService';
import { auth } from '@/firebase-singleton';
import { Plus } from 'lucide-react';

export { TaskFlowModule as TaskList } from './TaskFlowModule';
export { NotesModule } from './NotesModule';
export { IaHistoryModule } from './IaHistoryModule';

export const FinanceGoals = () => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'financialGoals').then(setItems); }, []);
    const addItem = async () => { if (auth.currentUser) await createDashboardItem(auth.currentUser.uid, 'financialGoals', { name: 'Nova Meta', targetValue: 1000, currentValue: 0 }); getDashboardItems(auth.currentUser.uid, 'financialGoals').then(setItems); };
    return (
        <div className="space-y-2">
            <button onClick={addItem} className="text-cyan-400 text-[10px] hover:text-white uppercase">+ Adicionar Meta</button>
            {items.map(t => {
                const current = t.currentValue || 0;
                const target = t.targetValue || 1;
                const percentage = Math.min(100, Math.max(0, (current / target) * 100));
                return (
                    <div key={t.id} className="text-[10px] text-slate-300 border-l-2 border-cyan-500 pl-2 py-1">
                        <div className="flex justify-between">
                            <span>{t.name}</span>
                            <span>{Math.round(percentage)}%</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 mt-1">
                            <div className="h-full bg-cyan-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const FinanceCenter = () => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'transactions').then(setItems); }, []);
    const addItem = async (type: string) => { if (auth.currentUser) await createDashboardItem(auth.currentUser.uid, 'transactions', { type, amount: 10, category: 'Geral', date: new Date().toISOString() }); getDashboardItems(auth.currentUser.uid, 'transactions').then(setItems); };
    return <div className="space-y-1"><div className="flex gap-2 mb-2"><button onClick={() => addItem('income')} className="text-green-400 text-[10px] border border-green-900 px-2 py-1 hover:bg-green-950">Receita +</button><button onClick={() => addItem('expense')} className="text-red-400 text-[10px] border border-red-900 px-2 py-1 hover:bg-red-950">Gasto -</button></div>{items.map(t => <div key={t.id} className="text-[10px] text-slate-300 flex justify-between"><span>{t.category}</span><span className={t.type === 'income' ? 'text-green-400' : 'text-red-400'}>{t.amount}</span></div>)}</div>;
};

export const LinkDirectory = () => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'links').then(setItems); }, []);
    return <div className="space-y-1">{items.map(t => <a key={t.id} href={t.url} target="_blank" className="block text-[10px] text-cyan-300 hover:text-white hover:underline">{t.title}</a>)}</div>;
};

export const ReminderHub = () => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'reminders').then(setItems); }, []);
    return <div className="space-y-1">{items.map(t => <div key={t.id} className="text-[10px] text-slate-300 bg-slate-950 p-1 border border-slate-800">{t.title}</div>)}</div>;
};

export const MemoryCore = () => {
    const [items, setItems] = useState<any[]>([]);
    useEffect(() => { if (auth.currentUser) getDashboardItems(auth.currentUser.uid, 'notes').then(setItems); }, []);
    return <div className="space-y-1">{items.map(t => <div key={t.id} className="text-[10px] text-slate-300 p-1">{t.title}</div>)}</div>;
};
