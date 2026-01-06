'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, decimalToCents } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Plus, MoreVertical, Pencil, Trash2, PiggyBank, Target } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Budget {
  id: string
  name: string
  amount: number
  currency: string
  period: string
  category?: { id: string; name: string; color: string } | null
  spent?: number
}

interface Category {
  id: string
  name: string
  color: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState('monthly')
  const [categoryId, setCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Get current month dates
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    // Fetch budgets
    const { data: budgetsData } = await supabase
      .from('budgets')
      .select(`
        id, name, amount, currency, period, category_id,
        category:categories(id, name, color)
      `)
      .eq('user_id', session.user.id)
      .eq('is_active', true)

    // Fetch transactions for spending
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', session.user.id)
      .eq('type', 'expense')
      .gte('date', format(monthStart, 'yyyy-MM-dd'))
      .lte('date', format(monthEnd, 'yyyy-MM-dd'))

    if (budgetsData) {
      const budgetsWithSpent = budgetsData.map((b) => {
        const spent = transactions
          ?.filter((t) => b.category_id ? t.category_id === b.category_id : true)
          .reduce((sum, t) => sum + t.amount, 0) || 0

        return {
          ...b,
          category: Array.isArray(b.category) ? b.category[0] : b.category,
          spent,
        }
      })

      setBudgets(budgetsWithSpent)
    }

    // Fetch categories for form
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, color')
      .eq('user_id', session.user.id)
      .eq('type', 'expense')
      .eq('is_active', true)

    if (categoriesData) {
      setCategories(categoriesData)
    }

    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!name || !amount) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const budgetData = {
        user_id: session.user.id,
        name,
        amount: decimalToCents(parseFloat(amount)),
        period,
        category_id: categoryId || null,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        is_active: true,
      }

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id)

        if (error) throw error
        toast({ title: 'Budget updated', description: 'Your budget has been updated.' })
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert(budgetData)

        if (error) throw error
        toast({ title: 'Budget created', description: 'Your new budget is ready.' })
      }

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save budget', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', deletingId)

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete budget', variant: 'destructive' })
    } else {
      toast({ title: 'Budget deleted', description: 'The budget has been removed.' })
      fetchData()
    }

    setDeleteDialogOpen(false)
    setDeletingId(null)
  }

  const resetForm = () => {
    setName('')
    setAmount('')
    setPeriod('monthly')
    setCategoryId('')
    setEditingBudget(null)
  }

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget)
    setName(budget.name)
    setAmount((budget.amount / 100).toString())
    setPeriod(budget.period)
    setCategoryId(budget.category?.id || '')
    setDialogOpen(true)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-destructive'
    if (percentage >= 80) return 'bg-warning'
    return 'bg-success'
  }

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0)
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Budgets</h1>
          <p className="text-muted-foreground mt-1">
            Set spending limits and track your progress
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Budget
        </Button>
      </div>

      {/* Overall Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <PiggyBank className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Budget Overview</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                </p>
              </div>
            </div>
            <div className="flex-1 max-w-md">
              <div className="flex justify-between text-sm mb-2">
                <span>{overallPercentage.toFixed(0)}% used</span>
                <span className={cn(
                  totalBudget - totalSpent < 0 ? 'text-destructive' : 'text-muted-foreground'
                )}>
                  {totalBudget - totalSpent >= 0
                    ? `${formatCurrency(totalBudget - totalSpent)} left`
                    : `${formatCurrency(Math.abs(totalBudget - totalSpent))} over`}
                </span>
              </div>
              <Progress
                value={Math.min(overallPercentage, 100)}
                className="h-3"
                indicatorClassName={getProgressColor(overallPercentage)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budgets Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No budgets yet</p>
            <p className="text-muted-foreground mb-4">Create your first budget to start tracking</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Budget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((budget) => {
            const spent = budget.spent || 0
            const percentage = Math.min((spent / budget.amount) * 100, 100)
            const remaining = budget.amount - spent

            return (
              <Card key={budget.id} className="card-hover">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    {budget.category?.color && (
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: budget.category.color }}
                      />
                    )}
                    <div>
                      <CardTitle className="text-base">
                        {budget.category?.name || budget.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">{budget.period}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(budget)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => { setDeletingId(budget.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{formatCurrency(spent)}</span>
                      <span className="text-muted-foreground">{formatCurrency(budget.amount)}</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      indicatorClassName={getProgressColor(percentage)}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{percentage.toFixed(0)}% used</span>
                      <span className={cn(remaining < 0 ? 'text-destructive' : '')}>
                        {remaining >= 0
                          ? `${formatCurrency(remaining)} left`
                          : `${formatCurrency(Math.abs(remaining))} over`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
            <DialogDescription>
              {editingBudget ? 'Update your budget settings' : 'Set a spending limit for a category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Budget Name</Label>
              <Input
                placeholder="e.g., Food Budget"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category (Optional)</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} loading={isSubmitting}>
                {editingBudget ? 'Update' : 'Create'} Budget
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
