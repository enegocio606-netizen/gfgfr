"use client"

import { useState } from "react"
import { useFinancial } from "../../../context/FinancialContext"
import { KpiCard } from "./kpi-card"
import { CashFlowChart } from "./cash-flow-chart"
import { ExpenseDistribution } from "./expense-distribution"
import { RecentActivities } from "./recent-activities"
import { AiInsights } from "./ai-insights"
import { FinancialHealth } from "./financial-health"
import { GoalsProgress } from "./goals-progress"
import { PayableReceivable } from "./payable-receivable"
import { FinancialFooter } from "./financial-footer"
import { TransactionModal } from "./transaction-modal"
import { Button } from "../../ui/button"
import { Card } from "../../ui/card"
import { PlusCircle, Wallet, TrendingUp, TrendingDown, Target, Building2, Search, ExternalLink } from "lucide-react"
import { Input } from "../../ui/input"

export function FocoFlowNXDashboard() {
  const { totals } = useFinancial()
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="flex flex-col h-full bg-[#030711] text-foreground overflow-hidden">
      {/* Dynamic Header */}
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Wallet className="w-6 h-6 text-primary neon-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-headline">FOCOFLOW <span className="text-primary">NX</span></h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">Neural Financial Operating System</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar transações..." 
              className="pl-10 w-64 bg-white/5 border-white/10 h-9 text-xs focus:border-primary/50 transition-all"
            />
          </div>
          <Button 
            onClick={() => window.open('https://9000-firebase-studio-1777509493223.cluster-gizzoza7hzhfyxzo5d76y3flkw.cloudworkstations.dev/', '_blank')}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10 font-bold text-xs gap-2 shadow-[0_0_15px_rgba(72,162,211,0.1)] hidden lg:flex"
          >
            <ExternalLink className="w-4 h-4" />
            ABRIR STUDIO
          </Button>
          <Button 
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-2 shadow-[0_0_20px_rgba(72,162,211,0.2)]"
          >
            <PlusCircle className="w-4 h-4" />
            NOVO LANÇAMENTO
          </Button>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
        <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard 
              title="Saldo Consolidado" 
              value={`R$ ${totals.balance.toLocaleString('pt-BR')}`}
              variation={2.5}
              trend="up"
              color="blue"
            />
            <KpiCard 
              title="Entradas do Mês" 
              value={`R$ ${totals.income.toLocaleString('pt-BR')}`}
              variation={12.4}
              trend="up"
              color="green"
            />
            <KpiCard 
              title="Despesas Acumuladas" 
              value={`R$ ${totals.expenses.toLocaleString('pt-BR')}`}
              variation={5.2}
              trend="down"
              color="red"
            />
            <KpiCard 
              title="Lucro Líquido" 
              value={`R$ ${totals.netProfit.toLocaleString('pt-BR')}`}
              variation={8.1}
              trend="up"
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Primary Charts */}
            <div className="lg:col-span-8 space-y-6">
              <CashFlowChart />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ExpenseDistribution />
                <AiInsights />
              </div>

              <PayableReceivable />
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-4 space-y-6">
              <FinancialHealth />
              <GoalsProgress />
              <RecentActivities />
              
              <Card className="glass border-white/5 p-4 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building2 className="w-16 h-16" />
                </div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase mb-4">Patrimônio Alocado</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Investimentos</span>
                    <span className="font-bold">R$ 42.500,00</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Reservas</span>
                    <span className="font-bold">R$ 12.800,00</span>
                  </div>
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase text-primary">Total Estimado</span>
                    <span className="text-sm font-bold text-primary neon-blue">R$ 55.300,00</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <FinancialFooter />

      <TransactionModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </div>
  )
}
