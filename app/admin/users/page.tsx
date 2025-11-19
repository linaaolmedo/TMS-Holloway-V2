import { getSystemUsers } from '@/app/actions/admin'
import { UserManagementClient } from '@/components/admin/user-management-client'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const result = await getSystemUsers()

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">User Management</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading users: {result.error}</p>
        </div>
      </div>
    )
  }

  return <UserManagementClient users={result.data || []} />
}

