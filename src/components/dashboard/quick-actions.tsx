'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, ArrowDownLeft, ArrowUpRight, ArrowRightLeft, TrendingUp } from 'lucide-react'
import { TransactionDialog } from '@/components/transactions/transaction-dialog'

export function QuickActions() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<'expense' | 'income' | 'transfer'>('expense')

  const handleAction = (type: 'expense' | 'income' | 'transfer') => {
    setTransactionType(type)
    setDialogOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleAction('expense')}>
              <ArrowUpRight className="h-4 w-4 mr-2 text-destructive" />
              Add Expense
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('income')}>
              <ArrowDownLeft className="h-4 w-4 mr-2 text-success" />
              Add Income
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('transfer')}>
              <ArrowRightLeft className="h-4 w-4 mr-2 text-primary" />
              Add Transfer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type={transactionType}
      />
    </>
  )
}
