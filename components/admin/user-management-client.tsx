'use client'

import { useState } from 'react'
import { updateUserRole, toggleUserActive, updateUser, createUser } from '@/app/actions/admin'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Edit, Shield, Power } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  company_id: string | null
  is_active: boolean
  last_login_at: string | null
  created_at: string
  company?: {
    id: string
    name: string
    type: string
  } | null
}

interface UserManagementClientProps {
  users: User[]
}

export function UserManagementClient({ users }: UserManagementClientProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const roles = ['executive', 'admin', 'billing', 'csr', 'dispatch', 'customer', 'carrier', 'driver']

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(userId)
    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setLoading(null)
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setLoading(userId)
    const result = await toggleUserActive(userId, !isActive)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error)
    }
    setLoading(null)
  }

  const handleUpdateUser = async (userId: string, updates: any) => {
    setLoading(userId)
    const result = await updateUser(userId, updates)
    if (result.success) {
      setEditingUser(null)
      router.refresh()
    } else {
      alert(result.error)
    }
    setLoading(null)
  }

  const handleCreateUser = async (data: any) => {
    setLoading('create')
    const result = await createUser(data)
    if (result.success) {
      setShowCreateModal(false)
      router.refresh()
    } else {
      alert(result.error)
    }
    setLoading(null)
  }

  const getRoleBadgeColor = (role: string) => {
    const colors: { [key: string]: string } = {
      executive: 'bg-purple-500/20 text-purple-400',
      admin: 'bg-red-500/20 text-red-400',
      billing: 'bg-green-500/20 text-green-400',
      csr: 'bg-blue-500/20 text-blue-400',
      dispatch: 'bg-yellow-500/20 text-yellow-400',
      customer: 'bg-cyan-500/20 text-cyan-400',
      carrier: 'bg-orange-500/20 text-orange-400',
      driver: 'bg-gray-500/20 text-gray-400',
    }
    return colors[role] || 'bg-gray-500/20 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-sm text-gray-400">Manage users, roles, and permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          <UserPlus className="h-4 w-4" />
          Create User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-darkblue rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{users.length}</div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{filteredUsers.length}</div>
          <div className="text-sm text-gray-400">Filtered Results</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">
            {users.filter((u) => u.is_active).length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-red-400">
            {users.filter((u) => !u.is_active).length}
          </div>
          <div className="text-sm text-gray-400">Inactive</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-darkblue rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Company
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-navy/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{user.name || 'N/A'}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={loading === user.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        user.role
                      )} border-0 bg-opacity-100 focus:outline-none focus:ring-2 focus:ring-yellow-500`}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">{user.company?.name || 'N/A'}</div>
                    {user.company && (
                      <div className="text-xs text-gray-400 capitalize">{user.company.type}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        title="Edit User"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user.id, user.is_active)}
                        disabled={loading === user.id}
                        className={`p-1 transition-colors ${
                          user.is_active
                            ? 'text-red-400 hover:text-red-300'
                            : 'text-green-400 hover:text-green-300'
                        }`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkblue rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Edit User</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleUpdateUser(editingUser.id, {
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingUser.name || ''}
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingUser.email}
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingUser.phone || ''}
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading === editingUser.id}
                  className="flex-1 bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  {loading === editingUser.id ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-darkblue rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create New User</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleCreateUser({
                  email: formData.get('email') as string,
                  name: formData.get('name') as string,
                  role: formData.get('role') as string,
                  phone: formData.get('phone') as string,
                })
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  required
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading === 'create'}
                  className="flex-1 bg-yellow-500 text-navy px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
                >
                  {loading === 'create' ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

