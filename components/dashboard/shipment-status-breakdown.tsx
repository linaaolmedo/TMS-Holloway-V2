'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'

interface ShipmentStatusBreakdownProps {
  statusCounts: { [key: string]: number }
}

function getStatusLabel(status: string): string {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500'
    case 'posted':
      return 'bg-blue-500'
    case 'pending_pickup':
      return 'bg-orange-500'
    case 'in_transit':
      return 'bg-green-500'
    case 'delivered':
      return 'bg-emerald-500'
    case 'delayed':
      return 'bg-red-500'
    case 'cancelled':
      return 'bg-gray-500'
    default:
      return 'bg-purple-500'
  }
}

export function ShipmentStatusBreakdown({ statusCounts }: ShipmentStatusBreakdownProps) {
  const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
  
  const statuses = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Active Shipment Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {statuses.length > 0 ? (
            statuses.map(([status, count]) => {
              const percentage = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-300">{getStatusLabel(status)}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`${getStatusColor(status)} h-2 rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{percentage}% of total</div>
                </div>
              )
            })
          ) : (
            <div className="flex h-32 items-center justify-center text-gray-400">
              No active shipments
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

