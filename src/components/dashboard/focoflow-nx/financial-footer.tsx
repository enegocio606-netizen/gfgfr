"use client"

import { useState, useEffect } from "react"
import { Activity, Cpu, Database, Network, ShieldCheck } from "lucide-react"

export function FinancialFooter() {
  const [efficiency, setEfficiency] = useState(94.2)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setEfficiency(prev => {
        const change = (Math.random() - 0.5) * 0.2
        return parseFloat((prev + change).toFixed(1))
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="h-10 border-t border-white/5 bg-black/40 backdrop-blur-md px-6 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-widest font-medium shrink-0">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
          <span>Process Efficiency: <span className="text-foreground">{efficiency}%</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-primary" />
          <span>Buffer Allocation: <span className="text-foreground">Optimal</span></span>
        </div>
        <div className="flex items-center gap-2">
          <Cpu className="w-3 h-3 text-secondary" />
          <span>Memory Core: <span className="text-foreground">1.4GB / 4.0GB</span></span>
        </div>
      </div>
      
      <div className="flex items-center gap-6 hidden md:flex">
        <div className="flex items-center gap-2">
          <Network className="w-3 h-3 text-emerald-400" />
          <span>Network Status: <span className="text-foreground">Synchronized</span></span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-primary" />
          <span>Core Integrity: <span className="text-foreground">Stable</span></span>
        </div>
      </div>
    </footer>
  )
}
