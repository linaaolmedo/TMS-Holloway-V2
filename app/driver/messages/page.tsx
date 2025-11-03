import { createClient } from '@/lib/supabase/server'
import { MessagingInterface } from '@/components/driver/messaging-interface'

export const dynamic = 'force-dynamic'

export default async function DriverMessagesPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get the driver's most recent load to find their dispatcher
  const { data: loads } = await supabase
    .from('loads')
    .select('dispatcher_id')
    .eq('driver_id', user!.id)
    .not('dispatcher_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)

  const dispatcherId = loads?.[0]?.dispatcher_id || null

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Messages</h1>
        <p className="text-xs md:text-sm text-gray-400">Communicate with dispatch</p>
      </div>

      <MessagingInterface 
        currentUserId={user!.id} 
        dispatcherId={dispatcherId}
      />
    </div>
  )
}

