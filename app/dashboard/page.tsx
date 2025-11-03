import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { RefreshButton } from '@/components/dashboard/refresh-button'
import { Clock, Package } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch pending pickup loads
  const { data: pendingPickup, count: pendingCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact' })
    .eq('status', 'pending_pickup')

  // Fetch in transit loads
  const { data: inTransit, count: transitCount } = await supabase
    .from('loads')
    .select('*', { count: 'exact' })
    .eq('status', 'in_transit')

  // Fetch recent active loads (last 5)
  const { data: recentLoads } = await supabase
    .from('loads')
    .select(`
      *,
      customer:companies!loads_customer_id_fkey(name),
      carrier:companies!loads_carrier_id_fkey(name)
    `)
    .in('status', ['pending_pickup', 'in_transit'])
    .order('created_at', { ascending: false })
    .limit(5)

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400">Last updated: {currentTime}</p>
        </div>
        <RefreshButton />
      </div>

      <p className="text-sm text-yellow-500 flex items-center gap-2">
        <span>💡</span>
        Drag and drop cards anywhere to customize your layout
      </p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Activity
              <span className="text-sm font-normal text-gray-400">Last 24h</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-gray-400">
              No recent activity
            </div>
          </CardContent>
        </Card>

        {/* Recent Active Loads */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Recent Active Loads
              <span className="text-sm font-normal text-gray-400">Latest active loads</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLoads && recentLoads.length > 0 ? (
                recentLoads.slice(0, 5).map((load) => (
                  <div
                    key={load.id}
                    className="flex items-center justify-between rounded-md border border-gray-700 bg-navy-lighter p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{load.load_number}</p>
                      <p className="text-sm text-gray-400">
                        {(load.customer as any)?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PU: {formatDate(load.pickup_time)} | Del: {formatDate(load.delivery_time)}
                      </p>
                    </div>
                    <Badge variant={load.status} />
                  </div>
                ))
              ) : (
                <div className="flex h-32 items-center justify-center text-gray-400">
                  No active loads
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Pickup Metric */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Pickup</p>
                <p className="text-4xl font-bold text-white">{pendingCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Loads awaiting pickup</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/10">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* In Transit Metric */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Transit</p>
                <p className="text-4xl font-bold text-white">{transitCount || 0}</p>
                <p className="text-xs text-gray-500 mt-1">Loads in transit</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center text-gray-400">
              No notifications
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

