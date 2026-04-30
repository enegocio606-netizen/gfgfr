"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { useFinancial } from "../../../context/FinancialContext"

export function CashFlowChart() {
  const { transactions } = useFinancial()

  const data = useMemo(() => {
    const currentMonthIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.amount || t.valor || 0), 0)
    const currentMonthExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (t.amount || t.valor || 0), 0)

    return [
      { month: "Jan", income: 7200, expenses: 4500 },
      { month: "Fev", income: 8100, expenses: 5200 },
      { month: "Mar", income: currentMonthIncome, expenses: currentMonthExpense },
      { month: "Abr", income: 0, expenses: 0 },
      { month: "Mai", income: 0, expenses: 0 },
      { month: "Jun", income: 0, expenses: 0 },
    ]
  }, [transactions])

  return (
    <Card className="glass border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Fluxo de Caixa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(225, 25%, 15%, 0.5)" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip 
                cursor={{ fill: 'hsla(var(--muted), 0.3)' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass border-white/10 p-3 rounded-lg shadow-2xl">
                        <p className="text-xs font-bold mb-1">{payload[0].payload.month}</p>
                        <p className="text-xs text-primary">Receitas: R$ {payload[0].value?.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-secondary">Despesas: R$ {payload[1].value?.toLocaleString('pt-BR')}</p>
                        <p className="text-xs font-medium border-t border-white/10 mt-1 pt-1">
                          Saldo: R$ {((payload[0].value as number) - (payload[1].value as number))?.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar 
                dataKey="income" 
                name="Receitas" 
                fill="var(--cyan-vibrant)" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
              <Bar 
                dataKey="expenses" 
                name="Despesas" 
                fill="var(--purple-vibrant)" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
