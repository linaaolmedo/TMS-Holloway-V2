import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { MapPin, Package, Calendar, Truck as TruckIcon, CheckCircle } from 'lucide-react'
import { DriverStatusUpdate } from '@/components/driver/driver-status-update'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { MessageSquare, Upload } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DriverDashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch driver's assignments
  const { data: loads } = await supabase
    .from('loads')
    .select('*')
    .eq('driver_id', user!.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const currentAssignment = loads?.find(l => ['pending_pickup', 'in_transit'].includes(l.status))
  const activeAssignments = loads?.filter(l => ['pending_pickup', 'in_transit'].includes(l.status)).length || 0
  
  // Count deliveries today
  const today = new Date().toISOString().split('T')[0]
  const deliveriesToday = loads?.filter(l => 
    l.status === 'delivered' && 
    l.delivery_time?.startsWith(today)
  ).length || 0
  
  const totalCompleted = loads?.filter(l => l.status === 'delivered').length || 0

  // Get next assignment
  const nextAssignment = loads?.find(l => 
    l.status === 'pending_pickup' && 
    l.id !== currentAssignment?.id
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Driver Portal</h1>
        <p className="text-xs md:text-sm text-gray-400">View and manage your delivery assignments</p>
      </div>

      {/* Quick Actions - Mobile Friendly */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Link href="/driver/messages" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-gray-600">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Messages</span>
          </Button>
        </Link>
        <Link href="/driver/upload-pod" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-gray-600">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Upload POD</span>
          </Button>
        </Link>
        <Link href="/driver/assignments" className="flex-shrink-0">
          <Button variant="outline" size="sm" className="gap-2 border-gray-600">
            <TruckIcon className="h-4 w-4" />
            <span className="hidden sm:inline">All Assignments</span>
          </Button>
        </Link>
      </div>

      {/* Current Assignment Card */}
      {currentAssignment ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4 md:pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Current Assignment</p>
                  <h2 className="text-lg md:text-xl font-semibold text-white">{currentAssignment.load_number}</h2>
                  <Badge variant={currentAssignment.status} className="mt-1" />
                </div>
              </div>

              <div className="space-y-3 md:space-y-4">
                {/* Pickup */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-green-500/10 border border-green-500/20">
                  <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-green-500">Pickup Location</p>
                    <p className="text-sm md:text-base text-white mt-1 break-words">{currentAssignment.pickup_location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">{formatDate(currentAssignment.pickup_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="flex items-start gap-3 p-3 rounded-md bg-red-500/10 border border-red-500/20">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-red-500">Delivery Location</p>
                    <p className="text-sm md:text-base text-white mt-1 break-words">{currentAssignment.delivery_location}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <span className="text-xs text-gray-400">{formatDate(currentAssignment.delivery_time)}</span>
                    </div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 p-3 rounded-md bg-navy-lighter border border-gray-700">
                  <div>
                    <p className="text-xs text-gray-400">Commodity</p>
                    <p className="text-sm text-white truncate">{currentAssignment.commodity || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Equipment</p>
                    <p className="text-sm text-white truncate">{currentAssignment.equipment_type || 'N/A'}</p>
                  </div>
                  {currentAssignment.weight && (
                    <>
                      <div>
                        <p className="text-xs text-gray-400">Weight</p>
                        <p className="text-sm text-white">{currentAssignment.weight} {currentAssignment.weight_unit}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Comments/Instructions */}
                {currentAssignment.comments && (
                  <div className="p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
                    <p className="text-xs font-medium text-blue-400 mb-1">Special Instructions</p>
                    <p className="text-sm text-white whitespace-pre-wrap">{currentAssignment.comments}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Update Component */}
          <DriverStatusUpdate load={currentAssignment} />
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 md:py-16">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-gray-700">
                <TruckIcon className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">No Active Assignments</h3>
              <p className="text-xs md:text-sm text-gray-400 text-center max-w-md px-4">
                You don&apos;t have any active assignments at the moment. Check back soon for new loads.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Assignment Preview */}
      {nextAssignment && currentAssignment && (
        <Card className="border-amber-500/30">
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm md:text-base font-semibold text-white">Next Assignment</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">Load Number</p>
                  <p className="text-sm text-white font-medium">{nextAssignment.load_number}</p>
                </div>
                <Badge variant={nextAssignment.status} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Route</p>
                <p className="text-sm text-white truncate">
                  {nextAssignment.pickup_location} → {nextAssignment.delivery_location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-3 md:gap-6 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Active Assignments</p>
                <p className="text-2xl md:text-4xl font-bold text-white">{activeAssignments}</p>
              </div>
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-blue-500/10">
                <TruckIcon className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Completed Today</p>
                <p className="text-2xl md:text-4xl font-bold text-white">{deliveriesToday}</p>
              </div>
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 md:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-400">Total Completed</p>
                <p className="text-2xl md:text-4xl font-bold text-white">{totalCompleted}</p>
              </div>
              <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-purple-500/10">
                <Package className="h-6 w-6 md:h-8 md:w-8 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

