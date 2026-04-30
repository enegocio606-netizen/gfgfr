"use client"

import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { useFinancial } from "../../../context/FinancialContext"
import { Progress } from "../../ui/progress"

export function GoalsProgress() {
  const { goals } = useFinancial()

  return (
    <Card className="glass border-white/5">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Metas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.length > 0 ? goals.slice(0, 3).map((goal) => {
          const current = goal.valor_atual || goal.currentProgress || 0
          const target = goal.valor_alvo || goal.targetAmount || 1
          const progress = Math.round((current / target) * 100)
          const name = goal.titulo || goal.name || "Sem título"
          
          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    R$ {current.toLocaleString('pt-BR')} de R$ {target.toLocaleString('pt-BR')}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary neon-blue">{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>
          )
        }) : (
          <div className="text-xs text-muted-foreground text-center py-4">Nenhuma meta ativa.</div>
        )}
      </CardContent>
    </Card>
  )
}
