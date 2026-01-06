'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface BudgetOverviewProps {
  userId: string
}

interface BudgetWithSpent {
  id: string
  name: string
  amount: number
  spent: number
  category?: {
    name: string
    color: string
  }
}

export function BudgetOverview({ userId }: BudgetOverviewProps) {
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBudgets() {
      setIsLoading(true)

      // Get current month date range
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Fetch active budgets
      const { data: budgetsRaw } = await supabase
        .from('budgets')
        .select(`
          id,
          name,
          amount,
          category_id,
          category:categories(name, color)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(5)

      const budgetsData = budgetsRaw as any[] | null
      if (!budgetsData) {
        setIsLoading(false)
        return
      }

      // Fetch transactions for spending calculation
      const { data: txRaw } = await supabase
        .from('transactions')
        .select('amount, category_id')
        .eq('user_id', userId)
        .eq('type', 'expense')
        .gte('date', monthStart.toISOString().split('T')[0])
        .lte('date', monthEnd.toISOString().split('T')[0])

      const transactions = txRaw as any[] | null

      // Calculate spent amounts
      const budgetsWithSpent = budgetsData.map((budget) => {
        const spent = transactions
          ?.filter((t) =>
            budget.category_id ? t.category_id === budget.category_id : true
          )
          .reduce((sum, t) => sum + t.amount, 0) || 0

        return {
          ...budget,
          spent,
          category: Array.isArray(budget.category) ? budget.category[0] : budget.category,
        }
      })

      setBudgets(budgetsWithSpent)
      setIsLoading(false)
    }

    fetchBudgets()
  }, [userId])

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive'
    if (percentage >= 80) return 'bg-warning'
    return 'bg-success'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budgets" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-2 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No budgets set</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create budgets to track your spending
            </p>
            <Button asChild>
              <Link href="/budgets/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {budgets.map((budget) => {
              const percentage = Math.min((budget.spent / budget.amount) * 100, 100)
              const remaining = budget.amount - budget.spent

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {budget.category?.color && (
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: budget.category.color }}
                        />
                      )}
                      <span className="font-medium text-sm">
                        {budget.category?.name || budget.name}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.amount)}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(0)}% used</span>
                    <span
                      className={cn(
                        remaining < 0 ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    >
                      {remaining >= 0 ? `${formatCurrency(remaining)} left` : `${formatCurrency(Math.abs(remaining))} over`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
