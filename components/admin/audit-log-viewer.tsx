'use client'

import { useState } from 'react'
import { Filter, Download, Eye } from 'lucide-react'

interface AuditLog {
  id: number
  entity_type: string
  entity_id: number | string
  action: string
  user_id: string
  user_role: string
  impersonated_by: string | null
  metadata: any
  created_at: string
  user?: {
    email: string
    name: string | null
    role: string
  } | null
  impersonator?: {
    email: string
    name: string | null
  } | null
}

interface AuditLogViewerProps {
  logs: AuditLog[]
  totalCount: number
}

export function AuditLogViewer({ logs, totalCount }: AuditLogViewerProps) {
  const [entityTypeFilter, setEntityTypeFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const entityTypes = ['all', 'user', 'company', 'load', 'invoice', 'document', 'setting', 'system']
  const actions = ['all', 'created', 'updated', 'deleted', 'login', 'logout', 'role_changed', 'impersonated', 'bulk_update', 'generated', 'downloaded', 'viewed']

  const filteredLogs = logs.filter((log) => {
    const matchesEntity = entityTypeFilter === 'all' || log.entity_type === entityTypeFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesEntity && matchesAction
  })

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      created: 'bg-green-500/20 text-green-400',
      updated: 'bg-blue-500/20 text-blue-400',
      deleted: 'bg-red-500/20 text-red-400',
      login: 'bg-cyan-500/20 text-cyan-400',
      logout: 'bg-gray-500/20 text-gray-400',
      role_changed: 'bg-purple-500/20 text-purple-400',
      impersonated: 'bg-yellow-500/20 text-yellow-400',
      bulk_update: 'bg-orange-500/20 text-orange-400',
      generated: 'bg-teal-500/20 text-teal-400',
      downloaded: 'bg-indigo-500/20 text-indigo-400',
      viewed: 'bg-pink-500/20 text-pink-400',
    }
    return colors[action] || 'bg-gray-500/20 text-gray-400'
  }

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Impersonated By', 'Metadata']
    const rows = filteredLogs.map((log) => [
      new Date(log.created_at).toISOString(),
      log.user?.email || 'N/A',
      log.action,
      log.entity_type,
      log.entity_id,
      log.impersonator?.email || '',
      JSON.stringify(log.metadata || {}),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Audit Logs</h1>
          <p className="text-sm text-gray-400">
            System-wide activity tracking and monitoring
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-darkblue rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Entity Type</label>
            <select
              value={entityTypeFilter}
              onChange={(e) => setEntityTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            >
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
            >
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.charAt(0).toUpperCase() + action.slice(1).replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{totalCount}</div>
          <div className="text-sm text-gray-400">Total Logs</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{filteredLogs.length}</div>
          <div className="text-sm text-gray-400">Filtered Results</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {logs.filter((l) => l.impersonated_by).length}
          </div>
          <div className="text-sm text-gray-400">Impersonated Actions</div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-darkblue rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Entity
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-navy/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {log.user?.name || log.user?.email || 'System'}
                      </div>
                      {log.impersonator && (
                        <div className="text-xs text-yellow-400">
                          via {log.impersonator.name || log.impersonator.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white capitalize">{log.entity_type}</div>
                    <div className="text-xs text-gray-400">ID: {log.entity_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    {log.metadata ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-xs">View</span>
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">No metadata</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkblue rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Audit Log Details</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-400">Timestamp</label>
                <p className="text-white">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">User</label>
                <p className="text-white">
                  {selectedLog.user?.name || selectedLog.user?.email || 'System'}
                  {selectedLog.user && (
                    <span className="text-gray-400 ml-2">({selectedLog.user.role})</span>
                  )}
                </p>
              </div>
              {selectedLog.impersonator && (
                <div>
                  <label className="text-sm text-gray-400">Impersonated By</label>
                  <p className="text-yellow-400">
                    {selectedLog.impersonator.name || selectedLog.impersonator.email}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-400">Action</label>
                <p className="text-white capitalize">{selectedLog.action.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="text-sm text-gray-400">Entity</label>
                <p className="text-white">
                  {selectedLog.entity_type} (ID: {selectedLog.entity_id})
                </p>
              </div>
              {selectedLog.metadata && (
                <div>
                  <label className="text-sm text-gray-400">Metadata</label>
                  <pre className="mt-1 p-3 bg-navy rounded text-xs text-white overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedLog(null)}
              className="mt-6 w-full bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

