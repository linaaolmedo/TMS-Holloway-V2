import { createClient } from '@/lib/supabase/server'
import SmartDispatchWithMap from '@/components/smart-dispatch/smart-dispatch-with-map'

export const dynamic = 'force-dynamic'

export default async function SmartDispatchPage() {
  const supabase = await createClient()

  // Get pending/posted loads
  const { data: loads } = await supabase
    .from('loads')
    .select('id, load_number, pickup_location, delivery_location, status, equipment_type')
    .in('status', ['pending', 'posted', 'pending_pickup'])
    .limit(50)

  // Get available drivers
  const { data: drivers } = await supabase
    .from('users')
    .select('id, name')
    .eq('role', 'driver')
    .limit(50)

  const formattedLoads = (loads || []).map(load => ({
    id: load.id,
    load_number: load.load_number || `Load #${load.id}`,
    pickup_location: load.pickup_location || '',
    delivery_location: load.delivery_location || '',
    status: load.status,
    equipment_type: load.equipment_type || undefined,
  }))

  const formattedDrivers = (drivers || []).map(driver => ({
    id: driver.id,
    name: driver.name || 'Unknown Driver',
    available: true, // TODO: Check actual availability
  }))

  return <SmartDispatchWithMap loads={formattedLoads} drivers={formattedDrivers} />
}

