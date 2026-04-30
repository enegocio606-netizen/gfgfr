"use client"

import { useFinancial } from "../../../context/FinancialContext"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { ArrowUpRight, ArrowDownRight, Target } from "lucide-react"
import { cn } from "../../../lib/utils"

export function RecentActivities() {
  const { transactions } = useFinancial()
  
  const activities = useMemo(() => {
    return [
        ...transactions.map(t => ({
          id: t.id,
          type: 'transaction',
          title: t.description || t.descricao,
          subtitle: t.category || t.categoria,
          amount: t.amount || t.valor,
          date: t.date || t.data,
          direction: (t.type === 'income' || t.tipo === 'income') ? 'in' : 'out'
        }))
      ].sort((a, b) => {
          const dateA = typeof a.date === 'string' ? new Date(a.date).getTime() : a.date;
          const dateB = typeof b.date === 'string' ? new Date(b.date).getTime() : b.date;
          return dateB - dateA;
      }).slice(0, 6)
  }, [transactions]);

  function formatDate(d: any) {
    if (!d) return "";
    if (typeof d === 'number') return new Date(d).toLocaleDateString();
    return new Date(d).toLocaleDateString();
  }

  return (
    <Card className="glass border-white/5">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length > 0 ? activities.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  item.direction === 'in' ? "bg-emerald-500/10 text-emerald-400" : 
                  item.direction === 'out' ? "bg-destructive/10 text-destructive" :
                  "bg-primary/10 text-primary"
                )}>
                  {item.direction === 'in' ? <ArrowUpRight className="w-4 h-4" /> : 
                   item.direction === 'out' ? <ArrowDownRight className="w-4 h-4" /> :
                   <Target className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground truncate max-w-[150px]">{item.title}</span>
                  <span className="text-[10px] text-muted-foreground">{item.subtitle}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                {item.amount && (
                  <span className={cn(
                    "text-xs font-bold",
                    item.direction === 'in' ? "text-emerald-400" : "text-destructive"
                  )}>
                    {item.direction === 'in' ? '+' : '-'} R$ {item.amount.toLocaleString('pt-BR')}
                  </span>
                )}
                <span className="text-[10px] text-muted-foreground">{formatDate(item.date)}</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 text-xs text-muted-foreground">Nenhuma atividade recente.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { useMemo } from "react"
