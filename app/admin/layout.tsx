import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: 'LayoutDashboard' },
  { label: 'Users', href: '/admin/users', icon: 'Users' },
  { label: 'Companies', href: '/admin/companies', icon: 'Building' },
  { label: 'Audit Logs', href: '/admin/audit-logs', icon: 'FileText' },
  { label: 'Analytics', href: '/admin/analytics', icon: 'BarChart3' },
  { label: 'Security', href: '/admin/security', icon: 'Shield' },
  { label: 'Settings', href: '/admin/settings', icon: 'Settings' },
  { label: 'Data Tools', href: '/admin/data-tools', icon: 'Database' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login/dispatcher')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('email, role')
    .eq('id', user.id)
    .single()

  // Verify admin or executive role
  if (!userData || !['admin', 'executive'].includes(userData.role)) {
    // Redirect to appropriate portal based on role
    if (userData?.role === 'customer') {
      redirect('/customer')
    } else if (userData?.role === 'carrier') {
      redirect('/carrier')
    } else if (userData?.role === 'driver') {
      redirect('/driver')
    } else {
      redirect('/dashboard')
    }
  }

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

