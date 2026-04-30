"use client"

import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { ShieldCheck } from "lucide-react"

export function FinancialHealth() {
  const score = 84

  return (
    <Card className="glass border-white/5">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Saúde Financeira
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center pt-2">
        <div className="relative w-32 h-32 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 58}
              strokeDashoffset={2 * Math.PI * 58 * (1 - score / 100)}
              strokeLinecap="round"
              className="text-primary neon-blue transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold font-headline">{score}</span>
            <span className="text-[10px] text-muted-foreground uppercase">Score</span>
          </div>
        </div>
        <div className="mt-4 text-center">
          <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
            <ShieldCheck className="w-3 h-3" /> Nível Seguro
          </div>
          <p className="text-[10px] text-muted-foreground max-w-[150px]">
            Seu perfil está acima da média dos usuários. Mantenha os custos fixos sob controle.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
