"use client"

import { useState } from "react"
import { PositionCalculator } from "@/components/position-calculator"
import { PnLCalendar } from "@/components/pnl-calendar"
import { Calculator, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

type Tab = "calculator" | "calendar"

export function TradingDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("calculator")

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Tabs */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-4xl px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              Trading Dashboard
            </h1>
            
            {/* Tab Navigation */}
            <nav className="flex rounded-lg bg-muted p-1" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "calculator"}
                onClick={() => setActiveTab("calculator")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === "calculator"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Position Calculator</span>
                <span className="sm:hidden">Calculator</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "calendar"}
                onClick={() => setActiveTab("calendar")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === "calendar"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">P&L Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Tab Content */}
      <main className="p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          {activeTab === "calculator" ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Position Size Calculator
                </h2>
                <p className="text-muted-foreground">
                  Calculate your optimal position size and manage risk effectively
                </p>
              </div>
              <PositionCalculator />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Trading P&L Calendar
                </h2>
                <p className="text-muted-foreground">
                  Track your daily trading performance
                </p>
              </div>
              <PnLCalendar />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
