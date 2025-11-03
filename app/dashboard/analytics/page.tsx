import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { DollarSign, Package, TrendingUp } from 'lucide-react'
import { AnalyticsCharts } from '@/components/analytics/analytics-charts'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch year-to-date metrics
  const { data: loads, count: totalLoads } = await supabase
    .from('loads')
    .select('customer_rate', { count: 'exact' })

  const totalRevenue = loads?.reduce((sum, load) => sum + (load.customer_rate || 0), 0) || 0
  const avgLoadValue = totalLoads && totalLoads > 0 ? totalRevenue / totalLoads : 0

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-gray-400">Insights into your shipping performance and trends</p>
          <p className="text-sm text-green-500 mt-1">● Last updated: {currentTime} (Auto-updating)</p>
        </div>
        <RefreshButton />
      </div>

      {/* Metric Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue (YTD)</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Loads (YTD)</p>
                <p className="text-4xl font-bold text-white">{totalLoads || 0}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Average Load Value</p>
                <p className="text-4xl font-bold text-white">{formatCurrency(avgLoadValue)}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AnalyticsCharts />
    </div>
  )
}

