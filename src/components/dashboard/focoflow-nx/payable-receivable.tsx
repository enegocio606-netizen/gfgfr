"use client"

import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { useFinancial } from "../../../context/FinancialContext"
import { Clock } from "lucide-react"

export function PayableReceivable() {
  const { payable, receivable } = useFinancial()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Contas a Receber
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receivable.length > 0 ? receivable.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded bg-emerald-500/5 border border-emerald-500/10">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium">{item.name || item.descricao}</span>
                  <span className="text-[9px] text-muted-foreground">{item.date || new Date(item.data).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400">R$ {item.amount?.toLocaleString('pt-BR') || item.valor?.toLocaleString('pt-BR')}</span>
            </div>
          )) : (
            <div className="text-[10px] text-muted-foreground text-center py-2">Nada a receber.</div>
          )}
        </CardContent>
      </Card>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payable.length > 0 ? payable.map(item => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded bg-destructive/5 border border-destructive/10">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-destructive" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium">{item.name || item.descricao}</span>
                  <span className="text-[9px] text-muted-foreground">{item.date || new Date(item.data).toLocaleDateString()}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-destructive">R$ {item.amount?.toLocaleString('pt-BR') || item.valor?.toLocaleString('pt-BR')}</span>
            </div>
          )) : (
            <div className="text-[10px] text-muted-foreground text-center py-2">Nada a pagar.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
