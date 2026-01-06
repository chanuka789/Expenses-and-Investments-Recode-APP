import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, calculatePercentageChange } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DashboardStatsProps {
  userId: string
}

export async function DashboardStats({ userId }: DashboardStatsProps) {
  const supabase = createServerClient()

  // Get current month date range
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Fetch current month transactions
  const { data: currentTransactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', currentMonthStart.toISOString().split('T')[0])
    .lte('date', currentMonthEnd.toISOString().split('T')[0])

  // Fetch last month transactions
  const { data: lastTransactions } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', userId)
    .gte('date', lastMonthStart.toISOString().split('T')[0])
    .lte('date', lastMonthEnd.toISOString().split('T')[0])

  // Fetch total balance from accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('current_balance')
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('include_in_total', true)

  // Fetch active budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('amount')
    .eq('user_id', userId)
    .eq('is_active', true)

  // Calculate stats
  const currentIncome = currentTransactions
    ?.filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const currentExpenses = currentTransactions
    ?.filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const lastIncome = lastTransactions
    ?.filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const lastExpenses = lastTransactions
    ?.filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0) || 0

  const totalBalance = accounts?.reduce((sum, a) => sum + a.current_balance, 0) || 0
  const totalBudget = budgets?.reduce((sum, b) => sum + b.amount, 0) || 0
  const budgetUsed = totalBudget > 0 ? (currentExpenses / totalBudget) * 100 : 0

  const incomeChange = calculatePercentageChange(currentIncome, lastIncome)
  const expenseChange = calculatePercentageChange(currentExpenses, lastExpenses)

  const stats = [
    {
      title: 'Total Balance',
      value: formatCurrency(totalBalance),
      change: null,
      icon: Wallet,
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: 'Income',
      value: formatCurrency(currentIncome),
      change: incomeChange,
      positive: incomeChange >= 0,
      icon: ArrowDownLeft,
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: 'Expenses',
      value: formatCurrency(currentExpenses),
      change: expenseChange,
      positive: expenseChange <= 0,
      icon: ArrowUpRight,
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
    },
    {
      title: 'Budget Used',
      value: `${budgetUsed.toFixed(0)}%`,
      subtitle: totalBudget > 0 ? `of ${formatCurrency(totalBudget)}` : 'No budget set',
      icon: PiggyBank,
      iconBg: budgetUsed > 90 ? 'bg-destructive/10' : budgetUsed > 75 ? 'bg-warning/10' : 'bg-success/10',
      iconColor: budgetUsed > 90 ? 'text-destructive' : budgetUsed > 75 ? 'text-warning' : 'text-success',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                {stat.change !== null && stat.change !== undefined && (
                  <div className="flex items-center gap-1">
                    {stat.positive ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span
                      className={cn(
                        'text-sm font-medium',
                        stat.positive ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {Math.abs(stat.change).toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs last month</span>
                  </div>
                )}
                {stat.subtitle && (
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                )}
              </div>
              <div
                className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center',
                  stat.iconBg
                )}
              >
                <stat.icon className={cn('h-6 w-6', stat.iconColor)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
