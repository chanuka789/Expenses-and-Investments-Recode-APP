'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  BarChart3, PieChart, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface CategorySpending {
  name: string
  amount: number
  color: string
}

interface MonthlyTrend {
  month: string
  income: number
  expense: number
  savings: number
}

const COLORS = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316', '#eab308',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('6')
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([])
  const [topMerchants, setTopMerchants] = useState<{ name: string; amount: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Summary stats
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [avgMonthlySpending, setAvgMonthlySpending] = useState(0)
  const [savingsRate, setSavingsRate] = useState(0)

  useEffect(() => {
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const months = parseInt(period)
    const endDate = new Date()
    const startDate = subMonths(endDate, months)

    // Fetch all transactions in range
    const { data: transactions } = await supabase
      .from('transactions')
      .select(`
        type, amount, date, merchant,
        category:categories(name, color)
      `)
      .eq('user_id', session.user.id)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .lte('date', format(endDate, 'yyyy-MM-dd'))

    if (!transactions) {
      setIsLoading(false)
      return
    }

    // Calculate totals
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    setTotalIncome(income)
    setTotalExpenses(expenses)
    setAvgMonthlySpending(expenses / months)
    setSavingsRate(income > 0 ? ((income - expenses) / income) * 100 : 0)

    // Category breakdown
    const categoryMap: Record<string, { amount: number; color: string }> = {}
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const cat = Array.isArray(t.category) ? t.category[0] : t.category
        const name = cat?.name || 'Uncategorized'
        const color = cat?.color || '#64748b'
        if (!categoryMap[name]) {
          categoryMap[name] = { amount: 0, color }
        }
        categoryMap[name].amount += t.amount
      })

    const sortedCategories = Object.entries(categoryMap)
      .map(([name, { amount, color }]) => ({ name, amount, color }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8)

    setCategorySpending(sortedCategories)

    // Monthly trends
    const monthlyMap: Record<string, { income: number; expense: number }> = {}
    for (let i = 0; i < months; i++) {
      const monthDate = subMonths(endDate, months - 1 - i)
      const monthKey = format(monthDate, 'MMM yyyy')
      monthlyMap[monthKey] = { income: 0, expense: 0 }
    }

    transactions.forEach(t => {
      const monthKey = format(new Date(t.date), 'MMM yyyy')
      if (monthlyMap[monthKey]) {
        if (t.type === 'income') {
          monthlyMap[monthKey].income += t.amount
        } else if (t.type === 'expense') {
          monthlyMap[monthKey].expense += t.amount
        }
      }
    })

    const trends = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      income: data.income / 100,
      expense: data.expense / 100,
      savings: (data.income - data.expense) / 100,
    }))

    setMonthlyTrends(trends)

    // Top merchants
    const merchantMap: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'expense' && t.merchant)
      .forEach(t => {
        const name = t.merchant!
        merchantMap[name] = (merchantMap[name] || 0) + t.amount
      })

    const sortedMerchants = Object.entries(merchantMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    setTopMerchants(sortedMerchants)

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Insights into your financial habits
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-success mb-2">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-medium">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm font-medium">Avg Monthly</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(avgMonthlySpending)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              {savingsRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm font-medium">Savings Rate</span>
            </div>
            <p className={cn(
              'text-2xl font-bold',
              savingsRate >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {savingsRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Monthly Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value * 100), name]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Spending by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categorySpending.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No expense data
                  </div>
                ) : (
                  <>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPie>
                          <Pie
                            data={categorySpending}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="amount"
                          >
                            {categorySpending.map((entry, index) => (
                              <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </RechartsPie>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {categorySpending.map((cat) => (
                        <div key={cat.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="truncate">{cat.name}</span>
                          </div>
                          <span className="text-muted-foreground">{formatCurrency(cat.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Merchants */}
            <Card>
              <CardHeader>
                <CardTitle>Top Merchants</CardTitle>
              </CardHeader>
              <CardContent>
                {topMerchants.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No merchant data
                  </div>
                ) : (
                  <div className="space-y-4">
                    {topMerchants.map((merchant, index) => {
                      const maxAmount = topMerchants[0]?.amount || 1
                      const percentage = (merchant.amount / maxAmount) * 100

                      return (
                        <div key={merchant.name} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{merchant.name}</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(merchant.amount)}
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Savings Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Savings Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value * 100), 'Savings']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
