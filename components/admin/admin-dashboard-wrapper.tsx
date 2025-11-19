'use client'

import { RefreshButton } from '@/components/dashboard/refresh-button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { Users, Building, Package, DollarSign, TrendingUp, Activity } from 'lucide-react'

interface AdminDashboardWrapperProps {
  analytics: {
    users: {
      total: number
      by_role: { [key: string]: number }
    }
    companies: {
      shippers: number
      carriers: number
    }
    loads: {
      total: number
      by_status: { [key: string]: number }
      total_customer_revenue: number
      total_carrier_cost: number
    }
    recent_activities: any[]
  }
}

export function AdminDashboardWrapper({ analytics }: AdminDashboardWrapperProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const margin = analytics.loads.total_customer_revenue - analytics.loads.total_carrier_cost
  const marginPercent = analytics.loads.total_customer_revenue > 0
    ? ((margin / analytics.loads.total_customer_revenue) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-sm text-gray-400">System-wide overview and management</p>
          <p className="text-xs text-gray-500">Last updated: {currentTime}</p>
        </div>
        <RefreshButton />
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={analytics.users.total}
          icon={Users}
          trend={`${analytics.users.by_role.executive || 0} admins`}
          trendUp={true}
        />
        <MetricCard
          title="Total Companies"
          value={analytics.companies.shippers + analytics.companies.carriers}
          icon={Building}
          trend={`${analytics.companies.shippers} shippers, ${analytics.companies.carriers} carriers`}
          trendUp={true}
        />
        <MetricCard
          title="Loads (30d)"
          value={analytics.loads.total}
          icon={Package}
          trend={`${analytics.loads.by_status.delivered || 0} delivered`}
          trendUp={true}
        />
        <MetricCard
          title="Revenue (30d)"
          value={`$${analytics.loads.total_customer_revenue.toLocaleString()}`}
          icon={DollarSign}
          trend={`${marginPercent}% margin`}
          trendUp={parseFloat(marginPercent.toString()) > 10}
        />
      </div>

      {/* User Breakdown */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Breakdown by Role
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Object.entries(analytics.users.by_role).map(([role, count]) => (
            <div key={role} className="text-center">
              <div className="text-2xl font-bold text-white">{count as number}</div>
              <div className="text-sm text-gray-400 capitalize">{role}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Load Status Breakdown */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Load Status (Last 30 Days)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(analytics.loads.by_status).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-white">{count as number}</div>
              <div className="text-sm text-gray-400 capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Admin Activities */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Admin Activities
        </h2>
        <div className="space-y-3">
          {analytics.recent_activities.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activities</p>
          ) : (
            analytics.recent_activities.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between border-b border-gray-700 pb-3 last:border-0"
              >
                <div>
                  <p className="text-white text-sm">
                    <span className="font-semibold">{activity.user?.name || activity.user?.email}</span>
                    {' '}
                    <span className="text-gray-400">{activity.action}</span>
                    {' '}
                    <span className="text-yellow-500">{activity.entity_type}</span>
                  </p>
                  {activity.metadata && (
                    <p className="text-xs text-gray-500 mt-1">
                      {JSON.stringify(activity.metadata)}
                    </p>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Customer Revenue (30d)</h3>
          <p className="text-2xl font-bold text-green-500">
            ${analytics.loads.total_customer_revenue.toLocaleString()}
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Carrier Cost (30d)</h3>
          <p className="text-2xl font-bold text-red-500">
            ${analytics.loads.total_carrier_cost.toLocaleString()}
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Margin (30d)</h3>
          <p className="text-2xl font-bold text-yellow-500">
            ${margin.toLocaleString()} ({marginPercent}%)
          </p>
        </div>
      </div>
    </div>
  )
}

