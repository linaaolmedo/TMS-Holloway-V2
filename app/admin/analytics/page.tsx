import { getSystemAnalytics } from '@/app/actions/admin'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const result = await getSystemAnalytics()

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading analytics: {'error' in result ? result.error : 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  if (!('data' in result)) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Analytics</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error: No data available</p>
        </div>
      </div>
    )
  }

  return <AnalyticsDashboard analytics={result.data as any} />
}

