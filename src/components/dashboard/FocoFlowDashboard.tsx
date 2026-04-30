
import React from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { RightSidebar } from './RightSidebar';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Plus, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { TaskFlowDashboard } from './TaskFlowDashboard';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const StatsCard = ({ title, value, percentage, color, icon: Icon }: { title: string, value: string, percentage: string, color: string, icon: any }) => (
    <motion.div variants={itemVariants} className="glassy-modal-container p-6 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-3 opacity-20 text-${color}-400`}>
        <Icon size={24} />
      </div>
      <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest">{title}</div>
      <div className="text-white text-3xl font-bold mt-2 tracking-tight">{value}</div>
      <div className="text-cyan-400/60 text-[10px] mt-1">{percentage}</div>
      <div className={`absolute bottom-0 left-0 h-1 bg-${color}-500 w-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
    </motion.div>
);

const renderTasksView = (data: any[], pieData: any[], COLORS: string[]) => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-3 grid-rows-[auto,1fr,1fr] gap-4 h-full">
        <div className="col-span-3 grid grid-cols-4 gap-4">
              <StatsCard title="Total Tarefas" value="24" percentage="100%" color="blue" icon={Zap} />
              <StatsCard title="Concluídas" value="08" percentage="33.3%" color="green" icon={TrendingUp} />
              <StatsCard title="Em Andamento" value="10" percentage="41.7%" color="cyan" icon={Zap} />
              <StatsCard title="Pendentes" value="06" percentage="25.0%" color="purple" icon={TrendingUp} />
        </div>
        
        <div className="col-span-2 border border-cyan-500/30 bg-black/60 p-4 shadow-lg">
            <h3 className="text-xs text-cyan-400 font-bold uppercase mb-4">Desempenho Semanal</h3>
            <ResponsiveContainer width="100%" height="80%">
                <LineChart data={data}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <Line type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="border border-cyan-500/30 bg-black/60 p-4 shadow-lg flex flex-col items-center">
            <h3 className="text-xs text-cyan-400 font-bold uppercase mb-4 self-start">Distribuição de Status</h3>
            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                    <Pie data={pieData} dataKey="v" innerRadius={40} outerRadius={60}>
                       {pieData.map((item, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="border border-cyan-500/30 bg-black/60 p-4 shadow-lg">Next Tasks Placeholder</div>
        <div className="col-span-2 border border-cyan-500/30 bg-black/60 p-4 shadow-lg">Recent Activity Placeholder</div>
    </motion.div>
);

const renderFinanceView = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-3 gap-4 h-full">
        <div className="col-span-3 grid grid-cols-4 gap-4">
              <StatsCard title="Saldo Atual" value="R$ 375,00" percentage="Saúde: 85%" color="green" icon={DollarSign} />
              <StatsCard title="Entradas" value="R$ 1.500,00" percentage="+5% vs mês anterior" color="blue" icon={TrendingUp} />
              <StatsCard title="Saídas" value="R$ 1.125,00" percentage="-10% vs mês anterior" color="purple" icon={Zap} />
              <StatsCard title="Despesa (%)" value="75%" percentage="Relação receita gasto" color="orange" icon={DollarSign} />
        </div>
        <div className="col-span-2 border border-cyan-500/30 bg-black/60 p-4 shadow-lg">
            <h3 className="text-xs text-cyan-400 font-bold uppercase mb-4">Evolução do Saldo</h3>
             <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                    { name: 'Início', v: 0 }, { name: '10/03', v: -200 }, { name: '14/03', v: 1400 }, 
                    { name: '25/03', v: 900 }, { name: '04/04', v: 375 }
                ]}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{backgroundColor: '#000', borderColor: '#06b6d4'}} />
                    <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2} dot={{fill: '#8b5cf6'}} />
                </LineChart>
            </ResponsiveContainer>
        </div>
        <div className="border border-cyan-500/30 bg-black/60 p-4 shadow-lg flex flex-col">
            <h3 className="text-xs text-cyan-400 font-bold uppercase mb-4">Resumo</h3>
            <div className="text-white text-sm">Transações: 8</div>
            <div className="text-green-500 text-sm">Maior Saldo: R$ 1.421,00</div>
            <div className="text-red-500 text-sm">Menor Saldo: -R$ 200,00</div>
        </div>
    </motion.div>
);


const FocoFlowDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<'tasks' | 'finance' | 'goals' | 'links' | 'reminders' | 'memory' | 'notes' | 'conversations'>('tasks');
  const data = [
      { name: 'SEG', v: 5 }, { name: 'TER', v: 10 }, { name: 'QUA', v: 8 }, 
      { name: 'QUI', v: 18 }, { name: 'SEX', v: 12 }, { name: 'SAB', v: 15 }, { name: 'DOM', v: 8 }
  ];
  
  const pieData = [{name: 'Concluídas', v: 33}, {name: 'Andamento', v: 42}, {name: 'Pendentes', v: 25}];
  const COLORS = ['#22c55e', '#06b6d4', '#8b5cf6'];

  return (
    <div className="flex h-screen bg-[#020617] text-cyan-400 font-mono overflow-hidden">
      <Sidebar activeId="tasks" />

      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="border border-cyan-500/30 bg-black/60 p-4 flex justify-between items-center shadow-[0_0_20px_rgba(0,242,255,0.05)]">
            <div>
                <h1 className="text-2xl font-bold uppercase tracking-widest text-white">FocoFlow</h1>
                <div className="flex gap-4 mt-2 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('tasks')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'tasks' ? 'text-cyan-400' : 'text-gray-500'}`}>Tarefas</button>
                    <button onClick={() => setActiveTab('finance')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'finance' ? 'text-cyan-400' : 'text-gray-500'}`}>Financeiro</button>
                    <button onClick={() => setActiveTab('goals')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'goals' ? 'text-cyan-400' : 'text-gray-500'}`}>Metas</button>
                    <button onClick={() => setActiveTab('links')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'links' ? 'text-cyan-400' : 'text-gray-500'}`}>Links</button>
                    <button onClick={() => setActiveTab('reminders')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'reminders' ? 'text-cyan-400' : 'text-gray-500'}`}>Lembretes</button>
                    <button onClick={() => setActiveTab('memory')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'memory' ? 'text-cyan-400' : 'text-gray-500'}`}>Memória</button>
                    <button onClick={() => setActiveTab('notes')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'notes' ? 'text-cyan-400' : 'text-gray-500'}`}>Notas</button>
                    <button onClick={() => setActiveTab('conversations')} className={`text-xs font-bold uppercase whitespace-nowrap ${activeTab === 'conversations' ? 'text-cyan-400' : 'text-gray-500'}`}>Conversas</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input type="text" placeholder="Insira sua tarefa..." className="bg-black/80 border border-cyan-500/30 p-2 w-96 text-xs text-white" />
                <button className="bg-cyan-500 text-black px-4 py-2 font-bold hover:bg-cyan-400 text-xs">ADICIONAR</button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto">
            {activeTab === 'tasks' ? <TaskFlowDashboard /> :
             activeTab === 'finance' ? renderFinanceView() :
             <div className="p-4 text-white">Módulo em desenvolvimento: {activeTab}</div>}
        </div>
      </div>

      <div className="w-80 border-l border-cyan-500/30 bg-black/60 p-4 font-mono text-xs">
          <div className="text-cyan-400 mb-6">🗓 Calendário</div>
          <div className="text-cyan-400 mb-6">⏰ Lembretes Rápidos</div>
          <div className="text-cyan-400">🔗 Integrações Ativas</div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 border-t border-cyan-500/30 bg-black p-2 flex justify-between text-[10px] text-cyan-400/80">
          <div>USER: ADMIN | LEVEL: MASTER</div>
          <div>MEMORY: 72% | CPU: 35% | REDE: ESTÁVEL</div>
      </div>
    </div>
  );
};
