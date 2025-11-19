import { getSystemSettings } from '@/app/actions/admin'
import { SettingsForm } from '@/components/admin/settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const result = await getSystemSettings()

  if (!result.success) {
    return (
      <div className="text-white">
        <h1 className="text-3xl font-bold mb-4">System Settings</h1>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-500">Error loading settings: {result.error}</p>
        </div>
      </div>
    )
  }

  return <SettingsForm settings={result.data || []} />
}

