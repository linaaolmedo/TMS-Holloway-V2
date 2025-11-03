import { createClient } from '@/lib/supabase/server'
import { CarriersPageClient } from '@/components/carriers/carriers-page-client'

export const dynamic = 'force-dynamic'

export default async function CarriersPage() {
  const supabase = await createClient()

  const { data: carriers } = await supabase
    .from('companies')
    .select('*')
    .eq('type', 'carrier')
    .order('name')

  return <CarriersPageClient carriers={carriers || []} />
}
