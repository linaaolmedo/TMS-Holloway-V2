import { createClient } from '@/lib/supabase/server'
import { CustomerDocumentsClient } from '@/components/customer/customer-documents-client'

export const dynamic = 'force-dynamic'

export default async function CustomerDocumentsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user!.id)
    .single()

  const { data: documents } = await supabase
    .from('documents')
    .select(`
      *,
      load:loads!inner(load_number, customer_id)
    `)
    .eq('load.customer_id', userData?.company_id)
    .order('uploaded_at', { ascending: false })

  return <CustomerDocumentsClient documents={documents || []} />
}

