"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { useFinancial } from "../../../context/FinancialContext"

const COLORS = [
  "var(--cyan-vibrant)",
  "var(--purple-vibrant)",
  "var(--pink-vibrant)",
  "var(--green-vibrant)",
  "var(--orange-vibrant)",
  "var(--blue-vibrant)",
]

export function ExpenseDistribution() {
  const { transactions } = useFinancial()

  const data = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, t) => {
      const cat = t.category || t.categoria || 'Geral'
      const amount = t.amount || t.valor || 0
      acc[cat] = (acc[cat] || 0) + amount
      return acc
    }, {} as Record<string, number>)

    return Object.entries(grouped)
      .map(([name, value], index) => ({
        name,
        value: Number(value),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [transactions])

  return (
    <Card className="glass border-white/5 h-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Distribuição de Despesas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="glass border-white/10 p-2 rounded-lg text-xs">
                        <span className="font-bold">{payload[0].name}:</span> R$ {payload[0].value?.toLocaleString('pt-BR')}
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 w-full mt-4">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
              <span className="text-[10px] font-bold ml-auto">R$ {(item.value as number).toLocaleString('pt-BR')}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
