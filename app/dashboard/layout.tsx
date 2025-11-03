import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Loads', href: '/dashboard/loads', icon: 'Package' },
  { label: 'Carriers', href: '/dashboard/carriers', icon: 'Truck' },
  { label: 'Fleet', href: '/dashboard/fleet', icon: 'Building' },
  { label: 'Customers', href: '/dashboard/customers', icon: 'Users' },
  { label: 'Smart Dispatch', href: '/dashboard/smart-dispatch', icon: 'Zap' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
  { label: 'Billing', href: '/dashboard/billing', icon: 'DollarSign' },
  { label: 'Reporting', href: '/dashboard/reporting', icon: 'FileText' },
]

export default async function DashboardLayout({
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

