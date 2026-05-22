'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

const TYPE_ICONS: Record<string, string> = {
  ANNOUNCEMENT: '📢',
  MATCH_REMINDER: '🏟️',
  MATCH_CANCELLED: '❌',
  TEAM_ASSIGNED: '👥',
  MATCH_CONFIRMED: '✅',
  CAPTAIN_ASSIGNED: '⭐',
  PAYMENT_REQUEST: '💰',
  OTP: '🔐',
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }

    fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setNotifications(data?.notifications ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Mark all as read
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  }, [router])

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Notifications</h1>
        {unreadCount > 0 && (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-1 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="card h-16 animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-bold">No notifications yet</p>
            <p className="text-gray-500 text-sm text-center">
              You&apos;ll be notified when matches are confirmed, teams are set, or announcements are made.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={cn(
                  'card p-4 flex items-start gap-3 transition-colors',
                  !notif.isRead && 'border-emerald-500/30 bg-emerald-500/5',
                )}
              >
                <span className="text-xl shrink-0 mt-0.5">
                  {TYPE_ICONS[notif.type] ?? '📣'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-sm font-semibold">{notif.title}</p>
                    {!notif.isRead && <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />}
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{notif.body}</p>
                  <p className="text-gray-600 text-[10px] mt-1.5">
                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
