"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Printer,
  BarChart3,
  LineChart,
  PieChart
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

interface DayEntry {
  pnl: number
  trades?: number
  note?: string
}

interface DayData {
  [key: string]: DayEntry | null
}

interface YearSummaryProps {
  year: number
  calendarData: DayData
  onBack: () => void
}

export function YearSummary({ year, calendarData, onBack }: YearSummaryProps) {
  // Calculate all statistics
  const stats = useMemo(() => {
    const yearEntries = Object.entries(calendarData)
      .filter(([key, entry]) => {
        if (!entry) return false
        const entryYear = parseInt(key.split("-")[0])
        return entryYear === year
      })
      .sort(([a], [b]) => a.localeCompare(b))

    if (yearEntries.length === 0) {
      return null
    }

    // Basic stats
    let totalPnL = 0
    let profitDays = 0
    let lossDays = 0
    let totalWins = 0
    let totalLosses = 0
    let bestDay = { date: "", value: -Infinity }
    let worstDay = { date: "", value: Infinity }
    const dailyReturns: number[] = []
    const monthlyPnL: { [key: number]: number } = {}

    // Equity curve data
    let runningTotal = 0
    const equityCurve: { date: string; equity: number }[] = []

    yearEntries.forEach(([date, entry]) => {
      if (!entry) return
      
      totalPnL += entry.pnl
      dailyReturns.push(entry.pnl)
      runningTotal += entry.pnl
      
      const monthNum = parseInt(date.split("-")[1])
      if (!monthlyPnL[monthNum]) monthlyPnL[monthNum] = 0
      monthlyPnL[monthNum] += entry.pnl

      equityCurve.push({ date, equity: runningTotal })

      if (entry.pnl > 0) {
        profitDays++
        totalWins += entry.pnl
      } else if (entry.pnl < 0) {
        lossDays++
        totalLosses += Math.abs(entry.pnl)
      }

      if (entry.pnl > bestDay.value) {
        bestDay = { date, value: entry.pnl }
      }
      if (entry.pnl < worstDay.value) {
        worstDay = { date, value: entry.pnl }
      }
    })

    const tradingDays = yearEntries.length
    const winRate = tradingDays > 0 ? (profitDays / tradingDays) * 100 : 0
    const avgWin = profitDays > 0 ? totalWins / profitDays : 0
    const avgLoss = lossDays > 0 ? totalLosses / lossDays : 0
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0

    // Expectancy
    const winProb = winRate / 100
    const lossProb = 1 - winProb
    const expectancy = (winProb * avgWin) - (lossProb * avgLoss)

    // Max Drawdown
    let peak = 0
    let maxDrawdown = 0
    let currentDrawdown = 0
    equityCurve.forEach(({ equity }) => {
      if (equity > peak) {
        peak = equity
      }
      currentDrawdown = peak - equity
      if (currentDrawdown > maxDrawdown) {
        maxDrawdown = currentDrawdown
      }
    })

    // Recovery Factor
    const recoveryFactor = maxDrawdown > 0 ? totalPnL / maxDrawdown : totalPnL > 0 ? Infinity : 0

    // Sharpe-like ratio (simplified)
    const avgDailyReturn = dailyReturns.length > 0 
      ? dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length 
      : 0
    const variance = dailyReturns.length > 1
      ? dailyReturns.reduce((acc, r) => acc + Math.pow(r - avgDailyReturn, 2), 0) / (dailyReturns.length - 1)
      : 0
    const stdDev = Math.sqrt(variance)
    const sharpeRatio = stdDev > 0 ? avgDailyReturn / stdDev : 0

    // Consecutive losses
    let maxConsecutiveLosses = 0
    let currentConsecutiveLosses = 0
    yearEntries.forEach(([, entry]) => {
      if (entry && entry.pnl < 0) {
        currentConsecutiveLosses++
        if (currentConsecutiveLosses > maxConsecutiveLosses) {
          maxConsecutiveLosses = currentConsecutiveLosses
        }
      } else {
        currentConsecutiveLosses = 0
      }
    })

    // Monthly data for chart
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyChartData = monthNames.map((name, idx) => ({
      month: name,
      pnl: monthlyPnL[idx + 1] || 0
    }))

    // Pie chart data
    const pieData = [
      { name: "Profit Days", value: profitDays, color: "#22c55e" },
      { name: "Loss Days", value: lossDays, color: "#ef4444" }
    ]

    return {
      tradingDays,
      winRate,
      totalPnL,
      avgWin,
      avgLoss,
      bestDay,
      worstDay,
      profitFactor,
      expectancy,
      maxDrawdown,
      recoveryFactor,
      sharpeRatio,
      maxConsecutiveLosses,
      profitDays,
      lossDays,
      monthlyChartData,
      equityCurve,
      pieData
    }
  }, [calendarData, year])

  const formatCurrency = (value: number) => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(value))
    return value >= 0 ? `+${formatted}` : `-${formatted}`
  }

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${monthNames[parseInt(month) - 1]} ${parseInt(day)}`
  }

  // Generate recommendations
  const recommendations = useMemo(() => {
    if (!stats) return { dos: [], donts: [] }

    const dos: string[] = []
    const donts: string[] = []

    if (stats.winRate < 40) {
      dos.push("Focus on trade selection - review losing trades for common patterns")
    }
    if (stats.avgLoss > stats.avgWin) {
      dos.push("Tighten stop losses or take profits earlier")
    }
    if (stats.maxDrawdown > stats.totalPnL * 0.2 && stats.totalPnL > 0) {
      dos.push("Reduce position size until consistency improves")
    }
    if (stats.profitFactor < 1.2 && stats.profitFactor !== Infinity) {
      dos.push("Strategy may not be edge-positive - consider pausing live trades")
    }
    if (stats.maxConsecutiveLosses >= 3) {
      dos.push("Implement a 1-day cooldown rule after 3 consecutive losses")
    }
    if (stats.sharpeRatio < 0.5) {
      dos.push("Work on consistency - your returns have high volatility")
    }
    if (stats.winRate >= 50 && stats.profitFactor >= 1.5) {
      dos.push("Your strategy shows positive edge - consider scaling up carefully")
    }

    donts.push("Don't increase risk to 'make back' losses")
    donts.push("Don't skip journaling losing days")
    donts.push("Don't trade during low-confidence periods")

    return { dos, donts }
  }, [stats])

  // Export functions
  const exportToCSV = () => {
    if (!stats) return

    const entries = Object.entries(calendarData)
      .filter(([key, entry]) => entry && key.startsWith(`${year}`))
      .sort(([a], [b]) => a.localeCompare(b))

    const headers = ["Date", "P&L ($)", "Type", "Trades", "Note"]
    const rows = entries.map(([date, entry]) => [
      date,
      entry!.pnl.toFixed(2),
      entry!.pnl >= 0 ? "Profit" : "Loss",
      entry!.trades?.toString() || "",
      `"${(entry!.note || "").replace(/"/g, '""')}"`
    ])

    rows.push(["", "", "", "", ""])
    rows.push(["--- Year Summary ---", "", "", "", ""])
    rows.push(["Total P&L", stats.totalPnL.toFixed(2), "", "", ""])
    rows.push(["Trading Days", stats.tradingDays.toString(), "", "", ""])
    rows.push(["Win Rate", `${stats.winRate.toFixed(1)}%`, "", "", ""])
    rows.push(["Profit Factor", stats.profitFactor === Infinity ? "N/A" : stats.profitFactor.toFixed(2), "", "", ""])
    rows.push(["Max Drawdown", stats.maxDrawdown.toFixed(2), "", "", ""])
    rows.push(["Expectancy", stats.expectancy.toFixed(2), "", "", ""])

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `trading-summary-${year}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  // Empty state
  if (!stats) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-300">
        <div className="mx-auto max-w-6xl">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          
          <Card className="border-border bg-card">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No trades recorded for {year} yet</h2>
              <p className="text-muted-foreground">Start logging your daily P&L to see your year summary.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 animate-in fade-in duration-300 print:bg-white print:p-2">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Calendar
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="border-border text-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="border-border text-foreground hover:bg-muted"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Summary
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            {year} Year Summary
          </h1>
          <p className="text-muted-foreground mt-2">Comprehensive trading performance analysis</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Trades */}
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Trading Days</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stats.tradingDays}</p>
            </CardContent>
          </Card>

          {/* Win Rate */}
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Win Rate</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                stats.winRate >= 50 ? "text-success" : "text-destructive"
              )}>{stats.winRate.toFixed(1)}%</p>
            </CardContent>
          </Card>

          {/* Total P&L */}
          <Card className={cn(
            "border",
            stats.totalPnL >= 0 ? "border-success/30 bg-success/5" : "border-destructive/30 bg-destructive/5"
          )}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                {stats.totalPnL >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className="text-xs text-muted-foreground">Total P&L</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                stats.totalPnL >= 0 ? "text-success" : "text-destructive"
              )}>{formatCurrency(stats.totalPnL)}</p>
            </CardContent>
          </Card>

          {/* Avg Win / Avg Loss */}
          <Card className="border-border bg-card">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg Win/Loss</span>
              </div>
              <p className="text-lg font-bold">
                <span className="text-success">${stats.avgWin.toFixed(0)}</span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-destructive">${stats.avgLoss.toFixed(0)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Best Day */}
          <Card className="border-success/30 bg-success/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-success" />
                <span className="text-xs text-muted-foreground">Best Day</span>
              </div>
              <p className="text-xl font-bold text-success">{formatCurrency(stats.bestDay.value)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(stats.bestDay.date)}</p>
            </CardContent>
          </Card>

          {/* Worst Day */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Worst Day</span>
              </div>
              <p className="text-xl font-bold text-destructive">{formatCurrency(stats.worstDay.value)}</p>
              <p className="text-xs text-muted-foreground">{formatDate(stats.worstDay.date)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly P&L Bar Chart */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Monthly P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#f9fafb" }}
                      formatter={(value: number) => [formatCurrency(value), "P&L"]}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    >
                      {stats.monthlyChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#22c55e" : "#ef4444"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Equity Curve */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                Equity Curve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart data={stats.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#9ca3af" 
                      fontSize={10}
                      tickFormatter={(d) => {
                        const parts = d.split("-")
                        return `${parts[1]}/${parts[2]}`
                      }}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      labelStyle={{ color: "#f9fafb" }}
                      formatter={(value: number) => [formatCurrency(value), "Equity"]}
                      labelFormatter={(d) => formatDate(d as string)}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Win/Loss Pie Chart */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Win/Loss Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={stats.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {stats.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                      formatter={(value: number, name: string) => [value, name]}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Calculations */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Profit Factor</span>
                  <span className={cn(
                    "font-semibold",
                    stats.profitFactor >= 1.5 ? "text-success" : stats.profitFactor >= 1 ? "text-foreground" : "text-destructive"
                  )}>
                    {stats.profitFactor === Infinity ? "N/A" : stats.profitFactor.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Expectancy</span>
                  <span className={cn(
                    "font-semibold",
                    stats.expectancy >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(stats.expectancy)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Max Drawdown</span>
                  <span className="font-semibold text-destructive">
                    {formatCurrency(-stats.maxDrawdown)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Recovery Factor</span>
                  <span className={cn(
                    "font-semibold",
                    stats.recoveryFactor >= 2 ? "text-success" : "text-foreground"
                  )}>
                    {stats.recoveryFactor === Infinity ? "N/A" : stats.recoveryFactor.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
                  <span className={cn(
                    "font-semibold",
                    stats.sharpeRatio >= 1 ? "text-success" : stats.sharpeRatio >= 0.5 ? "text-foreground" : "text-destructive"
                  )}>
                    {stats.sharpeRatio.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* What to Do */}
          <Card className="border-success/30 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                What to Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.dos.length > 0 ? (
                  recommendations.dos.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span className="text-foreground">{rec}</span>
                    </li>
                  ))
                ) : (
                  <li className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span className="text-foreground">Keep doing what you&apos;re doing - your stats look good!</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          {/* What NOT to Do */}
          <Card className="border-destructive/30 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                What NOT to Do
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.donts.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Warning Banner */}
        {(stats.profitFactor < 1.2 || stats.maxConsecutiveLosses >= 3 || stats.winRate < 40) && (
          <Card className="border-amber-500/30 bg-amber-500/10">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-500">Performance Alert</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your trading metrics suggest room for improvement. Consider reviewing your strategy, reducing position sizes, or taking a break to reassess your approach.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
