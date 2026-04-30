import React, { useState, useEffect } from 'react';
import { getFocoFlowData, createFocoFlowTask, updateFocoFlowItem, deleteFocoFlowItem } from '@/services/focoFlowService';
import { auth, db, collection, query, where, onSnapshot } from '@/firebase-singleton';
import { Plus, Trash2, AlertCircle, Sparkles, Calendar as CalendarIcon } from 'lucide-react';
import { summarizeText } from '@/services/geminiService';
import { Calendar } from '@/src/components/calendar/Calendar';

export const TaskFlowModule = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    useEffect(() => {
        if (!auth.currentUser) return;

        const q = query(
            collection(db, 'itens_focoflow'),
            where('uid', '==', auth.currentUser.uid),
            where('categoria', '==', 'task')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching tasks:", error);
        });

        return () => unsubscribe();
    }, []);

    const addTask = async () => {
        if (auth.currentUser && newTaskTitle) {
            await createFocoFlowTask(auth.currentUser.uid, { 
                title: newTaskTitle, 
                status: 'todo', 
                priority: 'medium',
                // (deadline handling needs to be mapped to project_id or updated)
            });
            setNewTaskTitle('');
        }
    };

    const updateTask = async (id: string, data: any) => {
        await updateFocoFlowItem(id, data);
    };

    const deleteTask = async (id: string) => {
        await deleteFocoFlowItem(id);
    };

    const runAiReorganization = async () => {
        const pendingTasks = tasks.filter(t => t.status !== 'done');
        const prompt = `Reorganize estas tarefas por prioridade e sugira quais devo fazer primeiro ou delegar: ${pendingTasks.map(t => t.titulo).join(', ')}`;
        const suggestion = await summarizeText(prompt);
        setAiSuggestion(suggestion);
    };

    const pendingTasks = tasks.filter(t => t.status !== 'done');
    const isOverloaded = pendingTasks.length > 5;

    return (
        <div className="space-y-4 text-[11px] font-mono p-2">
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newTaskTitle} 
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Nova tarefa..."
                    className="flex-1 bg-slate-900 border border-slate-700 p-1 text-slate-100"
                />
                <button onClick={() => setShowCalendar(!showCalendar)} className={`p-1 border ${showCalendar ? 'border-cyan-500 bg-cyan-900' : 'border-slate-700'}`}>
                    <CalendarIcon size={14} className={showCalendar ? 'text-white' : 'text-slate-400'} />
                </button>
                <button onClick={addTask} className="text-cyan-400 p-1 border border-cyan-800 hover:bg-cyan-950"><Plus size={14}/></button>
            </div>
            
            {showCalendar && (
                <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
            )}

            {isOverloaded && <div className="text-red-400 flex items-center gap-1"><AlertCircle size={12}/> Sobrecarga de tarefas!</div>}
            
            <button onClick={runAiReorganization} className="text-purple-400 flex items-center gap-1 hover:text-purple-200">
                <Sparkles size={12}/> Sugestão IA
            </button>
            {aiSuggestion && <div className="text-purple-300 p-2 border border-purple-900 bg-purple-950/20">{aiSuggestion}</div>}

            <div className="space-y-1">
                {tasks.map(t => (
                    <div key={t.id} className="flex justify-between items-center bg-slate-900 p-1 border border-slate-800">
                        <span className={t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}>
                            {t.titulo}
                        </span>
                        <div className="flex gap-1">
                            <select value={t.prioridade} onChange={(e) => updateTask(t.id, { prioridade: e.target.value })} className="bg-slate-800 text-[10px]">
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                            </select>
                            <select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value })} className="bg-slate-800 text-[10px]">
                                <option value="todo">Pendente</option>
                                <option value="in_progress">Progresso</option>
                                <option value="done">Concluída</option>
                            </select>
                            <button onClick={() => deleteTask(t.id)} className="text-red-400"><Trash2 size={12}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
