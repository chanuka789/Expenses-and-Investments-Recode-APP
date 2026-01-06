'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface SpendingChartProps {
  userId: string
}

export function SpendingChart({ userId }: SpendingChartProps) {
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<{ date: string; income: number; expense: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const days = parseInt(period)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: transactions } = await supabase
        .from('transactions')
        .select('date, type, amount')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (transactions) {
        // Group by date
        const grouped = transactions.reduce((acc, t) => {
          const date = t.date
          if (!acc[date]) {
            acc[date] = { date, income: 0, expense: 0 }
          }
          if (t.type === 'income') {
            acc[date].income += t.amount / 100
          } else if (t.type === 'expense') {
            acc[date].expense += t.amount / 100
          }
          return acc
        }, {} as Record<string, { date: string; income: number; expense: number }>)

        // Fill in missing dates
        const result = []
        const current = new Date(startDate)
        const end = new Date()

        while (current <= end) {
          const dateStr = current.toISOString().split('T')[0]
          result.push(
            grouped[dateStr] || { date: dateStr, income: 0, expense: 0 }
          )
          current.setDate(current.getDate() + 1)
        }

        setData(result)
      }
      setIsLoading(false)
    }

    fetchData()
  }, [userId, period])

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Cash Flow</CardTitle>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg shadow-lg p-3">
                          <p className="text-sm font-medium mb-2">
                            {new Date(label).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          {payload.map((entry) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between gap-4 text-sm"
                            >
                              <span className="text-muted-foreground capitalize">
                                {entry.name}
                              </span>
                              <span
                                className={
                                  entry.name === 'income'
                                    ? 'text-success font-medium'
                                    : 'text-destructive font-medium'
                                }
                              >
                                {formatCurrency((entry.value as number) * 100)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIncome)"
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorExpense)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Income</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Expenses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
