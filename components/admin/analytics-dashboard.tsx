'use client'

import { BarChart3, TrendingUp, DollarSign, Package } from 'lucide-react'

interface AnalyticsDashboardProps {
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

export function AnalyticsDashboard({ analytics }: AnalyticsDashboardProps) {
  const margin = analytics.loads.total_customer_revenue - analytics.loads.total_carrier_cost
  const marginPercent = analytics.loads.total_customer_revenue > 0
    ? ((margin / analytics.loads.total_customer_revenue) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-gray-400">Deep-dive analytics and business intelligence</p>
      </div>

      {/* Revenue Overview */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue Overview (Last 30 Days)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Customer Revenue</p>
            <p className="text-3xl font-bold text-green-500">
              ${analytics.loads.total_customer_revenue.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Carrier Cost</p>
            <p className="text-3xl font-bold text-red-500">
              ${analytics.loads.total_carrier_cost.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Gross Margin</p>
            <p className="text-3xl font-bold text-yellow-500">
              ${margin.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400 mt-1">{marginPercent}%</p>
          </div>
        </div>
      </div>

      {/* Load Performance */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Load Performance (Last 30 Days)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analytics.loads.total}</div>
            <div className="text-sm text-gray-400">Total Loads</div>
          </div>
          {Object.entries(analytics.loads.by_status).map(([status, count]) => (
            <div key={status} className="text-center">
              <div className="text-2xl font-bold text-white">{count as number}</div>
              <div className="text-sm text-gray-400 capitalize">{status.replace('_', ' ')}</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Metrics */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          User Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{analytics.users.total}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          {Object.entries(analytics.users.by_role)
            .slice(0, 3)
            .map(([role, count]) => (
              <div key={role} className="text-center">
                <div className="text-2xl font-bold text-white">{count as number}</div>
                <div className="text-sm text-gray-400 capitalize">{role}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Company Metrics */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Company Metrics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-400 mb-2">Shippers</p>
            <p className="text-3xl font-bold text-blue-500">{analytics.companies.shippers}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400 mb-2">Carriers</p>
            <p className="text-3xl font-bold text-green-500">{analytics.companies.carriers}</p>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Avg Revenue per Load</h3>
          <p className="text-2xl font-bold text-white">
            $
            {analytics.loads.total > 0
              ? (analytics.loads.total_customer_revenue / analytics.loads.total).toFixed(2)
              : '0.00'}
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Avg Cost per Load</h3>
          <p className="text-2xl font-bold text-white">
            $
            {analytics.loads.total > 0
              ? (analytics.loads.total_carrier_cost / analytics.loads.total).toFixed(2)
              : '0.00'}
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Avg Margin per Load</h3>
          <p className="text-2xl font-bold text-white">
            $
            {analytics.loads.total > 0
              ? (margin / analytics.loads.total).toFixed(2)
              : '0.00'}
          </p>
        </div>
      </div>

      {/* Growth Insights */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Business Insights</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-navy rounded-lg">
            <span className="text-gray-400">Margin Percentage</span>
            <span className={`font-bold ${parseFloat(marginPercent.toString()) > 15 ? 'text-green-400' : parseFloat(marginPercent.toString()) > 10 ? 'text-yellow-400' : 'text-red-400'}`}>
              {marginPercent}%
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-navy rounded-lg">
            <span className="text-gray-400">Active Users</span>
            <span className="font-bold text-white">{analytics.users.total}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-navy rounded-lg">
            <span className="text-gray-400">Total Network</span>
            <span className="font-bold text-white">
              {analytics.companies.shippers + analytics.companies.carriers} companies
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

