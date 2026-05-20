'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  previousRank?: number
  playerId: string
  name: string
  avatar?: string
  score: number
  tier?: string
  reliabilityScore?: number
  reliabilityTier?: string
}

const TABS = [
  { id: 'reliability', label: 'Reliability', unit: 'pts' },
  { id: 'goals', label: 'Goals', unit: 'goals' },
  { id: 'attendance', label: 'Attendance', unit: '%' },
  { id: 'mvp', label: 'MVP', unit: 'MVPs' },
  { id: 'wins', label: 'Wins', unit: 'wins' },
] as const

type TabId = typeof TABS[number]['id']

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>
  if (rank === 2) return <span className="text-xl">🥈</span>
  if (rank === 3) return <span className="text-xl">🥉</span>
  return <span className="text-gray-500 font-bold text-sm w-8 text-center">{rank}</span>
}

function TrendIcon({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) return <Minus className="w-3.5 h-3.5 text-gray-600" />
  if (current < previous) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
  return <TrendingDown className="w-3.5 h-3.5 text-red-400" />
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabId>('reliability')
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string>('')

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }

    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await res.json()
      setData(d?.entries ?? [])

      const userStr = localStorage.getItem('turfmate_user')
      if (userStr) setMyId(JSON.parse(userStr).id ?? '')
    } catch {
      setData([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, router])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const currentTab = TABS.find(t => t.id === activeTab)!

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-white">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Top players in the community</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      {!loading && data.length >= 3 && (
        <div className="flex items-end justify-center gap-3 mb-6">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <Avatar name={data[1].name} src={data[1].avatar} size="md" />
            <div className="text-center">
              <p className="text-white text-xs font-bold truncate max-w-[72px]">{data[1].name.split(' ')[0]}</p>
              <p className="text-gray-400 text-xs">{data[1].score} {currentTab.unit}</p>
            </div>
            <div className="w-full bg-gray-700 rounded-t-lg h-14 flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="relative">
              <Avatar name={data[0].name} src={data[0].avatar} size="lg" />
              <span className="absolute -top-2 -right-1 text-sm">👑</span>
            </div>
            <div className="text-center">
              <p className="text-white text-sm font-bold truncate max-w-[80px]">{data[0].name.split(' ')[0]}</p>
              <p className="text-emerald-400 text-xs font-semibold">{data[0].score} {currentTab.unit}</p>
            </div>
            <div className="w-full bg-emerald-500/20 border border-emerald-500/30 rounded-t-lg h-20 flex items-center justify-center">
              <span className="text-2xl">🥇</span>
            </div>
          </div>
          {/* 3rd */}
          {data[2] && (
            <div className="flex flex-col items-center gap-2 flex-1">
              <Avatar name={data[2].name} src={data[2].avatar} size="md" />
              <div className="text-center">
                <p className="text-white text-xs font-bold truncate max-w-[72px]">{data[2].name.split(' ')[0]}</p>
                <p className="text-gray-400 text-xs">{data[2].score} {currentTab.unit}</p>
              </div>
              <div className="w-full bg-gray-700 rounded-t-lg h-10 flex items-center justify-center">
                <span className="text-2xl">🥉</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <span className="text-5xl mb-3">🏆</span>
          <p className="text-white font-bold">No data yet</p>
          <p className="text-gray-500 text-sm mt-1">Be the first to top the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map(entry => (
            <div
              key={entry.playerId}
              className={cn(
                'card p-3 flex items-center gap-3 transition-colors',
                entry.playerId === myId && 'border-emerald-500/40 bg-emerald-500/5',
              )}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center shrink-0">
                <RankDisplay rank={entry.rank} />
              </div>

              {/* Avatar */}
              <Avatar name={entry.name} src={entry.avatar} size="sm" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={cn('text-sm font-semibold truncate', entry.playerId === myId ? 'text-emerald-400' : 'text-white')}>
                    {entry.name}
                    {entry.playerId === myId && ' (You)'}
                  </p>
                </div>
                {activeTab === 'reliability' && entry.reliabilityTier && (
                  <ReliabilityBadge score={entry.reliabilityScore ?? 0} tier={entry.reliabilityTier} className="mt-0.5" />
                )}
              </div>

              {/* Score + Trend */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-white font-bold text-sm">
                  {entry.score}
                  <span className="text-gray-500 text-xs font-normal ml-0.5">{currentTab.unit}</span>
                </span>
                <TrendIcon current={entry.rank} previous={entry.previousRank} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
