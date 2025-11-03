import { FleetTabs } from '@/components/fleet/fleet-tabs'

export const dynamic = 'force-dynamic'

export default function FleetPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Fleet</h1>
        <p className="text-sm text-gray-400">View, add, and manage your company-owned trucks.</p>
      </div>

      <FleetTabs />
    </div>
  )
}

