import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DriverUploadPODForm } from '@/components/driver/upload-pod-form'
import { Upload, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DriverUploadPODPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: loads } = await supabase
    .from('loads')
    .select('id, load_number, pickup_location, delivery_location, status')
    .eq('driver_id', user!.id)
    .in('status', ['in_transit', 'delivered'])
    .is('deleted_at', null)
    .order('delivery_time', { ascending: false })

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Upload className="h-6 w-6 md:h-8 md:w-8" />
          Upload POD
        </h1>
        <p className="text-xs md:text-sm text-gray-400">Upload proof of delivery photos or documents</p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 md:pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-400 mb-1">POD Requirements</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Take clear photos of signed delivery documents</li>
                <li>• Include all pages if multiple sheets</li>
                <li>• Ensure signatures and dates are visible</li>
                <li>• Upload immediately after delivery when possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Upload Proof of Delivery</CardTitle>
        </CardHeader>
        <CardContent>
          <DriverUploadPODForm loads={loads || []} />
        </CardContent>
      </Card>
    </div>
  )
}

