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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, decimalToCents } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Plus, Target, PiggyBank, TrendingUp, CreditCard, Shield,
  MoreVertical, Pencil, Trash2, CalendarIcon, Check,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Goal {
  id: string
  name: string
  type: string
  target_amount: number
  current_amount: number
  currency: string
  target_date: string | null
  color: string | null
  is_completed: boolean
}

const goalTypes = [
  { value: 'savings', label: 'Savings', icon: PiggyBank },
  { value: 'investment', label: 'Investment', icon: TrendingUp },
  { value: 'debt_payoff', label: 'Debt Payoff', icon: CreditCard },
  { value: 'emergency_fund', label: 'Emergency Fund', icon: Shield },
  { value: 'other', label: 'Other', icon: Target },
]

const colors = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316', '#eab308',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('savings')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>()
  const [color, setColor] = useState(colors[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', session.user.id)
      .order('is_completed')
      .order('created_at', { ascending: false })

    if (data) setGoals(data)
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!name || !targetAmount) {
      toast({ title: 'Error', description: 'Please fill in required fields', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const goalData = {
        user_id: session.user.id,
        name,
        type,
        target_amount: decimalToCents(parseFloat(targetAmount)),
        current_amount: currentAmount ? decimalToCents(parseFloat(currentAmount)) : 0,
        target_date: targetDate ? format(targetDate, 'yyyy-MM-dd') : null,
        color,
        is_completed: false,
      }

      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update(goalData as any)
          .eq('id', editingGoal.id)

        if (error) throw error
        toast({ title: 'Goal updated' })
      } else {
        const { error } = await supabase
          .from('goals')
          .insert(goalData as any)

        if (error) throw error
        toast({ title: 'Goal created' })
      }

      setDialogOpen(false)
      resetForm()
      fetchGoals()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save goal', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete goal', variant: 'destructive' })
    } else {
      toast({ title: 'Goal deleted' })
      fetchGoals()
    }
  }

  const handleComplete = async (goal: Goal) => {
    const { error } = await supabase
      .from('goals')
      .update({ is_completed: !goal.is_completed } as any)
      .eq('id', goal.id)

    if (error) {
      toast({ title: 'Error', description: 'Failed to update goal', variant: 'destructive' })
    } else {
      toast({ title: goal.is_completed ? 'Goal reopened' : 'Goal completed!' })
      fetchGoals()
    }
  }

  const resetForm = () => {
    setName('')
    setType('savings')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate(undefined)
    setColor(colors[0])
    setEditingGoal(null)
  }

  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal)
    setName(goal.name)
    setType(goal.type)
    setTargetAmount((goal.target_amount / 100).toString())
    setCurrentAmount((goal.current_amount / 100).toString())
    setTargetDate(goal.target_date ? new Date(goal.target_date) : undefined)
    setColor(goal.color || colors[0])
    setDialogOpen(true)
  }

  const getGoalIcon = (goalType: string) => {
    const found = goalTypes.find(t => t.value === goalType)
    return found ? found.icon : Target
  }

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track progress towards your financial goals
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : goals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No goals yet</p>
            <p className="text-muted-foreground mb-4">Set your first financial goal</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeGoals.map((goal) => {
                  const Icon = getGoalIcon(goal.type)
                  const percentage = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                  const remaining = goal.target_amount - goal.current_amount

                  return (
                    <Card key={goal.id} className="card-hover">
                      <CardHeader className="flex flex-row items-start justify-between pb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${goal.color}20`, color: goal.color || undefined }}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{goal.name}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize">
                              {goal.type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleComplete(goal)}>
                              <Check className="h-4 w-4 mr-2" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(goal)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(goal.id)}
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
                            <span className="font-medium">{formatCurrency(goal.current_amount)}</span>
                            <span className="text-muted-foreground">{formatCurrency(goal.target_amount)}</span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-2"
                            indicatorClassName={percentage >= 100 ? 'bg-success' : undefined}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{percentage.toFixed(0)}% complete</span>
                            <span>{formatCurrency(remaining)} to go</span>
                          </div>
                          {goal.target_date && (
                            <p className="text-xs text-muted-foreground">
                              Target: {format(new Date(goal.target_date), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 text-muted-foreground">Completed</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map((goal) => {
                  const Icon = getGoalIcon(goal.type)

                  return (
                    <Card key={goal.id} className="opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-10 rounded-lg flex items-center justify-center bg-success/20 text-success"
                            >
                              <Check className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium line-through">{goal.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatCurrency(goal.target_amount)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplete(goal)}
                          >
                            Reopen
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoal ? 'Update your goal details' : 'Set a new financial goal to track'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input
                placeholder="e.g., Vacation Fund"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {goalTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !targetDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      'h-8 w-8 rounded-full transition-all',
                      color === c && 'ring-2 ring-offset-2 ring-primary'
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} loading={isSubmitting}>
                {editingGoal ? 'Update' : 'Create'} Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
