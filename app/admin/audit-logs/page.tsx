import { getAuditLogs } from '@/app/actions/admin'
import { AuditLogViewer } from '@/components/admin/audit-log-viewer'

export const dynamic = 'force-dynamic'

export default async function AuditLogsPage() {
  const result = await getAuditLogs({ limit: 100 })

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Audit Logs</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading audit logs: {result.error}</p>
        </div>
      </div>
    )
  }

  return <AuditLogViewer logs={result.data || []} totalCount={result.count || 0} />
}

