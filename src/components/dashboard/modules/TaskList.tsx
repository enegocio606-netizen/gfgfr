import React, { useState, useEffect } from 'react';
import { getDashboardItems, createDashboardItem } from '../../../../services/dashboardDataService';
import { auth } from '../../../../firebase';
import { Plus } from 'lucide-react';

export const TaskList = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    
    useEffect(() => {
        if (auth.currentUser) {
            getDashboardItems(auth.currentUser.uid, 'tasks').then(setTasks);
        }
    }, []);

    const addTask = async () => {
        if (auth.currentUser) {
            await createDashboardItem(auth.currentUser.uid, 'tasks', { title: 'Nova Tarefa', status: 'pending', priority: 'medium' });
            getDashboardItems(auth.currentUser.uid, 'tasks').then(setTasks);
        }
    };

    return (
        <div className="space-y-2">
            <button onClick={addTask} className="text-cyan-400 flex items-center gap-1 hover:text-cyan-300 transition-colors">
                <Plus size={12}/> Adicionar Tarefa
            </button>
            {tasks.map(t => (
                <div key={t.id} className="bg-slate-900 p-2 rounded border border-slate-700">
                    {t.title} - <span className="text-[10px] text-slate-500">{t.status}</span>
                </div>
            ))}
        </div>
    );
};
