import { Card } from "../../ui/card"
import { cn } from "../../../lib/utils"
import { TrendingUp, TrendingDown } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string
  variation: number
  trend: "up" | "down"
  color: "green" | "red" | "blue" | "purple"
  className?: string
}

export function KpiCard({ title, value, variation, trend, color, className }: KpiCardProps) {
  const colorStyles = {
    green: "from-emerald-500/20 to-emerald-500/0 text-emerald-400 border-emerald-500/20",
    red: "from-destructive/20 to-destructive/0 text-destructive border-destructive/20",
    blue: "from-blue-500/20 to-blue-500/0 text-blue-400 border-blue-500/20",
    purple: "from-purple-500/20 to-purple-500/0 text-purple-400 border-purple-500/20",
  }

  return (
    <Card className={cn("glass border-white/5 overflow-hidden transition-all hover:scale-[1.02] hover:border-white/10", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", colorStyles[color])} />
      <div className="p-5 relative space-y-2">
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{title}</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-headline font-bold tracking-tight">{value}</h3>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md border",
            trend === "up" 
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
              : "text-destructive bg-destructive/10 border-destructive/20"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {variation}%
          </div>
        </div>
      </div>
      <div className="h-1 w-full bg-white/5">
        <div className={cn("h-full transition-all duration-1000", {
          "bg-emerald-500 neon-green": color === "green",
          "bg-destructive": color === "red",
          "bg-blue-500 neon-blue": color === "blue",
          "bg-purple-500": color === "purple",
        })} style={{ width: "65%" }} />
      </div>
    </Card>
  )
}
