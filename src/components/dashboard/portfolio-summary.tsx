'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, ArrowRight, PieChart } from 'lucide-react'
import Link from 'next/link'
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface PortfolioSummaryProps {
  userId: string
}

interface PortfolioData {
  totalValue: number
  totalCost: number
  totalGain: number
  gainPercent: number
  allocation: { name: string; value: number; color: string }[]
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function PortfolioSummary({ userId }: PortfolioSummaryProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPortfolio() {
      setIsLoading(true)

      // Fetch holdings with asset info
      const { data: holdings } = await supabase
        .from('holdings')
        .select(`
          quantity,
          total_cost,
          current_value,
          asset:assets(name, asset_type, current_price)
        `)
        .eq('user_id', userId)
        .gt('quantity', 0)

      if (!holdings || holdings.length === 0) {
        setPortfolio(null)
        setIsLoading(false)
        return
      }

      // Calculate totals
      let totalValue = 0
      let totalCost = 0
      const allocationMap: Record<string, number> = {}

      holdings.forEach((holding) => {
        const asset = Array.isArray(holding.asset) ? holding.asset[0] : holding.asset
        const value = holding.current_value || (holding.quantity * (asset?.current_price || 0))

        totalValue += value
        totalCost += holding.total_cost

        const type = asset?.asset_type || 'other'
        allocationMap[type] = (allocationMap[type] || 0) + value
      })

      const totalGain = totalValue - totalCost
      const gainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

      const allocation = Object.entries(allocationMap).map(([name, value], index) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        value,
        color: COLORS[index % COLORS.length],
      }))

      setPortfolio({
        totalValue,
        totalCost,
        totalGain,
        gainPercent,
        allocation,
      })

      setIsLoading(false)
    }

    fetchPortfolio()
  }, [userId])

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Portfolio</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/investments" className="gap-1">
            Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[280px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !portfolio ? (
          <div className="flex flex-col items-center justify-center h-[280px] text-center">
            <PieChart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No investments yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Start tracking your portfolio
            </p>
            <Button asChild>
              <Link href="/investments">Add Investment</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total value */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-3xl font-bold">
                {formatCurrency(portfolio.totalValue)}
              </p>
              <div
                className={cn(
                  'flex items-center justify-center gap-1 mt-1',
                  portfolio.totalGain >= 0 ? 'text-success' : 'text-destructive'
                )}
              >
                {portfolio.totalGain >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {formatCurrency(Math.abs(portfolio.totalGain))}
                </span>
                <span>({formatPercentage(portfolio.gainPercent)})</span>
              </div>
            </div>

            {/* Pie chart */}
            {portfolio.allocation.length > 0 && (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={portfolio.allocation}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {portfolio.allocation.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-popover border rounded-lg shadow-lg p-2 text-sm">
                              <p className="font-medium">{data.name}</p>
                              <p className="text-muted-foreground">
                                {formatCurrency(data.value)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            )}

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2">
              {portfolio.allocation.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
