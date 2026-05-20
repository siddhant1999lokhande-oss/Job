'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell, ChevronRight, Zap, TrendingUp, CreditCard, Trophy,
  Calendar, Users, MapPin, Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { formatMatchDate, formatMatchTime, formatCurrency } from '@/lib/utils'

interface UserData {
  id: string
  name: string
  reliabilityScore: number
  reliabilityTier: string
  currentStreak: number
  unreadNotifications: number
  stats: { matches: number; goals: number; mvp: number; winRate: number }
}

interface MatchSummary {
  id: string
  title: string
  date: string
  startTime: string
  venue: string
  format: string
  currentPlayers: number
  maxPlayers: number
  status: string
  costPerPlayer: number
  isJoined: boolean
}

interface Notification {
  id: string
  type: string
  message: string
  createdAt: string
  read: boolean
}

function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-2/3 mb-2" />
      <div className="h-3 bg-gray-700 rounded w-1/2" />
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<MatchSummary[]>([])
  const [recentActivity, setRecentActivity] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) {
      router.push('/login')
      return
    }
    const headers = { Authorization: `Bearer ${token}` }

    Promise.all([
      fetch('/api/auth/me', { headers }).then(r => r.json()),
      fetch('/api/matches?upcoming=true&limit=3', { headers }).then(r => r.json()),
      fetch('/api/notifications?limit=3', { headers }).then(r => r.json()),
    ])
      .then(([userData, matchesData, notifData]) => {
        setUser(userData)
        setUpcomingMatches(matchesData?.matches ?? [])
        setRecentActivity(notifData?.notifications ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  const getNotifTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      MATCH_REMINDER: '🏟️',
      PAYMENT_REQUEST: '💰',
      TEAM_ANNOUNCEMENT: '📢',
      MATCH_CANCELLED: '❌',
      OTP: '🔐',
    }
    return icons[type] ?? '📣'
  }

  const quickActions = [
    { label: 'Join Match', icon: Zap, href: '/matches', color: 'bg-emerald-500/10 text-emerald-400' },
    { label: 'My Stats', icon: TrendingUp, href: '/profile/stats', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Payments', icon: CreditCard, href: '/profile', color: 'bg-amber-500/10 text-amber-400' },
    { label: 'Leaderboard', icon: Trophy, href: '/leaderboard', color: 'bg-purple-500/10 text-purple-400' },
  ]

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-40 mb-1" />
              <div className="h-4 bg-gray-700 rounded w-24" />
            </div>
          ) : (
            <>
              <h1 className="text-xl font-extrabold text-white">
                Hey {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-gray-500 text-sm">Ready to play today?</p>
            </>
          )}
        </div>
        <Link href="/notifications" className="relative w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-700">
          <Bell className="w-5 h-5 text-gray-300" />
          {(user?.unreadNotifications ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
              {user!.unreadNotifications > 9 ? '9+' : user!.unreadNotifications}
            </span>
          )}
        </Link>
      </div>

      {/* Reliability Score Card */}
      {loading ? (
        <div className="card p-5 animate-pulse">
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4" />
              <div className="h-3 bg-gray-700 rounded w-1/2" />
              <div className="h-3 bg-gray-700 rounded w-2/3" />
            </div>
          </div>
        </div>
      ) : user && (
        <div className="card p-5">
          <div className="flex items-center gap-4">
            {/* Circular Progress */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${user.reliabilityScore} ${100 - user.reliabilityScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-lg font-extrabold ${getScoreColor(user.reliabilityScore)}`}>
                  {user.reliabilityScore}
                </span>
                <span className="text-gray-500 text-[10px]">score</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">Reliability Score</span>
              </div>
              <ReliabilityBadge score={user.reliabilityScore} tier={user.reliabilityTier} />
              <p className="text-gray-400 text-xs mt-2">
                🔥 <span className="text-white font-semibold">{user.currentStreak}</span> match streak
              </p>
              <p className="text-gray-600 text-xs mt-0.5">
                Show up consistently to improve your tier
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white">Upcoming Matches</h2>
          <Link href="/matches" className="flex items-center gap-1 text-emerald-400 text-sm">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {[1, 2].map(i => (
              <div key={i} className="card p-4 min-w-[220px] animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-700 rounded" />
              </div>
            ))}
          </div>
        ) : upcomingMatches.length === 0 ? (
          <div className="card p-6 text-center">
            <Calendar className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No upcoming matches</p>
            <Link href="/matches" className="text-emerald-400 text-sm font-medium mt-1 inline-block">
              Browse matches →
            </Link>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {upcomingMatches.map(match => (
              <Link
                key={match.id}
                href={`/matches/${match.id}`}
                className="card p-4 min-w-[220px] flex flex-col gap-2 hover:border-emerald-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-white text-sm line-clamp-1">{match.title}</span>
                  {match.isJoined && (
                    <Badge variant="success" className="shrink-0 text-[10px]">Joined</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{formatMatchDate(new Date(match.date))}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <Clock className="w-3 h-3" />
                    <span>{formatMatchTime(match.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{match.venue}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="info" className="text-[10px]">{match.format}</Badge>
                  <span className="text-gray-400 text-xs">
                    <Users className="w-3 h-3 inline mr-0.5" />
                    {match.currentPlayers}/{match.maxPlayers}
                  </span>
                </div>
                <div className="text-emerald-400 text-xs font-semibold">
                  {formatCurrency(match.costPerPlayer)} per player
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

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
              <span className="text-white text-sm font-medium">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-white">Recent Activity</h2>
          <Link href="/notifications" className="flex items-center gap-1 text-emerald-400 text-sm">
            See all <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="card p-4 text-center">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map(notif => (
              <div
                key={notif.id}
                className={`card p-3 flex items-start gap-3 ${!notif.read ? 'border-emerald-500/30 bg-emerald-500/5' : ''}`}
              >
                <span className="text-xl mt-0.5">{getNotifTypeIcon(notif.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm line-clamp-2">{notif.message}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {new Date(notif.createdAt).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                {!notif.read && <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
