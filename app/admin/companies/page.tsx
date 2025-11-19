import { getAllCompanies } from '@/app/actions/admin'
import { CompanyManagementClient } from '@/components/admin/company-management-client'

export const dynamic = 'force-dynamic'

export default async function CompaniesPage() {
  const result = await getAllCompanies()

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">Company Management</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading companies: {result.error}</p>
        </div>
      </div>
    )
  }

  return <CompanyManagementClient companies={result.data || []} />
}

