import { createClient } from '@/lib/supabase/server'
import { CarrierAssignmentsClient } from '@/components/carrier/carrier-assignments-client'

export const dynamic = 'force-dynamic'

export default async function CarrierAssignmentsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: loads } = await supabase
    .from('loads')
    .select('id, load_number, status, pickup_location, delivery_location, pickup_time, delivery_time, carrier_rate, rate_confirmed, commodity, equipment_type')
    .eq('carrier_id', userData?.company_id)
    .is('deleted_at', null)
    .order('rate_confirmed', { ascending: true })
    .order('created_at', { ascending: false })

  return <CarrierAssignmentsClient loads={loads || []} />
}

