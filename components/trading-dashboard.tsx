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
              <PnLCalendarContent />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Extracted calendar content without wrapper
function PnLCalendarContent() {
  return <PnLCalendarInner />
}

// Import the inner content directly
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronLeft, ChevronRight, X, TrendingUp, TrendingDown } from "lucide-react"

interface DayData {
  [key: string]: number | null
}

const STORAGE_KEY = "trading-pnl-calendar"

function PnLCalendarInner() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<DayData>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setCalendarData(JSON.parse(saved))
      } catch {
        setCalendarData({})
      }
    }
  }, [])

  const saveData = useCallback((data: DayData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setCalendarData(data)
  }, [])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const monthName = currentDate.toLocaleString("default", { month: "long" })
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const getDayKey = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const handleDayClick = (day: number) => {
    const key = getDayKey(day)
    setSelectedDay(key)
    const existingValue = calendarData[key]
    setInputValue(existingValue !== null && existingValue !== undefined ? String(existingValue) : "")
  }

  const handleSave = () => {
    if (selectedDay === null) return
    const normalizedValue = inputValue.replace(",", ".")
    const value = parseFloat(normalizedValue)
    
    const newData = { ...calendarData }
    if (isNaN(value) || inputValue.trim() === "") {
      delete newData[selectedDay]
    } else {
      newData[selectedDay] = value
    }
    saveData(newData)
    setSelectedDay(null)
    setInputValue("")
  }

  const handleClear = () => {
    if (selectedDay === null) return
    const newData = { ...calendarData }
    delete newData[selectedDay]
    saveData(newData)
    setSelectedDay(null)
    setInputValue("")
  }

  const monthlyStats = (() => {
    let total = 0
    let profitDays = 0
    let lossDays = 0
    let tradingDays = 0

    for (let day = 1; day <= daysInMonth; day++) {
      const key = getDayKey(day)
      const value = calendarData[key]
      if (value !== null && value !== undefined) {
        total += value
        tradingDays++
        if (value > 0) profitDays++
        if (value < 0) lossDays++
      }
    }

    return { total, profitDays, lossDays, tradingDays }
  })()

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value))
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const calendarDays = []
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="aspect-square" />)
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = getDayKey(day)
    const value = calendarData[key]
    const hasValue = value !== null && value !== undefined
    const isProfit = hasValue && value > 0
    const isLoss = hasValue && value < 0
    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()

    calendarDays.push(
      <button
        key={day}
        onClick={() => handleDayClick(day)}
        className={cn(
          "aspect-square rounded-lg p-1 flex flex-col items-center justify-center text-sm transition-all duration-200 border",
          hasValue
            ? isProfit
              ? "bg-success/20 border-success/30 hover:bg-success/30"
              : isLoss
              ? "bg-destructive/20 border-destructive/30 hover:bg-destructive/30"
              : "bg-muted border-border hover:bg-muted/80"
            : "bg-card border-border hover:bg-muted/50",
          isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background"
        )}
      >
        <span className={cn(
          "font-medium",
          hasValue ? (isProfit ? "text-success" : isLoss ? "text-destructive" : "text-foreground") : "text-muted-foreground"
        )}>
          {day}
        </span>
        {hasValue && (
          <span className={cn(
            "text-xs font-semibold truncate w-full text-center",
            isProfit ? "text-success" : isLoss ? "text-destructive" : "text-foreground"
          )}>
            {value >= 0 ? "+" : ""}{value.toFixed(0)}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={cn(
          "border",
          monthlyStats.total >= 0 
            ? "border-success/30 bg-success/5" 
            : "border-destructive/30 bg-destructive/5"
        )}>
          <CardContent className="p-4 flex items-center gap-3">
            {monthlyStats.total >= 0 ? (
              <TrendingUp className="h-8 w-8 text-success" />
            ) : (
              <TrendingDown className="h-8 w-8 text-destructive" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Monthly Total</p>
              <p className={cn(
                "text-xl font-bold",
                monthlyStats.total >= 0 ? "text-success" : "text-destructive"
              )}>
                {formatCurrency(monthlyStats.total)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-success font-bold">{monthlyStats.profitDays}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Profit Days</p>
              <p className="text-lg font-semibold text-foreground">
                {monthlyStats.tradingDays > 0 
                  ? `${((monthlyStats.profitDays / monthlyStats.tradingDays) * 100).toFixed(0)}%`
                  : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-destructive font-bold">{monthlyStats.lossDays}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loss Days</p>
              <p className="text-lg font-semibold text-foreground">
                {monthlyStats.tradingDays > 0 
                  ? `${((monthlyStats.lossDays / monthlyStats.tradingDays) * 100).toFixed(0)}%`
                  : "0%"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Trading Days</p>
              <p className="text-lg font-semibold text-foreground">{monthlyStats.tradingDays}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-xl text-card-foreground">
              {monthName} {year}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              className="text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays}
          </div>
        </CardContent>
      </Card>

      {/* Entry Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-card-foreground">
                  Enter P&L for {selectedDay}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedDay(null)
                    setInputValue("")
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Profit/Loss Amount (use negative for loss)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave()
                      if (e.key === "Escape") {
                        setSelectedDay(null)
                        setInputValue("")
                      }
                    }}
                    className="pl-7 bg-input border-border text-foreground"
                    placeholder="150 or -50"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tip: You can use comma or dot as decimal separator
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
