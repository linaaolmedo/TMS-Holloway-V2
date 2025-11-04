'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationsDropdown } from './notifications-dropdown'
import Link from 'next/link'
import Image from 'next/image'

interface HeaderProps {
  userEmail?: string
  userRole?: string
  navItems?: Array<{ label: string; href: string; icon: string }>
}

export function Header({ userEmail, userRole, navItems }: HeaderProps) {
  const [loading, setLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Show notifications only for dispatchers
  const showNotifications = userRole === 'dispatch'

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-700 bg-navy-light px-3 md:px-6">
        {/* Mobile Menu Button and Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="relative h-10 w-40">
            <Image
              src="/bulkflow_TMS_true_transparent.png"
              alt="BulkFlow TMS"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="hidden md:block flex-1"></div>

        <div className="flex items-center gap-2 md:gap-4">
          {showNotifications && <NotificationsDropdown />}

          <div className="hidden sm:flex items-center gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-primary text-white text-sm">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="text-xs md:text-sm">
              <div className="font-medium text-white">{userEmail}</div>
              <div className="text-gray-400 capitalize">{userRole}</div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            disabled={loading}
            className="gap-2 p-2 md:px-3"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && navItems && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute left-0 top-0 h-full w-64 bg-navy-light border-r border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex h-20 items-center justify-between border-b border-gray-700 px-4">
              <div className="relative h-16 w-full">
                <Image
                  src="/bulkflow_TMS_true_transparent.png"
                  alt="BulkFlow TMS"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 ml-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <nav className="flex-1 space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-navy-lighter hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Mobile User Info */}
            <div className="border-t border-gray-700 p-4 sm:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
                  {userEmail?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-white">{userEmail}</div>
                  <div className="text-gray-400 capitalize">{userRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

