'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAdminGuard } from '@/lib/use-admin-guard'
import { Badge } from '@/components/ui/badge'
import { formatMatchDate } from '@/lib/utils'

interface MatchRecord {
  matchId: string
  status: string
  match: { id: string; title: string; date: string; status: string }
}

interface PlayerInfo {
  name: string
  phone: string
  matchesPlayed: number
  noShows: number
}

function getAttendanceVariant(status: string): 'success' | 'danger' | 'warning' | 'default' {
  if (status === 'ATTENDED' || status === 'CONFIRMED') return 'success'
  if (status === 'NO_SHOW') return 'danger'
  if (status === 'CANCELLED') return 'warning'
  return 'default'
}

export default function AdminPlayerHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [player, setPlayer] = useState<PlayerInfo | null>(null)
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    const token = localStorage.getItem('turfmate_token')
    if (!token) return

    Promise.all([
      fetch(`/api/players/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`/api/players/${id}/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ])
      .then(([playerData, statsData]) => {
        setPlayer({
          name: playerData.name,
          phone: playerData.phone,
          matchesPlayed: statsData?.matchesPlayed ?? 0,
          noShows: statsData?.noShows ?? 0,
        })
        setMatches(statsData?.recentMatches ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, ready])

  if (!ready || loading) return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-2 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="card h-14" />)}
    </div>
  )

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg">{player?.name ?? 'Player'}</h1>
          <p className="text-gray-500 text-xs">+91 {player?.phone}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-white">{player?.matchesPlayed ?? 0}</p>
            <p className="text-gray-500 text-xs mt-1">Matches Played</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-red-400">{player?.noShows ?? 0}</p>
            <p className="text-gray-500 text-xs mt-1">No-shows</p>
          </div>
        </div>

        {/* Match history */}
        <div>
          <h2 className="font-bold text-white mb-3">Match History</h2>
          {matches.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-gray-500 text-sm">No match history yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map(m => (
                <div key={m.matchId} className="card p-3 flex items-center gap-3">
                  <div className="text-center shrink-0 w-9">
                    <p className="text-white text-sm font-bold">{new Date(m.match.date).getDate()}</p>
                    <p className="text-gray-500 text-[10px]">
                      {new Date(m.match.date).toLocaleString('en-IN', { month: 'short' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{m.match.title}</p>
                    <p className="text-gray-600 text-xs">{formatMatchDate(new Date(m.match.date))}</p>
                  </div>
                  <Badge variant={getAttendanceVariant(m.status)} className="text-[10px] shrink-0">
                    {m.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
