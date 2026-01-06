'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency, formatPercentage, decimalToCents } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Plus,
  PieChart,
  BarChart3,
  Search,
} from 'lucide-react'
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface Holding {
  id: string
  quantity: number
  average_cost: number
  total_cost: number
  current_value: number | null
  unrealized_gain: number | null
  unrealized_gain_percent: number | null
  asset: {
    id: string
    symbol: string
    name: string
    asset_type: string
    current_price: number | null
  }
  account: {
    id: string
    name: string
  }
}

const COLORS = [
  '#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#f97316',
]

export default function InvestmentsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

  // Form state
  const [symbol, setSymbol] = useState('')
  const [name, setName] = useState('')
  const [assetType, setAssetType] = useState('stock')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [accountId, setAccountId] = useState('')
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Fetch holdings
    const { data: holdingsData } = await supabase
      .from('holdings')
      .select(`
        id, quantity, average_cost, total_cost, current_value, unrealized_gain, unrealized_gain_percent,
        asset:assets(id, symbol, name, asset_type, current_price),
        account:accounts(id, name)
      `)
      .eq('user_id', session.user.id)
      .gt('quantity', 0)

    if (holdingsData) {
      setHoldings(holdingsData.map(h => ({
        ...h,
        asset: Array.isArray(h.asset) ? h.asset[0] : h.asset,
        account: Array.isArray(h.account) ? h.account[0] : h.account,
      })))
    }

    // Fetch investment accounts
    const { data: accountsData } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('user_id', session.user.id)
      .eq('type', 'investment')
      .eq('is_active', true)

    if (accountsData) {
      setAccounts(accountsData)
    }

    setIsLoading(false)
  }

  const handleAddInvestment = async () => {
    if (!symbol || !name || !quantity || !price || !accountId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    try {
      // Check if asset exists or create it
      let assetId: string
      const { data: existingAsset } = await supabase
        .from('assets')
        .select('id')
        .eq('symbol', symbol.toUpperCase())
        .eq('asset_type', assetType)
        .single()

      if (existingAsset) {
        assetId = existingAsset.id
      } else {
        const { data: newAsset, error: assetError } = await supabase
          .from('assets')
          .insert({
            symbol: symbol.toUpperCase(),
            name,
            asset_type: assetType,
            current_price: decimalToCents(parseFloat(price)),
          })
          .select('id')
          .single()

        if (assetError) throw assetError
        assetId = newAsset.id
      }

      // Create investment transaction
      const qty = parseFloat(quantity)
      const priceInCents = decimalToCents(parseFloat(price))

      const { error: txError } = await supabase
        .from('investment_transactions')
        .insert({
          user_id: session.user.id,
          account_id: accountId,
          asset_id: assetId,
          type: 'buy',
          quantity: qty,
          price: priceInCents,
          fees: 0,
          date: format(new Date(), 'yyyy-MM-dd'),
        })

      if (txError) throw txError

      // Update or create holding
      const { data: existingHolding } = await supabase
        .from('holdings')
        .select('id, quantity, total_cost')
        .eq('user_id', session.user.id)
        .eq('account_id', accountId)
        .eq('asset_id', assetId)
        .single()

      const totalCost = qty * priceInCents

      if (existingHolding) {
        const newQuantity = existingHolding.quantity + qty
        const newTotalCost = existingHolding.total_cost + totalCost
        const newAvgCost = newTotalCost / newQuantity

        await supabase
          .from('holdings')
          .update({
            quantity: newQuantity,
            average_cost: Math.round(newAvgCost),
            total_cost: newTotalCost,
            current_value: newQuantity * priceInCents,
          })
          .eq('id', existingHolding.id)
      } else {
        await supabase
          .from('holdings')
          .insert({
            user_id: session.user.id,
            account_id: accountId,
            asset_id: assetId,
            quantity: qty,
            average_cost: priceInCents,
            total_cost: totalCost,
            current_value: totalCost,
          })
      }

      toast({
        title: 'Investment added',
        description: `${qty} shares of ${symbol.toUpperCase()} added to your portfolio.`,
      })

      setDialogOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add investment',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setSymbol('')
    setName('')
    setAssetType('stock')
    setQuantity('')
    setPrice('')
    setAccountId('')
  }

  // Calculate totals
  const totalValue = holdings.reduce((sum, h) => sum + (h.current_value || h.total_cost), 0)
  const totalCost = holdings.reduce((sum, h) => sum + h.total_cost, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  // Allocation data for pie chart
  const allocationByType = holdings.reduce((acc, h) => {
    const type = h.asset?.asset_type || 'other'
    acc[type] = (acc[type] || 0) + (h.current_value || h.total_cost)
    return acc
  }, {} as Record<string, number>)

  const allocationData = Object.entries(allocationByType).map(([name, value], i) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: COLORS[i % COLORS.length],
  }))

  const filteredHoldings = holdings.filter(h =>
    h.asset?.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.asset?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Investments</h1>
          <p className="text-muted-foreground mt-1">
            Track your portfolio performance
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Investment
        </Button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Gain/Loss</p>
            <p className={cn(
              'text-2xl font-bold mt-1 flex items-center gap-2',
              totalGain >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {totalGain >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {formatCurrency(Math.abs(totalGain))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Return</p>
            <p className={cn(
              'text-2xl font-bold mt-1',
              totalGainPercent >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {formatPercentage(totalGainPercent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Holdings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Asset Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allocationData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No holdings yet
              </div>
            ) : (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={allocationData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocationData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {allocationData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Holdings List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Holdings
              </CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredHoldings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No holdings found</p>
                <Button onClick={() => setDialogOpen(true)} className="mt-4">
                  Add your first investment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHoldings.map((holding) => {
                  const value = holding.current_value || holding.total_cost
                  const gain = (holding.unrealized_gain || 0)
                  const gainPercent = holding.unrealized_gain_percent || 0

                  return (
                    <div
                      key={holding.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {holding.asset?.symbol?.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium">{holding.asset?.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {holding.quantity.toFixed(4)} shares @ {formatCurrency(holding.average_cost)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(value)}</p>
                        <p className={cn(
                          'text-sm flex items-center justify-end gap-1',
                          gain >= 0 ? 'text-success' : 'text-destructive'
                        )}>
                          {gain >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatCurrency(Math.abs(gain))} ({formatPercentage(gainPercent)})
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Investment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Investment</DialogTitle>
            <DialogDescription>
              Record a new investment purchase
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  placeholder="e.g., AAPL"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label>Asset Type</Label>
                <Select value={assetType} onValueChange={setAssetType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock</SelectItem>
                    <SelectItem value="etf">ETF</SelectItem>
                    <SelectItem value="crypto">Crypto</SelectItem>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="bond">Bond</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="e.g., Apple Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Price per Share</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investment account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {accounts.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Create an investment account first in the Accounts section.
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleAddInvestment}
                disabled={isSubmitting || accounts.length === 0}
                loading={isSubmitting}
              >
                Add Investment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
