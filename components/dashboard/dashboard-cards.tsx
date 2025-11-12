'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MetricCard } from './metric-card'
import { ActiveLoadsMap } from './active-loads-map'
import { ShipmentStatusBreakdown } from './shipment-status-breakdown'
import { BulkFreightAnalytics } from './bulk-freight-analytics'
import { Clock, Truck, CheckCircle, FileText, Layers } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DashboardCardsProps {
  totalLoadsCount: number
  pendingCount: number
  transitCount: number
  deliveredCount: number
  readyToInvoiceCount: number
  recentLoads: any[]
  activeLoadsWithCoords: any[]
  statusCounts: { [key: string]: number }
  chartData: any[]
}

export function DashboardCards({
  totalLoadsCount,
  pendingCount,
  transitCount,
  deliveredCount,
  readyToInvoiceCount,
  recentLoads,
  activeLoadsWithCoords,
  statusCounts,
  chartData,
}: DashboardCardsProps) {
  const dashboardCards = [
    // Row 1: Real-Time Map (Full Width)
    {
      id: 'active-loads-map',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5',
      component: (
        <ActiveLoadsMap loads={activeLoadsWithCoords} />
      ),
    },
    // Row 2: Key Metrics (5 cards across)
    {
      id: 'total-loads',
      colSpan: 'col-span-1',
      component: (
        <MetricCard
          title="Total Loads"
          value={totalLoadsCount}
          description="All active loads"
          icon={Layers}
          iconColor="text-blue-500"
          iconBgColor="bg-blue-500/10"
          href="/dashboard/loads?filter=all"
        />
      ),
    },
    {
      id: 'pending-pickup',
      colSpan: 'col-span-1',
      component: (
        <MetricCard
          title="Pending Pickup"
          value={pendingCount}
          description="Loads awaiting pickup"
          icon={Clock}
          iconColor="text-yellow-500"
          iconBgColor="bg-yellow-500/10"
          href="/dashboard/loads?filter=pending_pickup"
        />
      ),
    },
    {
      id: 'in-transit',
      colSpan: 'col-span-1',
      component: (
        <MetricCard
          title="In Transit"
          value={transitCount}
          description="Loads currently moving"
          icon={Truck}
          iconColor="text-green-500"
          iconBgColor="bg-green-500/10"
          href="/dashboard/loads?filter=in_transit"
        />
      ),
    },
    {
      id: 'delivered',
      colSpan: 'col-span-1',
      component: (
        <MetricCard
          title="Delivered"
          value={deliveredCount}
          description="Completed deliveries"
          icon={CheckCircle}
          iconColor="text-emerald-500"
          iconBgColor="bg-emerald-500/10"
          href="/dashboard/loads?filter=delivered"
        />
      ),
    },
    {
      id: 'ready-to-invoice',
      colSpan: 'col-span-1',
      component: (
        <MetricCard
          title="Ready to Invoice"
          value={readyToInvoiceCount}
          description="Delivered, not invoiced"
          icon={FileText}
          iconColor="text-purple-500"
          iconBgColor="bg-purple-500/10"
          href="/dashboard/loads?filter=delivered"
        />
      ),
    },
    // Row 3: Recent Active Loads (3 cols) + Shipment Status (2 cols)
    {
      id: 'recent-active-loads',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-3',
      component: (
        <Card>
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
      ),
    },
    {
      id: 'shipment-status-breakdown',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2',
      component: (
        <ShipmentStatusBreakdown statusCounts={statusCounts} />
      ),
    },
    // Row 4: Recent Activity + Recent Notifications
    {
      id: 'recent-activity',
      colSpan: 'col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1',
      component: (
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
      ),
    },
    {
      id: 'recent-notifications',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-4',
      component: (
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
      ),
    },
    // Row 5: Analytics (Full Width)
    {
      id: 'bulk-freight-analytics',
      colSpan: 'col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-5',
      component: (
        <BulkFreightAnalytics chartData={chartData} />
      ),
    },
  ]

  return dashboardCards
}

