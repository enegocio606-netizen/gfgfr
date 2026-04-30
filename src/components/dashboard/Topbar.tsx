import React from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  Moon, 
  User as UserIcon,
  CheckSquare,
  Wallet,
  Link as LinkIcon,
  MessageSquare,
  FileText,
  Activity,
  Repeat,
  CreditCard,
  Users,
  BarChart3,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';

const menuItems = [
  { id: 'tasks', icon: CheckSquare, label: 'Tarefas' },
  { id: 'finance', icon: Wallet, label: 'Financeiro', active: true },
  { id: 'links', icon: LinkIcon, label: 'Links' },
  { id: 'reminders', icon: Bell, label: 'Lembretes' },
  { id: 'conversations', icon: MessageSquare, label: 'Conversas' },
  { id: 'notes', icon: FileText, label: 'Bloco de Notas' },
  { id: 'monitoring', icon: Activity, label: 'Monitoramento' },
  { id: 'movements', icon: Activity, label: 'Movimentações' },
  { id: 'recurring', icon: Repeat, label: 'Recorrentes' },
  { id: 'accounts', icon: CreditCard, label: 'Contas' },
  { id: 'third_parties', icon: Users, label: 'Terceiros' },
  { id: 'reports', icon: BarChart3, label: 'Relatórios' },
];

export const Topbar: React.FC = () => {
  return (
    <header className="fixed top-0 right-0 left-20 lg:left-64 h-24 bg-[#070B14]/80 backdrop-blur-xl border-b border-blue-500/10 z-40 px-8 pt-4 flex flex-col justify-center">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Painel Visual FocoFlow
            <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">V2.0</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gerencie suas tarefas, finanças e links em um só lugar.</p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.open('https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev', '_blank')}
            className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-2 rounded-xl transition-all font-bold text-[10px] tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.1)] group"
          >
            <ExternalLink size={14} className="group-hover:rotate-12 transition-transform" />
            ABRIR PAINEL
          </button>

          <div className="flex items-center bg-slate-900/50 border border-slate-800 rounded-xl px-3 py-2 focus-within:border-blue-500/50 transition-all">
            <Search size={18} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="bg-transparent border-none outline-none text-sm text-slate-300 ml-2 w-48"
            />
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#070B14]"></span>
            </button>
            <button className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
              <Settings size={20} />
            </button>
            <button className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all">
              <Moon size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-800">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              FC
            </div>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex items-center gap-6 overflow-x-auto no-scrollbar">
        {menuItems.map((item) => (
          <button 
            key={item.id}
            className={`flex items-center gap-2 text-xs font-medium whitespace-nowrap transition-all pb-1 border-b-2 ${
              item.active 
                ? 'text-blue-400 border-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            <item.icon size={14} />
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
