import { getSystemAnalytics } from '@/app/actions/admin'
import { AdminDashboardWrapper } from '@/components/admin/admin-dashboard-wrapper'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const result = await getSystemAnalytics()

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading dashboard: {result.error}</p>
        </div>
      </div>
    )
  }

  return <AdminDashboardWrapper analytics={result.data} />
}

