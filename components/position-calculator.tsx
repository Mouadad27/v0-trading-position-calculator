"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, ArrowRight, TrendingUp, TrendingDown, Target, Shield, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"

const RISK_REWARD_OPTIONS = ["1:1.5", "1:2", "1:3", "Custom"] as const
type RiskRewardOption = (typeof RISK_REWARD_OPTIONS)[number]

export function PositionCalculator() {
  const [accountBalance, setAccountBalance] = useState("500")
  const [riskPerTrade, setRiskPerTrade] = useState("1")
  const [entryPrice, setEntryPrice] = useState("1.22")
  const [selectedRR, setSelectedRR] = useState<RiskRewardOption>("1:2")
  const [customRR, setCustomRR] = useState("2.5")

  const calculations = useMemo(() => {
    const balance = parseFloat(accountBalance) || 0
    const riskPercent = parseFloat(riskPerTrade) || 0
    const entry = parseFloat(entryPrice) || 0
    
    // Get the risk:reward multiplier
    let rrMultiplier = 2
    if (selectedRR === "1:1.5") rrMultiplier = 1.5
    else if (selectedRR === "1:2") rrMultiplier = 2
    else if (selectedRR === "1:3") rrMultiplier = 3
    else if (selectedRR === "Custom") rrMultiplier = parseFloat(customRR) || 2

    // Calculations
    const maxRisk = balance * (riskPercent / 100)
    const slSize = entry * 0.02 // 2% of entry price
    const shares = slSize > 0 ? Math.floor(maxRisk / slSize) : 0
    const stopLoss = entry * 0.98 // 2% below entry
    const takeProfit = entry + (entry - stopLoss) * rrMultiplier
    const totalPositionValue = entry * shares
    const positionPercent = balance > 0 ? (totalPositionValue / balance) * 100 : 0
    
    // Outcomes
    const profitIfTP = (takeProfit - entry) * shares
    const lossIfSL = (entry - stopLoss) * shares

    return {
      maxRisk,
      slSize,
      shares,
      stopLoss,
      takeProfit,
      totalPositionValue,
      positionPercent,
      profitIfTP,
      lossIfSL,
      rrMultiplier,
      entry,
    }
  }, [accountBalance, riskPerTrade, entryPrice, selectedRR, customRR])

  const isPennyStock = parseFloat(entryPrice) > 0 && parseFloat(entryPrice) < 2

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Position Size Calculator
          </h1>
          <p className="text-muted-foreground">
            Calculate your optimal position size and manage risk effectively
          </p>
        </div>

        {/* Input Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground">Trade Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="balance" className="text-muted-foreground text-sm">
                  Account Balance
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="balance"
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(e.target.value)}
                    className="pl-7 bg-input border-border text-foreground"
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk" className="text-muted-foreground text-sm">
                  Risk Per Trade
                </Label>
                <div className="relative">
                  <Input
                    id="risk"
                    type="number"
                    value={riskPerTrade}
                    onChange={(e) => setRiskPerTrade(e.target.value)}
                    className="pr-7 bg-input border-border text-foreground"
                    placeholder="1"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entry" className="text-muted-foreground text-sm">
                  Entry Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="entry"
                    type="number"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value)}
                    className="pl-7 bg-input border-border text-foreground"
                    placeholder="1.22"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk/Reward Ratio Section */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground">Risk/Reward Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {RISK_REWARD_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelectedRR(option)}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                    selectedRR === option
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
            {selectedRR === "Custom" && (
              <div className="mt-4 max-w-xs">
                <Label htmlFor="customRR" className="text-muted-foreground text-sm">
                  Custom Ratio (1:X)
                </Label>
                <Input
                  id="customRR"
                  type="number"
                  value={customRR}
                  onChange={(e) => setCustomRR(e.target.value)}
                  className="mt-2 bg-input border-border text-foreground"
                  placeholder="2.5"
                  step="0.1"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Penny Stock Warning */}
        {isPennyStock && (
          <Alert className="border-warning/50 bg-warning/10">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning">
              Penny stock — price under $2. Spreads are wide and moves are unpredictable. 
              Ideal range is $2-$20.
            </AlertDescription>
          </Alert>
        )}

        {/* Calculation Steps */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground">Calculation Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 1 */}
              <div className="relative bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="font-medium">Max Risk</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(accountBalance) || 0)} × {riskPerTrade}%
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(calculations.maxRisk)}
                </div>
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="font-medium">SL Size (2%)</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(parseFloat(entryPrice) || 0)} × 2%
                </div>
                <div className="text-xl font-bold text-foreground">
                  {formatCurrency(calculations.slSize)}
                </div>
                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <span className="font-medium">Shares</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatCurrency(calculations.maxRisk)} ÷ {formatCurrency(calculations.slSize)}
                </div>
                <div className="text-xl font-bold text-foreground">
                  {calculations.shares.toLocaleString()} shares
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-card-foreground">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                <DollarSign className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm text-muted-foreground">Buy — entry price</div>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(calculations.entry)} × {calculations.shares} = {formatCurrency(calculations.totalPositionValue)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Shield className="h-5 w-5 text-destructive" />
                <div>
                  <div className="text-sm text-muted-foreground">Stop loss — place immediately</div>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(calculations.stopLoss)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
                <Target className="h-5 w-5 text-success" />
                <div>
                  <div className="text-sm text-muted-foreground">Take profit — target</div>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(calculations.takeProfit)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Total position value</div>
                  <div className="font-semibold text-foreground">
                    {formatCurrency(calculations.totalPositionValue)} ({calculations.positionPercent.toFixed(1)}% of account)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Outcome Scenarios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Profit Scenario */}
          <Card className="border-success/30 bg-success/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">If take profit hits</h3>
                  <p className="text-sm text-muted-foreground">Target reached</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-success mb-2">
                +{formatCurrency(calculations.profitIfTP)}
              </div>
              <div className="text-sm text-muted-foreground">
                ({formatCurrency(calculations.takeProfit)} - {formatCurrency(calculations.entry)}) × {calculations.shares} shares
              </div>
            </CardContent>
          </Card>

          {/* Loss Scenario */}
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">If stop loss hits</h3>
                  <p className="text-sm text-muted-foreground">Risk managed</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-destructive mb-2">
                -{formatCurrency(calculations.lossIfSL)}
              </div>
              <div className="text-sm text-muted-foreground">
                ({formatCurrency(calculations.entry)} - {formatCurrency(calculations.stopLoss)}) × {calculations.shares} shares
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk/Reward Display */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Risk/Reward Visualization</span>
              <span className="font-semibold text-foreground">1:{calculations.rrMultiplier}</span>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-destructive rounded-l-full"
                style={{ width: `${(1 / (1 + calculations.rrMultiplier)) * 100}%` }}
              />
              <div 
                className="absolute right-0 top-0 h-full bg-success rounded-r-full"
                style={{ width: `${(calculations.rrMultiplier / (1 + calculations.rrMultiplier)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-destructive">Risk: {formatCurrency(calculations.lossIfSL)}</span>
              <span className="text-success">Reward: {formatCurrency(calculations.profitIfTP)}</span>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-foreground font-medium">
                For every <span className="text-destructive">$1</span> you risk, you target{" "}
                <span className="text-success">${calculations.rrMultiplier.toFixed(2)}</span> profit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
