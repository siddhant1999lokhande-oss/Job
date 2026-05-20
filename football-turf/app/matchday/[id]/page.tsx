'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Plus, Minus, UserCheck, UserX, AlertTriangle, Trophy } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface MatchDayPlayer {
  id: string
  name: string
  teamId?: string
  teamName?: string
  attended?: boolean
  isLate?: boolean
  isSubstitute?: boolean
}

interface Announcement {
  id: string
  message: string
  type: 'INFO' | 'GOAL' | 'WARNING' | 'ALERT'
  createdAt: string
}

interface MatchDayData {
  id: string
  title: string
  teamAName: string
  teamBName: string
  teamAColor: string
  teamBColor: string
  scoreA: number
  scoreB: number
  status: string
  startTime: string
  players: MatchDayPlayer[]
  announcements: Announcement[]
  isAdmin: boolean
  elapsedSeconds?: number
}

function Timer({ startTime, status, elapsedSeconds = 0 }: { startTime: string; status: string; elapsedSeconds?: number }) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    const calc = () => {
      if (status === 'UPCOMING' || status === 'CONFIRMED') {
        const diff = new Date(startTime).getTime() - Date.now()
        if (diff <= 0) { setDisplay('Starting...'); return }
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        setDisplay(h > 0 ? `Starts in ${h}h ${m}m` : `Starts in ${m}m`)
      } else if (status === 'IN_PROGRESS') {
        const totalSec = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000) + elapsedSeconds
        const m = Math.floor(totalSec / 60)
        const s = totalSec % 60
        setDisplay(`${m}:${String(s).padStart(2, '0')}'`)
      } else {
        setDisplay('Full Time')
      }
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [startTime, status, elapsedSeconds])

  return (
    <div className={cn(
      'text-center',
      status === 'IN_PROGRESS' ? 'text-emerald-400' : 'text-gray-400',
    )}>
      <div className="flex items-center justify-center gap-1.5">
        <Clock className="w-4 h-4" />
        <span className="font-mono font-bold text-base">{display}</span>
      </div>
    </div>
  )
}

const getAnnouncementStyle = (type: string) => {
  switch (type) {
    case 'GOAL': return 'border-emerald-500/40 bg-emerald-500/5'
    case 'WARNING': return 'border-amber-500/40 bg-amber-500/5'
    case 'ALERT': return 'border-red-500/40 bg-red-500/5'
    default: return 'border-gray-700'
  }
}

const getAnnouncementIcon = (type: string) => {
  switch (type) {
    case 'GOAL': return '⚽'
    case 'WARNING': return '⚠️'
    case 'ALERT': return '🚨'
    default: return '📢'
  }
}

