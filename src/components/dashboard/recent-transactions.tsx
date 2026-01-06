import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowRight, ArrowUpRight, ArrowDownLeft, ArrowRightLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentTransactionsProps {
  userId: string
}

export async function RecentTransactions({ userId }: RecentTransactionsProps) {
  const supabase = createServerClient()

  const { data: transactions } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, icon, color),
      account:accounts(id, name)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'income':
        return <ArrowDownLeft className="h-4 w-4" />
      case 'expense':
        return <ArrowUpRight className="h-4 w-4" />
      case 'transfer':
        return <ArrowRightLeft className="h-4 w-4" />
      default:
        return null
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-success bg-success/10'
      case 'expense':
        return 'text-destructive bg-destructive/10'
      case 'transfer':
        return 'text-primary bg-primary/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions" className="gap-1">
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {!transactions || transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No transactions yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add your first transaction to get started
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      getTransactionColor(transaction.type)
                    )}
                  >
                    {getTransactionIcon(transaction.type)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.merchant || transaction.category?.name || 'Uncategorized'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatDate(transaction.date)}</span>
                      <span>•</span>
                      <span>{transaction.account?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      'font-semibold',
                      transaction.type === 'income'
                        ? 'text-success'
                        : transaction.type === 'expense'
                        ? 'text-destructive'
                        : 'text-foreground'
                    )}
                  >
                    {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </p>
                  {transaction.category && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      {transaction.category.name}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
