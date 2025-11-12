import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Upload, MessageSquare } from 'lucide-react'
import { DriverAssignmentsClient } from '@/components/driver/driver-assignments-client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function DriverAssignmentsPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: loads } = await supabase
    .from('loads')
    .select('*')
    .eq('driver_id', user!.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const activeLoads = loads?.filter(l => ['pending_pickup', 'in_transit'].includes(l.status)) || []
  const completedLoads = loads?.filter(l => !['pending_pickup', 'in_transit'].includes(l.status)) || []

  return (
    <div className="space-y-4 md:space-y-6 pb-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">My Assignments</h1>
        <p className="text-xs md:text-sm text-gray-400">View all your assignments - active and completed</p>
      </div>

      {/* Quick Actions - Mobile Friendly */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        <Link href="/driver/upload-pod" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-gray-600 whitespace-nowrap">
            <Upload className="h-4 w-4" />
            <span>Upload POD</span>
          </Button>
        </Link>
        <Link href="/driver/messages" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-gray-600 whitespace-nowrap">
            <MessageSquare className="h-4 w-4" />
            <span>Messages</span>
          </Button>
        </Link>
      </div>

      {/* Client-side component with maps */}
      <DriverAssignmentsClient activeLoads={activeLoads} completedLoads={completedLoads} />

      {/* No Assignments */}
      {loads && loads.length === 0 && (
        <Card>
          <CardContent className="py-12 md:py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-gray-700">
                <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">No Assignments</h3>
              <p className="text-xs md:text-sm text-gray-400 text-center max-w-md px-4">
                You don&apos;t have any assignments yet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

