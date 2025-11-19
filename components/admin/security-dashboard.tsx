'use client'

import { Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react'

interface ImpersonationLog {
  id: number
  admin_user_id: string
  target_user_id: string
  started_at: string
  ended_at: string | null
  reason: string | null
  ip_address: string | null
  admin?: {
    email: string
    name: string | null
  } | null
  target?: {
    email: string
    name: string | null
    role: string
  } | null
}

interface SecurityDashboardProps {
  impersonationLogs: ImpersonationLog[]
}

export function SecurityDashboard({ impersonationLogs }: SecurityDashboardProps) {
  const activeSessions = impersonationLogs.filter((log) => !log.ended_at)
  const completedSessions = impersonationLogs.filter((log) => log.ended_at)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
        <p className="text-sm text-gray-400">Monitor security events and impersonation sessions</p>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-darkblue rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-400">System Status</p>
              <p className="text-xl font-bold text-green-500">Secure</p>
            </div>
          </div>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-400">Active Sessions</p>
              <p className="text-xl font-bold text-yellow-500">{activeSessions.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-400">Total Impersonations</p>
              <p className="text-xl font-bold text-blue-500">{impersonationLogs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Impersonation Sessions */}
      {activeSessions.length > 0 && (
        <div className="bg-darkblue rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Active Impersonation Sessions
          </h2>
          <div className="space-y-3">
            {activeSessions.map((log) => (
              <div
                key={log.id}
                className="bg-yellow-500/10 border border-yellow-500 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      {log.admin?.name || log.admin?.email}
                    </p>
                    <p className="text-sm text-gray-400">
                      Impersonating: {log.target?.name || log.target?.email} (
                      {log.target?.role})
                    </p>
                    {log.reason && (
                      <p className="text-xs text-gray-500 mt-1">Reason: {log.reason}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Started</p>
                    <p className="text-sm text-white">
                      {new Date(log.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impersonation History */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Impersonation History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Admin User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Target User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Started
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ended
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {completedSessions.map((log) => {
                const duration = log.ended_at
                  ? Math.round(
                      (new Date(log.ended_at).getTime() -
                        new Date(log.started_at).getTime()) /
                        60000
                    )
                  : null

                return (
                  <tr key={log.id} className="hover:bg-navy/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {log.admin?.name || log.admin?.email || 'Unknown'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-white">
                          {log.target?.name || log.target?.email || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">{log.target?.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {log.ended_at ? new Date(log.ended_at).toLocaleString() : 'Active'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {duration ? `${duration} min` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {log.reason || 'No reason provided'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Impersonations Today</h3>
          <p className="text-2xl font-bold text-white">
            {
              impersonationLogs.filter((log) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                return new Date(log.started_at) >= today
              }).length
            }
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Impersonations This Week</h3>
          <p className="text-2xl font-bold text-white">
            {
              impersonationLogs.filter((log) => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(log.started_at) >= weekAgo
              }).length
            }
          </p>
        </div>
        <div className="bg-darkblue rounded-lg p-6">
          <h3 className="text-sm text-gray-400 mb-2">Avg Session Duration</h3>
          <p className="text-2xl font-bold text-white">
            {completedSessions.length > 0
              ? Math.round(
                  completedSessions.reduce((sum, log) => {
                    const duration = log.ended_at
                      ? (new Date(log.ended_at).getTime() -
                          new Date(log.started_at).getTime()) /
                        60000
                      : 0
                    return sum + duration
                  }, 0) / completedSessions.length
                )
              : 0}{' '}
            min
          </p>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="bg-darkblue rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Security Recommendations</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-navy rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">All impersonation sessions are logged</p>
              <p className="text-sm text-gray-400">
                Every admin action during impersonation is tracked for audit purposes
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-navy rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Regular security audits recommended</p>
              <p className="text-sm text-gray-400">
                Review impersonation logs monthly to ensure proper usage
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

