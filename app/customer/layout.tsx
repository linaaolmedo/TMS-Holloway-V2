import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

const navItems = [
  { label: 'My Shipments', href: '/customer/shipments', icon: 'Package' },
  { label: 'Invoices', href: '/customer/invoices', icon: 'FileText' },
  { label: 'Documents', href: '/customer/documents', icon: 'FolderOpen' },
]

export default async function CustomerLayout({
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
        <Header userEmail={userData?.email} userRole={userData?.role} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

