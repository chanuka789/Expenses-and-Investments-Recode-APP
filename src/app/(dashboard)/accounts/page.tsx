'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { formatCurrency, decimalToCents } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Plus, MoreVertical, Pencil, Trash2,
  Wallet, Building2, CreditCard, TrendingUp, Coins, CircleDollarSign
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  current_balance: number
  starting_balance: number
  color: string | null
  is_active: boolean
  include_in_total: boolean
}

const accountTypes = [
  { value: 'cash', label: 'Cash', icon: Wallet },
  { value: 'bank', label: 'Bank Account', icon: Building2 },
  { value: 'credit_card', label: 'Credit Card', icon: CreditCard },
  { value: 'investment', label: 'Investment', icon: TrendingUp },
  { value: 'wallet', label: 'Digital Wallet', icon: Coins },
  { value: 'other', label: 'Other', icon: CircleDollarSign },
]

const colors = [
  '#6366f1', '#22c55e', '#ef4444', '#f97316', '#eab308',
  '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b',
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('bank')
  const [balance, setBalance] = useState('')
  const [color, setColor] = useState(colors[0])
  const [includeInTotal, setIncludeInTotal] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('name')

    if (data) setAccounts(data)
    setIsLoading(false)
  }

  const handleSubmit = async () => {
    if (!name) {
      toast({ title: 'Error', description: 'Please enter an account name', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      const balanceInCents = balance ? decimalToCents(parseFloat(balance)) : 0

      const accountData = {
        user_id: session.user.id,
        name,
        type,
        color,
        starting_balance: editingAccount ? editingAccount.starting_balance : balanceInCents,
        current_balance: editingAccount ? editingAccount.current_balance : balanceInCents,
        include_in_total: includeInTotal,
        is_active: true,
      }

      if (editingAccount) {
        const { error } = await supabase
          .from('accounts')
          .update({ name, type, color, include_in_total: includeInTotal } as any)
          .eq('id', editingAccount.id)

        if (error) throw error
        toast({ title: 'Account updated' })
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert(accountData as any)

        if (error) throw error
        toast({ title: 'Account created' })
      }

      setDialogOpen(false)
      resetForm()
      fetchAccounts()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save account', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', deletingId)

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete. Account may have transactions.', variant: 'destructive' })
    } else {
      toast({ title: 'Account deleted' })
      fetchAccounts()
    }

    setDeleteDialogOpen(false)
    setDeletingId(null)
  }

  const resetForm = () => {
    setName('')
    setType('bank')
    setBalance('')
    setColor(colors[0])
    setIncludeInTotal(true)
    setEditingAccount(null)
  }

  const openEditDialog = (account: Account) => {
    setEditingAccount(account)
    setName(account.name)
    setType(account.type)
    setColor(account.color || colors[0])
    setIncludeInTotal(account.include_in_total)
    setDialogOpen(true)
  }

  const getAccountIcon = (accountType: string) => {
    const found = accountTypes.find(t => t.value === accountType)
    return found ? found.icon : CircleDollarSign
  }

  // Calculate totals
  const totalBalance = accounts
    .filter(a => a.is_active && a.include_in_total)
    .reduce((sum, a) => sum + a.current_balance, 0)

  const assetsBalance = accounts
    .filter(a => a.is_active && a.include_in_total && a.type !== 'credit_card' && a.current_balance >= 0)
    .reduce((sum, a) => sum + a.current_balance, 0)

  const liabilitiesBalance = accounts
    .filter(a => a.is_active && a.include_in_total && (a.type === 'credit_card' || a.current_balance < 0))
    .reduce((sum, a) => sum + Math.abs(a.current_balance), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your bank accounts, cards, and wallets
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className={cn(
              'text-2xl font-bold mt-1',
              totalBalance >= 0 ? 'text-foreground' : 'text-destructive'
            )}>
              {formatCurrency(totalBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Assets</p>
            <p className="text-2xl font-bold text-success mt-1">
              {formatCurrency(assetsBalance)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Liabilities</p>
            <p className="text-2xl font-bold text-destructive mt-1">
              {formatCurrency(liabilitiesBalance)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No accounts yet</p>
            <p className="text-muted-foreground mb-4">Add your first account to get started</p>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = getAccountIcon(account.type)
            const isNegative = account.current_balance < 0

            return (
              <Card key={account.id} className={cn('card-hover', !account.is_active && 'opacity-60')}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${account.color}20`, color: account.color || undefined }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.type.replace('_', ' ')}
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
                      <DropdownMenuItem onClick={() => openEditDialog(account)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => { setDeletingId(account.id); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent>
                  <p className={cn(
                    'text-2xl font-bold',
                    isNegative ? 'text-destructive' : 'text-foreground'
                  )}>
                    {formatCurrency(account.current_balance, account.currency)}
                  </p>
                  {!account.include_in_total && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Excluded from totals
                    </p>
                  )}
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
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update account details' : 'Add a new account to track'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                placeholder="e.g., Main Checking"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingAccount && (
              <div className="space-y-2">
                <Label>Starting Balance</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                  />
                </div>
              </div>
            )}
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
            <div className="flex items-center justify-between">
              <Label htmlFor="include-total">Include in net worth</Label>
              <Switch
                id="include-total"
                checked={includeInTotal}
                onCheckedChange={setIncludeInTotal}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} loading={isSubmitting}>
                {editingAccount ? 'Update' : 'Add'} Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This will also delete all transactions associated with this account.
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
