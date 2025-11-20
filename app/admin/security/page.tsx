import { getImpersonationLogs } from '@/app/actions/admin'
import { SecurityDashboard } from '@/components/admin/security-dashboard'

export const dynamic = 'force-dynamic'

export default async function SecurityPage() {
  const result = await getImpersonationLogs(50)

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Security Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading security data: {'error' in result ? result.error : 'Unknown error'}</p>
        </div>
      </div>
    )
  }

  if (!('data' in result)) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Security Dashboard</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error: No data available</p>
        </div>
      </div>
    )
  }

  return <SecurityDashboard impersonationLogs={result.data || []} />
}

