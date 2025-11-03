'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Loader2 } from 'lucide-react'
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/app/actions/notifications'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  created_at: string
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const loadNotifications = async () => {
    setLoading(true)
    const result = await getNotifications(10)
    if (result.success) {
      setNotifications(result.data as Notification[])
    }
    const countResult = await getUnreadCount()
    if (countResult.success) {
      setUnreadCount(countResult.count)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
      )
    }
    if (notification.link) {
      router.push(notification.link)
    }
    setOpen(false)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    setUnreadCount(0)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bid':
        return 'bg-blue-500/10 text-blue-500'
      case 'shipment_request':
        return 'bg-green-500/10 text-green-500'
      case 'driver_activity':
        return 'bg-purple-500/10 text-purple-500'
      case 'status_update':
        return 'bg-yellow-500/10 text-yellow-500'
      default:
        return 'bg-gray-500/10 text-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bid':
        return '💰'
      case 'shipment_request':
        return '📦'
      case 'driver_activity':
        return '🚛'
      case 'status_update':
        return '🔔'
      default:
        return '📌'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-full p-2 text-gray-400 hover:bg-navy-lighter hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-12 z-20 w-96 rounded-lg border border-gray-700 bg-navy-light shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  <Check className="h-3 w-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : notifications.length > 0 ? (
                <div className="divide-y divide-gray-700">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left transition-colors hover:bg-navy-lighter ${
                        !notification.read ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg ${getTypeColor(notification.type)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-300' : 'text-white'}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary mt-1"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Bell className="mx-auto h-12 w-12 text-gray-600 mb-4" />
                  <p className="text-sm text-gray-400">No notifications yet</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-gray-700 p-3 text-center">
                <button
                  onClick={() => {
                    router.push('/dashboard')
                    setOpen(false)
                  }}
                  className="text-xs text-primary hover:text-primary/80"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

