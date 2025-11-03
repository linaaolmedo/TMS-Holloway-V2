'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NotificationsDropdown } from './notifications-dropdown'

interface HeaderProps {
  userEmail?: string
  userRole?: string
}

export function Header({ userEmail, userRole }: HeaderProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
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
    <header className="flex h-16 items-center justify-between border-b border-gray-700 bg-navy-light px-6">
      <div className="flex-1"></div>

      <div className="flex items-center gap-4">
        {showNotifications && <NotificationsDropdown />}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            {userEmail?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="text-sm">
            <div className="font-medium text-white">{userEmail}</div>
            <div className="text-gray-400 capitalize">{userRole}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={loading}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  )
}

