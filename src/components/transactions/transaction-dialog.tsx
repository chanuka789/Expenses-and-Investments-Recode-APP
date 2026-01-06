'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { cn, decimalToCents } from '@/lib/utils'
import { CalendarIcon, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

const transactionSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
    'Amount must be a positive number'
  ),
  date: z.date(),
  categoryId: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  merchant: z.string().optional(),
  notes: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'expense' | 'income' | 'transfer'
  transaction?: {
    id: string
    amount: number
    date: string
    category_id?: string
    account_id: string
    to_account_id?: string
    merchant?: string
    notes?: string
  }
}

export function TransactionDialog({
  open,
  onOpenChange,
  type,
  transaction,
}: TransactionDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string; icon: string }[]>([])
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction ? (transaction.amount / 100).toString() : '',
      date: transaction ? new Date(transaction.date) : new Date(),
      categoryId: transaction?.category_id || '',
      accountId: transaction?.account_id || '',
      toAccountId: transaction?.to_account_id || '',
      merchant: transaction?.merchant || '',
      notes: transaction?.notes || '',
    },
  })

  const selectedDate = watch('date')
  const selectedAccountId = watch('accountId')

  useEffect(() => {
    async function fetchData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name, icon')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .in('type', type === 'transfer' ? ['both'] : [type, 'both'])
        .order('name')

      if (categoriesData) setCategories(categoriesData)

      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('name')

      if (accountsData) setAccounts(accountsData)
    }

    if (open) {
      fetchData()
    }
  }, [open, type])

  useEffect(() => {
    if (transaction) {
      reset({
        amount: (transaction.amount / 100).toString(),
        date: new Date(transaction.date),
        categoryId: transaction.category_id || '',
        accountId: transaction.account_id,
        toAccountId: transaction.to_account_id || '',
        merchant: transaction.merchant || '',
        notes: transaction.notes || '',
      })
    } else {
      reset({
        amount: '',
        date: new Date(),
        categoryId: '',
        accountId: '',
        toAccountId: '',
        merchant: '',
        notes: '',
      })
    }
  }, [transaction, reset])

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const amountInCents = decimalToCents(parseFloat(data.amount))

      const transactionData = {
        user_id: session.user.id,
        type,
        amount: amountInCents,
        date: format(data.date, 'yyyy-MM-dd'),
        category_id: data.categoryId || null,
        account_id: data.accountId,
        to_account_id: type === 'transfer' ? data.toAccountId : null,
        merchant: data.merchant || null,
        notes: data.notes || null,
      }

      let error
      if (transaction) {
        // Update existing
        ({ error } = await supabase
          .from('transactions')
          .update(transactionData)
          .eq('id', transaction.id))
      } else {
        // Create new
        ({ error } = await supabase
          .from('transactions')
          .insert(transactionData))
      }

      if (error) throw error

      toast({
        title: transaction ? 'Transaction updated' : 'Transaction added',
        description: `Your ${type} has been ${transaction ? 'updated' : 'recorded'} successfully.`,
      })

      onOpenChange(false)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-5 w-5 text-success" />
      case 'expense':
        return <ArrowUpRight className="h-5 w-5 text-destructive" />
      case 'transfer':
        return <ArrowRightLeft className="h-5 w-5 text-primary" />
    }
  }

  const getTitle = () => {
    const action = transaction ? 'Edit' : 'Add'
    return `${action} ${type.charAt(0).toUpperCase() + type.slice(1)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {transaction ? 'Update your transaction details.' : 'Record a new transaction.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 text-lg"
                {...register('amount')}
                error={!!errors.amount}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setValue('date', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">
              {type === 'transfer' ? 'From Account' : 'Account'}
            </Label>
            <Select
              value={watch('accountId')}
              onValueChange={(value) => setValue('accountId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && (
              <p className="text-sm text-destructive">{errors.accountId.message}</p>
            )}
          </div>

          {/* To Account (for transfers) */}
          {type === 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="toAccount">To Account</Label>
              <Select
                value={watch('toAccountId')}
                onValueChange={(value) => setValue('toAccountId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.id !== selectedAccountId)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={watch('categoryId')}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Merchant */}
          {type !== 'transfer' && (
            <div className="space-y-2">
              <Label htmlFor="merchant">
                {type === 'expense' ? 'Merchant' : 'Source'}
              </Label>
              <Input
                id="merchant"
                placeholder={type === 'expense' ? 'e.g., Amazon, Starbucks' : 'e.g., Employer, Client'}
                {...register('merchant')}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details..."
              rows={2}
              {...register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={isLoading}>
              {transaction ? 'Update' : 'Add'} {type}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
