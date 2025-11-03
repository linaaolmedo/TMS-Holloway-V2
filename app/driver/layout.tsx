import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const navItems = [
  { label: 'Driver Portal', href: '/driver', icon: 'LayoutDashboard' },
  { label: 'My Assignments', href: '/driver/assignments', icon: 'Truck' },
  { label: 'Upload POD', href: '/driver/upload-pod', icon: 'Upload' },
  { label: 'Messages', href: '/driver/messages', icon: 'MessageSquare' },
]

export default async function DriverLayout({
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
    .select('email, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-navy">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userEmail={userData?.email} userRole={userData?.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

