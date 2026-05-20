'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, ChevronRight } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { formatMatchDate, getPositionLabel } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string
  phone: string
  preferredPosition?: string
  reliabilityScore: number
  reliabilityTier: string
  stats: { matches: number; goals: number; mvp: number; winRate: number }
  recentMatches: Array<{
    id: string
    title: string
    date: string
    result: 'W' | 'L' | 'D' | null
    attendanceStatus: string
  }>
  badges: Array<{ id: string; name: string; icon: string; earnedAt: string }>
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4 flex flex-col items-center gap-1">
      <span className="text-2xl font-extrabold text-white">{value}</span>
      <span className="text-gray-500 text-xs font-medium">{label}</span>
    </div>
  )
}

function getResultVariant(result: string | null) {
  if (result === 'W') return 'success'
  if (result === 'L') return 'danger'
  if (result === 'D') return 'warning'
  return 'default'
}

function getAttendanceVariant(status: string) {
  if (status === 'CONFIRMED') return 'success'
  if (status === 'CANCELLED') return 'danger'
  if (status === 'NO_SHOW') return 'danger'
  return 'warning'
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch('/api/auth/me?full=true', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[1,2,3,4].map(i => <div key={i} className="card h-16 animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-32">
        <p className="text-gray-400">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="relative">
            {/* Score ring */}
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90 absolute inset-0" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#374151" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="#10b981" strokeWidth="2.5"
                  strokeDasharray={`${profile.reliabilityScore} ${100 - profile.reliabilityScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar name={profile.name} size="lg" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h1 className="font-extrabold text-white text-lg truncate">{profile.name}</h1>
              <Link href="/profile/edit" className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                <Edit2 className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-0.5">+91 {profile.phone}</p>
            {profile.preferredPosition && (
              <p className="text-gray-400 text-xs mt-0.5">
                Preferred: <span className="text-emerald-400 font-medium">{getPositionLabel(profile.preferredPosition)}</span>
              </p>
            )}
            <div className="mt-2">
              <ReliabilityBadge score={profile.reliabilityScore} tier={profile.reliabilityTier} showScore />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div>
        <h2 className="font-bold text-white mb-3">My Stats</h2>
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="Matches" value={profile.stats.matches} />
          <StatBox label="Goals" value={profile.stats.goals} />
          <StatBox label="MVP" value={profile.stats.mvp} />
          <StatBox label="Win %" value={`${profile.stats.winRate}%`} />
        </div>
        <Link href="/profile/stats" className="flex items-center justify-center gap-1 mt-3 text-emerald-400 text-sm font-medium">
          View detailed stats <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Recent Matches */}
      <div>
        <h2 className="font-bold text-white mb-3">Recent Matches</h2>
        {profile.recentMatches.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-gray-500 text-sm">No matches yet</p>
            <Link href="/matches" className="text-emerald-400 text-sm mt-1 inline-block">Browse matches →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profile.recentMatches.map(m => (
              <Link
                key={m.id}
                href={`/matches/${m.id}`}
                className="card p-3 flex items-center gap-3 hover:border-gray-600 transition-colors"
              >
                <div className="text-center shrink-0 w-10">
                  <div className="text-sm font-bold text-white">
                    {new Date(m.date).getDate()}
                  </div>
                  <div className="text-gray-500 text-[10px]">
                    {new Date(m.date).toLocaleString('en-IN', { month: 'short' })}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{m.title}</p>
                  <p className="text-gray-500 text-xs">{formatMatchDate(new Date(m.date))}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.result && (
                    <Badge variant={getResultVariant(m.result)} className="text-[10px] w-6 h-6 flex items-center justify-center rounded-full p-0">
                      {m.result}
                    </Badge>
                  )}
                  <Badge variant={getAttendanceVariant(m.attendanceStatus)} className="text-[10px]">
                    {m.attendanceStatus}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      {profile.badges.length > 0 && (
        <div>
          <h2 className="font-bold text-white mb-3">Badges</h2>
          <div className="flex flex-wrap gap-2">
            {profile.badges.map(badge => (
              <div
                key={badge.id}
                className="card px-3 py-2 flex items-center gap-2 border-gray-700"
                title={`Earned ${formatMatchDate(new Date(badge.earnedAt))}`}
              >
                <span className="text-lg">{badge.icon}</span>
                <span className="text-white text-xs font-medium">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={() => {
          localStorage.removeItem('turfmate_token')
          localStorage.removeItem('turfmate_user')
          router.push('/login')
        }}
        className="w-full py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
      >
        Sign Out
      </button>
    </div>
  )
}
