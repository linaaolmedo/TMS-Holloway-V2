'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BarChart3 } from 'lucide-react'

interface ChartDataPoint {
  date: string
  tons: number
  avgRate: number
}

interface BulkFreightAnalyticsProps {
  chartData: ChartDataPoint[]
}

export function BulkFreightAnalytics({ chartData }: BulkFreightAnalyticsProps) {
  // Calculate totals
  const totalTons = chartData.reduce((sum, d) => sum + d.tons, 0)
  const avgRateOverall = chartData.length > 0
    ? Math.round(chartData.reduce((sum, d) => sum + d.avgRate, 0) / chartData.filter(d => d.avgRate > 0).length)
    : 0

  // Format date for display
  const formattedData = chartData.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Bulk Freight Analytics
          </div>
          <span className="text-sm font-normal text-gray-400">Last 30 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-navy-lighter p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">Total Tons Delivered</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {totalTons.toLocaleString()}
                </p>
              </div>
              <div className="bg-navy-lighter p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400">Avg Rate per Ton</p>
                <p className="text-3xl font-bold text-white mt-1">
                  ${avgRateOverall}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="space-y-8">
              {/* Tons Delivered Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Tons Delivered</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9ca3af" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="tons" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Average Rate Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Average Rate per Ton</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#9ca3af" 
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={12}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #374151',
                        borderRadius: '6px',
                        color: '#fff'
                      }}
                      formatter={(value: any) => [`$${value}`, 'Avg Rate']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgRate" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-400">
            No analytics data available for the last 30 days
          </div>
        )}
      </CardContent>
    </Card>
  )
}

