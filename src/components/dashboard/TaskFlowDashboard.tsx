import React, { useState } from 'react';
import { Plus, Check, Trash2, Clock, CheckCircle } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  date: string;
  status: 'pendente' | 'concluída';
}

export const TaskFlowDashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', name: 'Revisar relatório financeiro', date: '29/04', status: 'pendente' },
    { id: '2', name: 'Reunião estratégica', date: '30/04', status: 'concluída' },
  ]);
  const [newTaskName, setNewTaskName] = useState('');

  const addTask = () => {
    if (!newTaskName) return;
    const newTask: Task = {
      id: Date.now().toString(),
      name: newTaskName,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      status: 'pendente',
    };
    setTasks([...tasks, newTask]);
    setNewTaskName('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'concluída' ? 'pendente' : 'concluída' } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'concluída').length;
  const pending = total - completed;

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] text-white p-8 gap-8">
      {/* Header */}
      <header className="flex justify-between items-center border-b border-[#1C2A3F] pb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-wider text-[#00E5FF]">ATLAS | Fluxo de Tarefas</h1>
        </div>
        <div className="flex items-center gap-6 text-sm font-mono text-[#00E5FF]">
          <span className="bg-[#00E5FF]/10 px-3 py-1 rounded">ONLINE</span>
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </header>
      
      {/* Summary */}
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-[#0F141A] border border-[#1C2A3F] rounded shadow-lg">
            <span className="text-4xl font-bold text-white">{total}</span>
            <p className="text-xs text-[#00E5FF] uppercase mt-2 tracking-widest">Total</p>
        </div>
        <div className="p-6 bg-[#0F141A] border border-[#1C2A3F] rounded shadow-lg">
            <span className="text-4xl font-bold text-green-400">{completed}</span>
            <p className="text-xs text-green-400 uppercase mt-2 tracking-widest">Concluídas</p>
        </div>
        <div className="p-6 bg-[#0F141A] border border-[#1C2A3F] rounded shadow-lg">
            <span className="text-4xl font-bold text-cyan-400">{pending}</span>
            <p className="text-xs text-cyan-400 uppercase mt-2 tracking-widest">Pendentes</p>
        </div>
      </div>

      {/* Kanban/Task Section */}
      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-white tracking-wider">Fluxo de Tarefas</h2>
        
        <div className="flex gap-4">
            <input 
                type="text" 
                value={newTaskName} 
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Nova tarefa..."
                className="flex-1 bg-[#111827] border border-[#1C2A3F] p-4 text-sm outline-none focus:border-[#00E5FF] transition-all"
            />
            <button onClick={addTask} className="bg-[#00E5FF] text-[#0B0F14] px-8 py-4 font-bold flex items-center gap-2 hover:bg-[#00c5dd] transition-all">
                <Plus size={20} /> Adicionar
            </button>
        </div>

        <div className="flex flex-col gap-4">
          {tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between bg-[#111827] p-5 border border-[#1C2A3F] hover:border-[#00E5FF] transition-all hover:shadow-[0_0_10px_rgba(0,229,255,0.1)]">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded ${task.status === 'concluída' ? 'text-green-400' : 'text-[#00E5FF]'}`}>
                    {task.status === 'concluída' ? <CheckCircle size={22} /> : <Clock size={22} />}
                </div>
                <div>
                    <p className={`font-semibold ${task.status === 'concluída' ? 'line-through text-gray-500' : 'text-white'}`}>{task.name}</p>
                    <p className="text-xs text-gray-400">{task.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => toggleTask(task.id)} className="p-2 hover:text-[#00E5FF] transition-colors">
                    <Check size={20} />
                </button>
                <button onClick={() => deleteTask(task.id)} className="p-2 hover:text-red-400 transition-colors">
                    <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
