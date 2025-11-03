import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UploadPODForm } from '@/components/carrier/upload-pod-form'

export const dynamic = 'force-dynamic'

export default async function UploadPODPage() {
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
    .select('id, load_number, pickup_location, delivery_location')
    .eq('carrier_id', userData?.company_id)
    .in('status', ['in_transit', 'delivered'])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Upload POD</h1>
        <p className="text-sm text-gray-400">Upload proof of delivery documents</p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Upload Proof of Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadPODForm loads={loads || []} />
        </CardContent>
      </Card>
    </div>
  )
}

