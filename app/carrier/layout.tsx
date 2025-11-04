import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const navItems = [
  { label: 'Load Board', href: '/carrier/load-board', icon: 'List' },
  { label: 'My Bids', href: '/carrier/bids', icon: 'Gavel' },
  { label: 'Assignments', href: '/carrier/assignments', icon: 'Truck' },
  { label: 'Upload POD', href: '/carrier/upload-pod', icon: 'Upload' },
]

export default async function CarrierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('email, role, company_id')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-navy">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userEmail={userData?.email} userRole={userData?.role} navItems={navItems} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