export default function MatchDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<MatchDayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [ending, setEnding] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('turfmate_token') : ''

  const fetchData = useCallback(async () => {
    if (!token) { router.push('/login'); return }
    try {
      const res = await fetch(`/api/matches/${id}/matchday`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch {}
    finally { setLoading(false) }
  }, [id, router, token])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000) // poll every 15s
    return () => clearInterval(interval)
  }, [fetchData])

  const updateScore = async (team: 'A' | 'B', delta: 1 | -1) => {
    if (!token || !data?.isAdmin) return
    setScoring(true)
    try {
      await fetch(`/api/matches/${id}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ team, delta }),
      })
      setData(prev => prev ? {
        ...prev,
        scoreA: team === 'A' ? Math.max(0, prev.scoreA + delta) : prev.scoreA,
        scoreB: team === 'B' ? Math.max(0, prev.scoreB + delta) : prev.scoreB,
      } : prev)
    } catch {}
    finally { setScoring(false) }
  }

  const toggleAttendance = async (playerId: string, attended: boolean) => {
    if (!token) return
    try {
      await fetch(`/api/matches/${id}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerId, attended }),
      })
      setData(prev => prev ? {
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, attended } : p),
      } : prev)
    } catch {}
  }

  const markLate = async (playerId: string) => {
    if (!token) return
    try {
      await fetch(`/api/matches/${id}/late`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerId }),
      })
      setData(prev => prev ? {
        ...prev,
        players: prev.players.map(p => p.id === playerId ? { ...p, isLate: true } : p),
      } : prev)
    } catch {}
  }

  const endMatch = async () => {
    if (!token) return
    setEnding(true)
    try {
      await fetch(`/api/matches/${id}/end`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      router.push(`/matches/${id}/mvp`)
    } catch {}
    finally { setEnding(false) }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/2 mx-auto" />
        <div className="card h-40" />
        <div className="card h-60" />
      </div>
    )
  }

  if (!data) return (
    <div className="max-w-md mx-auto flex flex-col items-center py-32">
      <p className="text-white font-bold">Match not found</p>
      <button onClick={() => router.back()} className="text-emerald-400 text-sm mt-2">Go back</button>
    </div>
  )

  const teamAPlayers = data.players.filter(p => p.teamId && p.teamName === data.teamAName)
  const teamBPlayers = data.players.filter(p => p.teamId && p.teamName === data.teamBName)

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-base truncate">{data.title}</h1>
          <Timer startTime={data.startTime} status={data.status} elapsedSeconds={data.elapsedSeconds} />
        </div>
        <Badge variant={data.status === 'IN_PROGRESS' ? 'warning' : 'info'}>
          {data.status === 'IN_PROGRESS' ? '🔴 LIVE' : data.status}
        </Badge>
      </div>

      {/* Scoreboard */}
      <div className="mx-4 mt-4 card p-6">
        <div className="flex items-center gap-4">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-gray-600" style={{ backgroundColor: data.teamAColor }} />
            <span className="text-white font-bold text-sm text-center">{data.teamAName}</span>
            <span className="text-5xl font-extrabold text-white">{data.scoreA}</span>
            {data.isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('A', -1)}
                  disabled={scoring || data.scoreA === 0 || data.status !== 'IN_PROGRESS'}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={() => updateScore('A', 1)}
                  disabled={scoring || data.status !== 'IN_PROGRESS'}
                  className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-gray-600 text-lg font-bold">vs</span>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-gray-600" style={{ backgroundColor: data.teamBColor }} />
            <span className="text-white font-bold text-sm text-center">{data.teamBName}</span>
            <span className="text-5xl font-extrabold text-white">{data.scoreB}</span>
            {data.isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateScore('B', -1)}
                  disabled={scoring || data.scoreB === 0 || data.status !== 'IN_PROGRESS'}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center disabled:opacity-30"
                >
                  <Minus className="w-3.5 h-3.5 text-white" />
                </button>
                <button
                  onClick={() => updateScore('B', 1)}
                  disabled={scoring || data.status !== 'IN_PROGRESS'}
                  className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center disabled:opacity-30"
                >
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* End match button */}
        {data.isAdmin && data.status === 'IN_PROGRESS' && (
          <button
            onClick={endMatch}
            disabled={ending}
            className="w-full mt-4 py-2.5 rounded-xl border border-amber-500/40 text-amber-400 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trophy className="w-4 h-4" />
            {ending ? 'Ending match...' : 'End Match & Vote MVP'}
          </button>
        )}
      </div>

      {/* Attendance */}
      <div className="mx-4 mt-4 space-y-3">
        <h2 className="font-bold text-white">Attendance</h2>
        <div className="grid grid-cols-2 gap-3">
          {[{ name: data.teamAName, players: teamAPlayers }, { name: data.teamBName, players: teamBPlayers }].map(team => (
            <div key={team.name} className="card p-3">
              <p className="text-gray-400 text-xs font-semibold uppercase mb-2">{team.name}</p>
              <div className="space-y-2">
                {team.players.map(p => (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs truncate">{p.name}</p>
                      {p.isLate && <span className="text-amber-400 text-[10px]">Late</span>}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toggleAttendance(p.id, true)}
                        className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-colors', p.attended === true ? 'bg-emerald-500' : 'bg-gray-700')}
                      >
                        <UserCheck className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => toggleAttendance(p.id, false)}
                        className={cn('w-6 h-6 rounded-full flex items-center justify-center transition-colors', p.attended === false ? 'bg-red-500' : 'bg-gray-700')}
                      >
                        <UserX className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {data.isAdmin && (
                <div className="mt-3 space-y-1">
                  {team.players.filter(p => p.attended !== false && !p.isLate).map(p => (
                    <button
                      key={p.id}
                      onClick={() => markLate(p.id)}
                      className="w-full flex items-center gap-1.5 text-amber-400 text-[10px] py-1 px-2 rounded hover:bg-amber-500/10 transition-colors"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Mark {p.name.split(' ')[0]} late
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sub request */}
        {data.isAdmin && (
          <button
            className="w-full card p-3 flex items-center gap-2 text-amber-400 hover:border-amber-500/40 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Request Emergency Substitute</span>
          </button>
        )}
      </div>

      {/* Live Announcements */}
      {data.announcements.length > 0 && (
        <div className="mx-4 mt-4 space-y-2">
          <h2 className="font-bold text-white">Live Updates</h2>
          {data.announcements.map(ann => (
            <div key={ann.id} className={cn('card p-3 flex items-start gap-2', getAnnouncementStyle(ann.type))}>
              <span className="text-lg mt-0.5">{getAnnouncementIcon(ann.type)}</span>
              <div className="flex-1">
                <p className="text-white text-sm">{ann.message}</p>
                <p className="text-gray-600 text-xs mt-0.5">
                  {new Date(ann.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
