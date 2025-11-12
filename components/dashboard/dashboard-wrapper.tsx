'use client'

import { RefreshButton } from './refresh-button'
import { DashboardGridClient } from './dashboard-grid-client'
import { DashboardCards } from './dashboard-cards'

interface DashboardWrapperProps {
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

export function DashboardWrapper({
  totalLoadsCount,
  pendingCount,
  transitCount,
  deliveredCount,
  readyToInvoiceCount,
  recentLoads,
  activeLoadsWithCoords,
  statusCounts,
  chartData,
}: DashboardWrapperProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const dashboardCards = DashboardCards({
    totalLoadsCount,
    pendingCount,
    transitCount,
    deliveredCount,
    readyToInvoiceCount,
    recentLoads,
    activeLoadsWithCoords,
    statusCounts,
    chartData,
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

      <div className="space-y-1">
        <p className="text-sm text-yellow-500 flex items-center gap-2">
          <span>💡</span>
          Click on metrics to view filtered loads
        </p>
        <p className="text-xs text-gray-400 flex items-center gap-2 ml-6">
          Drag and drop cards to customize your layout
        </p>
      </div>

      <DashboardGridClient cards={dashboardCards} />
    </div>
  )
}

