'use client'

import { useState } from 'react'
import { Search, Building, TrendingUp } from 'lucide-react'

interface Company {
  id: string
  name: string
  type: 'shipper' | 'carrier' | 'internal'
  created_at: string
  updated_at: string
}

interface CompanyManagementClientProps {
  companies: Company[]
}

export function CompanyManagementClient({ companies }: CompanyManagementClientProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const filteredCompanies = companies.filter((company) => {
    const matchesSearch = company.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || company.type === typeFilter
    return matchesSearch && matchesType
  })

  const getTypeBadgeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      shipper: 'bg-blue-500/20 text-blue-400',
      carrier: 'bg-green-500/20 text-green-400',
      internal: 'bg-purple-500/20 text-purple-400',
    }
    return colors[type] || 'bg-gray-500/20 text-gray-400'
  }

  const shipperCount = companies.filter((c) => c.type === 'shipper').length
  const carrierCount = companies.filter((c) => c.type === 'carrier').length
  const internalCount = companies.filter((c) => c.type === 'internal').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Company Management</h1>
          <p className="text-sm text-gray-400">Manage all companies in the system</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-darkblue rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-navy border border-gray-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="all">All Types</option>
            <option value="shipper">Shippers</option>
            <option value="carrier">Carriers</option>
            <option value="internal">Internal</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-white">{companies.length}</div>
          <div className="text-sm text-gray-400">Total Companies</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400">{shipperCount}</div>
          <div className="text-sm text-gray-400">Shippers</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400">{carrierCount}</div>
          <div className="text-sm text-gray-400">Carriers</div>
        </div>
        <div className="bg-darkblue rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400">{internalCount}</div>
          <div className="text-sm text-gray-400">Internal</div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-darkblue rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-navy/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-white">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(
                        company.type
                      )}`}
                    >
                      {company.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(company.updated_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No companies found matching your filters</p>
        </div>
      )}
    </div>
  )
}

