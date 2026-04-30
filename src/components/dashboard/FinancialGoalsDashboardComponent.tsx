import React from 'react';
import { Plus, BarChart2, ListChecks, Pencil } from 'lucide-react';

const FinancialGoalsDashboardComponent = () => {
  return (
    <div id="financial-goals-container" className="bg-[#0f172a]/70 p-6 rounded-none border border-[#00eaff]/20 text-white font-sans backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="text-[#00eaff] h-8 w-8" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">2. METAS FINANCEIRAS</h2>
          <p className="text-gray-400 text-sm">Planeje, acompanhe e atinja suas metas financeiras.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Functionalities */}
        <div id="financial-goals-functionalities">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#00eaff]/10 pb-2">Funcionalidades</h3>
          <ul className="space-y-3 text-sm text-gray-300">
            {[
              "Criar metas financeiras",
              "Definir valor alvo e prazo",
              "Acompanhar progresso em tempo real",
              "Categorizar metas (Casa, Viagem, Investimento...)",
              "Visualizar gráficos de evolução",
              "Receber alertas de metas próximas",
              "Relatórios mensais e anuais"
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#00eaff] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div id="financial-goals-quick-actions" className="border-l border-[#00eaff]/10 pl-8">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 border-b border-[#00eaff]/10 pb-2">Ações Rápidas</h3>
          <div className="space-y-3">
            {[
              { icon: Plus, label: "Nova Meta" },
              { icon: BarChart2, label: "Ver Progresso" },
              { icon: ListChecks, label: "Relatórios" },
              { icon: Pencil, label: "Editar Metas" }
            ].map((action, index) => (
              <button 
                key={index}
                className="flex items-center gap-3 w-full p-3 bg-[#0a0f1d] hover:bg-[#1e293b] border border-[#00eaff]/10 hover:border-[#00eaff]/30 transition-all text-sm rounded-none"
              >
                <action.icon className="text-[#00eaff] h-4 w-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialGoalsDashboardComponent;
