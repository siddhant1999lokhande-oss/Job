'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Users, Calendar, DollarSign, AlertTriangle,
  Plus, Settings, Send, ChevronRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { useAdminGuard } from '@/lib/use-admin-guard'

interface AdminStats {
  totalPlayers: number
  upcomingMatches: number
  totalRevenue: number
  unpaidAmount: number
}

interface ActivityItem {
  id: string
  type: string
  message: string
  createdAt: string
  severity?: 'info' | 'warning' | 'error'
}

function StatCard({ icon: Icon, label, value, color, subtext }: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
  subtext?: string
}) {
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
      <p className="text-gray-500 text-xs mt-1">{label}</p>
      {subtext && <p className="text-gray-600 text-[10px] mt-0.5">{subtext}</p>}
    </div>
  )
}

const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    MATCH_CREATED: '🏟️',
    PLAYER_JOINED: '👤',
    PAYMENT_RECEIVED: '💰',
    MATCH_CANCELLED: '❌',
    PLAYER_REMOVED: '🚫',
    TEAM_LOCKED: '🔒',
    ANNOUNCEMENT: '📢',
  }
  return icons[type] ?? '📣'
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { ready } = useAdminGuard()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch('/api/admin/stats', { headers }).then(r => r.json()),
      fetch('/api/admin/activity', { headers }).then(r => r.json()),
    ])
      .then(([statsData, activityData]) => {
        setStats(statsData)
        setActivity(activityData?.items ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router, ready])

  if (!ready) return null

  const quickActions = [
    { label: 'Create Match', icon: Plus, href: '/matches/create', color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'Manage Players', icon: Users, href: '/admin/players', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'View Payments', icon: DollarSign, href: '/admin/payments', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Announcement', icon: Send, href: '/admin/announce', color: 'bg-purple-500/10 text-purple-400' },
  ]

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your football community</p>
        </div>
        <Link href="/admin/settings" className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
          <Settings className="w-4 h-4 text-gray-400" />
        </Link>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Users} label="Total Players" value={stats.totalPlayers}
            color="bg-blue-500/10 text-blue-400"
          />
          <StatCard
            icon={Calendar} label="Upcoming Matches" value={stats.upcomingMatches}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <StatCard
            icon={DollarSign} label="Total Revenue" value={formatCurrency(stats.totalRevenue)}
            color="bg-amber-500/10 text-amber-400"
          />
          <StatCard
            icon={AlertTriangle} label="Unpaid" value={formatCurrency(stats.unpaidAmount)}
            color="bg-red-500/10 text-red-400"
            subtext="Needs collection"
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div>
        <h2 className="font-bold text-white mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="card p-4 flex flex-col items-center gap-2 hover:border-gray-600 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-white text-sm font-medium text-center">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Manage Links */}
      <div>
        <h2 className="font-bold text-white mb-3">Management</h2>
        <div className="space-y-2">
          {[
            { href: '/admin/matches', label: 'All Matches', desc: 'Edit, cancel, duplicate matches', icon: '🏟️' },
            { href: '/admin/players', label: 'Player List', desc: 'View and manage all players', icon: '👥' },
            { href: '/admin/payments', label: 'Payments', desc: 'Track and confirm payments', icon: '💰' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="card p-4 flex items-center gap-3 hover:border-gray-600 transition-colors"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-gray-500 text-xs">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="font-bold text-white mb-3">Recent Activity</h2>
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="card h-14 animate-pulse" />)}
          </div>
        ) : activity.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map(item => (
              <div key={item.id} className="card p-3 flex items-start gap-3">
                <span className="text-xl mt-0.5">{getActivityIcon(item.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm line-clamp-2">{item.message}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {new Date(item.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {item.severity === 'warning' && (
                  <Badge variant="warning" className="text-[10px] shrink-0">Warning</Badge>
                )}
                {item.severity === 'error' && (
                  <Badge variant="danger" className="text-[10px] shrink-0">Alert</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
