"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card"
import { Sparkles, Loader2, AlertTriangle, Lightbulb, TrendingUp, RefreshCw } from "lucide-react"
import { aiFinancialInsights, type AiFinancialInsightsOutput } from "../../../services/aiFinanceService"
import { useFinancial } from "../../../context/FinancialContext"
import { Button } from "../../ui/button"
import { cn } from "../../../lib/utils"

export function AiInsights() {
  const { totals, transactions } = useFinancial()
  const [insights, setInsights] = useState<AiFinancialInsightsOutput | null>(null)
  const [loading, setLoading] = useState(true)

  const getInsights = async () => {
    setLoading(true)
    try {
      const expenses = transactions.filter(t => t.type === 'expense')
      const grouped = expenses.reduce((acc, t) => {
        const cat = t.category || t.categoria || 'Geral'
        acc[cat] = (acc[cat] || 0) + (t.amount || t.valor || 0)
        return acc
      }, {} as Record<string, number>)
      
      const distribution = Object.entries(grouped).map(([category, totalSpent]) => ({
        category,
        totalSpent
      }))

      const result = await aiFinancialInsights({
        currentBalance: totals.balance,
        totalIncome: totals.income,
        totalExpenses: totals.expenses,
        netProfit: totals.netProfit,
        transactions: transactions.slice(0, 10).map(t => ({
          type: t.type,
          category: t.category || t.categoria,
          amount: t.amount || t.valor,
          date: t.date || t.data,
          description: t.description || t.descricao
        })),
        spendingDistribution: distribution.length ? distribution : [{ category: "Geral", totalSpent: totals.expenses }],
        financialGoals: []
      })
      setInsights(result)
    } catch (error) {
      console.error("AI Insights Error:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getInsights()
  }, [])

  return (
    <Card className="glass border-secondary/20 h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-secondary neon-purple flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          INSIGHTS INTELIGENTES
        </CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground hover:text-secondary" 
          onClick={getInsights}
          disabled={loading}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            <p className="text-xs animate-pulse">Analisando fluxo de capital...</p>
          </div>
        ) : insights ? (
          <div className="space-y-6 overflow-auto max-h-[400px] pr-2 scrollbar-thin">
            <div className="p-3 bg-secondary/5 border border-secondary/10 rounded-lg">
              <p className="text-xs leading-relaxed text-foreground/90 italic">
                "{insights.overallSummary}"
              </p>
            </div>

            {insights.savingsSuggestions?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Lightbulb className="w-3 h-3" /> Sugestões de Economia
                </div>
                <ul className="space-y-2">
                  {insights.savingsSuggestions.map((tip, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-emerald-500">•</span> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.highSpendingAlerts?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-destructive text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" /> Alertas de Gastos
                </div>
                <ul className="space-y-2">
                  {insights.highSpendingAlerts.map((alert, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-destructive">•</span> {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {insights.improvementOpportunities?.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" /> Melhorias
                </div>
                <ul className="space-y-2">
                  {insights.improvementOpportunities.map((opt, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span> {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground p-4 text-center">
            Não foi possível processar insights no momento.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
