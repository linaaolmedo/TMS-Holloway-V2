'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function AnalyticsCharts() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
          <CardDescription>Track revenue performance over the year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-center gap-2 pb-4">
            {/* Simple bar chart using divs */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-full bg-primary h-32 rounded-t"></div>
              <span className="text-xs text-gray-400 mt-2">Aug</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipment Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Shipment Status Overview</CardTitle>
          <CardDescription>Current distribution of all shipment statuses.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="relative h-48 w-48">
              {/* Simple pie chart representation */}
              <div className="h-full w-full rounded-full border-8 border-green-500" style={{
                background: `conic-gradient(
                  #22c55e 0deg 180deg,
                  #eab308 180deg 270deg,
                  #3b82f6 270deg 315deg,
                  #ef4444 315deg 360deg
                )`
              }}></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-400">count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-400">count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm text-gray-400">count</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500"></div>
              <span className="text-sm text-gray-400">count</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
                  T
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Test Customer Inc.</p>
                  <p className="text-xs text-gray-400">5 shipments</p>
                </div>
              </div>
              <p className="text-sm font-medium text-white">$5,000.00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Fleet Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Trucks</span>
                <span className="text-sm font-medium text-white">9</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

