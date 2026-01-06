import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { DashboardStats } from '@/components/dashboard/stats'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { SpendingChart } from '@/components/dashboard/spending-chart'
import { BudgetOverview } from '@/components/dashboard/budget-overview'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary'
import { Skeleton } from '@/components/ui/skeleton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your financial overview.
          </p>
        </div>
        <QuickActions />
      </div>

      {/* Stats Cards */}
      <Suspense fallback={<StatsLoading />}>
        <DashboardStats userId={session.user.id} />
      </Suspense>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartLoading />}>
          <SpendingChart userId={session.user.id} />
        </Suspense>

        <Suspense fallback={<ChartLoading />}>
          <BudgetOverview userId={session.user.id} />
        </Suspense>
      </div>

      {/* Portfolio & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<TransactionsLoading />}>
            <RecentTransactions userId={session.user.id} />
          </Suspense>
        </div>

        <div>
          <Suspense fallback={<ChartLoading />}>
            <PortfolioSummary userId={session.user.id} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  )
}

function ChartLoading() {
  return <Skeleton className="h-[400px] rounded-xl" />
}

function TransactionsLoading() {
  return <Skeleton className="h-[400px] rounded-xl" />
}
