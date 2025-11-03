'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  Truck,
  Building,
  Users,
  Zap,
  BarChart3,
  FileText,
  DollarSign,
  List,
  Gavel,
  Upload,
  MessageSquare,
  FolderOpen,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  navItems: NavItem[]
  logo?: string
}

const iconMap = {
  LayoutDashboard,
  Package,
  Truck,
  Building,
  Users,
  Zap,
  BarChart3,
  FileText,
  DollarSign,
  List,
  Gavel,
  Upload,
  MessageSquare,
  FolderOpen,
}

export function Sidebar({ navItems, logo = '/bulkflow_TMS_true_transparent.png' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-gray-700 bg-navy-light">
      <div className="flex h-16 items-center justify-center border-b border-gray-700 px-4">
        <div className="relative h-12 w-full">
          <Image
            src={logo}
            alt="BulkFlow TMS"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap]
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-navy-lighter hover:text-white'
              )}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

