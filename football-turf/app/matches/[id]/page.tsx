'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, MapPin, Clock, Calendar, Users, DollarSign,
  CheckCircle, XCircle, Clock3, ExternalLink, Share2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { formatMatchDate, formatMatchTime, formatCurrency, cn } from '@/lib/utils'

interface Player {
  id: string
  name: string
  status: string
  position?: string
  reliabilityScore: number
  reliabilityTier: string
  hasPaid: boolean
  isWaitlisted?: boolean
  waitlistPosition?: number
}

interface Team {
  id: string
  name: string
  color: string
  players: Array<Player & { isCaptain: boolean }>
}

interface MatchDetail {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: string
  venueAddress?: string
  googleMapsUrl?: string
  format: string
  maxPlayers: number
  currentPlayers: number
  costPerPlayer: number
  status: string
  matchType: string
  notes?: string
  jerseyColorA?: string
  jerseyColorB?: string
  confirmationDeadline?: string
  isJoined: boolean
  myStatus?: string
  myPaymentStatus?: string
  waitlistPosition?: number
  isAdmin: boolean
  teams: Team[]
  players: Player[]
  upiId?: string
  upiQrCode?: string
  weather?: { condition: string; temp: number; icon: string }
}

const TABS = ['Overview', 'Teams', 'Players', 'Payments'] as const
type Tab = typeof TABS[number]

function getPlayerStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'REGISTERED': return 'warning'
    case 'CANCELLED': return 'danger'
    default: return 'default'
  }
}

function CountdownTimer({ deadline }: { deadline: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`)
    }
    calc()
    const id = setInterval(calc, 60000)
    return () => clearInterval(id)
  }, [deadline])

  return <span className="text-amber-400 font-bold">{timeLeft}</span>
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [match, setMatch] = useState<MatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch(`/api/matches/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setMatch)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, router])

  const handleAction = async (action: 'join' | 'leave' | 'confirm' | 'checkin') => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) return
    setActionLoading(true)
    try {
      await fetch(`/api/matches/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const res = await fetch(`/api/matches/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setMatch(await res.json())
    } catch {}
    finally { setActionLoading(false) }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto animate-pulse">
        <div className="h-48 bg-gray-800" />
        <div className="p-4 space-y-3">
          <div className="h-6 bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-700 rounded w-1/2" />
          <div className="h-4 bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center justify-center py-32">
        <p className="text-white font-bold text-lg">Match not found</p>
        <button onClick={() => router.back()} className="text-emerald-400 text-sm mt-2">Go back</button>
      </div>
    )
  }

  const isFull = match.currentPlayers >= match.maxPlayers

  const renderActionButton = () => {
    if (match.status === 'CANCELLED') return null
    if (match.status === 'COMPLETED') {
      return <button className="btn-primary w-full py-3 opacity-50 cursor-not-allowed" disabled>Match Completed</button>
    }
    if (match.myStatus === 'CONFIRMED' && match.status === 'CONFIRMED') {
      return (
        <button onClick={() => handleAction('checkin')} disabled={actionLoading} className="btn-primary w-full py-3">
          {actionLoading ? 'Processing...' : '✓ Check In'}
        </button>
      )
    }
    if (match.myStatus === 'REGISTERED') {
      return (
        <div className="flex gap-2">
          <button onClick={() => handleAction('confirm')} disabled={actionLoading} className="btn-primary flex-1 py-3">
            {actionLoading ? '...' : 'Confirm Attendance'}
          </button>
          <button onClick={() => handleAction('leave')} disabled={actionLoading} className="flex-1 py-3 rounded-full border border-red-500/40 text-red-400 font-semibold text-sm">
            Leave
          </button>
        </div>
      )
    }
    if (match.isJoined) {
      return (
        <button onClick={() => handleAction('leave')} disabled={actionLoading} className="w-full py-3 rounded-full border border-red-500/40 text-red-400 font-semibold text-sm">
          {actionLoading ? 'Processing...' : 'Leave Match'}
        </button>
      )
    }
    if (isFull) {
      return (
        <button onClick={() => handleAction('join')} disabled={actionLoading} className="btn-outline w-full py-3">
          {actionLoading ? 'Joining waitlist...' : 'Join Waitlist'}
        </button>
      )
    }
    return (
      <button onClick={() => handleAction('join')} disabled={actionLoading} className="btn-primary w-full py-3">
        {actionLoading ? 'Joining...' : 'Join Match'}
      </button>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      {/* Header banner */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-emerald-900/30 pt-12 pb-6 px-4">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-gray-800/80 flex items-center justify-center border border-gray-700"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => navigator.share?.({ title: match.title, url: location.href })}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gray-800/80 flex items-center justify-center border border-gray-700"
        >
          <Share2 className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h1 className="text-xl font-extrabold text-white leading-tight mb-2">{match.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant={match.status === 'CONFIRMED' ? 'success' : match.status === 'UPCOMING' ? 'info' : 'default'}>
                {match.status}
              </Badge>
              <Badge variant="default">{match.format}</Badge>
              {match.matchType && <Badge variant="default">{match.matchType}</Badge>}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold text-emerald-400">{match.currentPlayers}</div>
            <div className="text-gray-500 text-xs">/ {match.maxPlayers} players</div>
          </div>
        </div>
      </div>

      {/* Match info card */}
      <div className="px-4 -mt-1">
        <div className="card p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white">{formatMatchDate(new Date(match.date))}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white">{formatMatchTime(match.startTime)} – {formatMatchTime(match.endTime)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white flex-1">{match.venue}</span>
            {match.googleMapsUrl && (
              <a href={match.googleMapsUrl} target="_blank" rel="noreferrer" className="text-emerald-400">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-white">{formatCurrency(match.costPerPlayer)} per player</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mt-4 px-4">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === tab
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-300',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 space-y-4">
        {/* OVERVIEW */}
        {activeTab === 'Overview' && (
          <>
            {match.weather && (
              <div className="card p-3 flex items-center gap-3">
                <span className="text-2xl">{match.weather.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{match.weather.condition}</p>
                  <p className="text-gray-400 text-xs">{match.weather.temp}°C on match day</p>
                </div>
              </div>
            )}

            {match.confirmationDeadline && (
              <div className="card p-3 flex items-center gap-3 border-amber-500/30">
                <Clock3 className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Confirm by</p>
                  <p className="text-gray-400 text-xs">
                    <CountdownTimer deadline={match.confirmationDeadline} /> remaining
                  </p>
                </div>
              </div>
            )}

            {match.notes && (
              <div className="card p-4">
                <h3 className="font-semibold text-white text-sm mb-2">Match Notes</h3>
                <p className="text-gray-400 text-sm whitespace-pre-wrap">{match.notes}</p>
              </div>
            )}

            {(match.jerseyColorA || match.jerseyColorB) && (
              <div className="card p-4">
                <h3 className="font-semibold text-white text-sm mb-3">Jersey Colors</h3>
                <div className="flex gap-4">
                  {match.jerseyColorA && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-600" style={{ backgroundColor: match.jerseyColorA }} />
                      <span className="text-gray-400 text-xs">Team A</span>
                    </div>
                  )}
                  {match.jerseyColorB && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-gray-600" style={{ backgroundColor: match.jerseyColorB }} />
                      <span className="text-gray-400 text-xs">Team B</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {match.waitlistPosition && (
              <div className="card p-3 border-amber-500/30 flex items-center gap-2">
                <span className="text-amber-400 text-lg">⏳</span>
                <p className="text-amber-400 text-sm font-medium">
                  You&apos;re #{match.waitlistPosition} on the waitlist
                </p>
              </div>
            )}

            {/* Action button */}
            <div className="pt-2">
              {renderActionButton()}
            </div>
          </>
        )}

        {/* TEAMS */}
        {activeTab === 'Teams' && (
          <>
            {match.teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="text-4xl mb-3">🎲</span>
                <p className="text-white font-bold">Teams TBD</p>
                <p className="text-gray-500 text-sm mt-1">Teams will be announced before the match</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {match.teams.map(team => (
                  <div key={team.id} className="card p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-gray-600"
                        style={{ backgroundColor: team.color }}
                      />
                      <span className="font-bold text-white text-sm">{team.name}</span>
                    </div>
                    <div className="space-y-2">
                      {team.players.map(p => (
                        <div key={p.id} className="flex items-center gap-2">
                          <Avatar name={p.name} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">
                              {p.isCaptain && '⭐ '}{p.name}
                            </p>
                            {p.position && (
                              <p className="text-gray-500 text-[10px]">{p.position}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* PLAYERS */}
        {activeTab === 'Players' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 px-1 mb-3">
              <span>{match.currentPlayers} confirmed</span>
              <span>{match.maxPlayers - match.currentPlayers} slots left</span>
            </div>
            {match.players.map(player => (
              <div key={player.id} className="card p-3 flex items-center gap-3">
                <Avatar name={player.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{player.name}</p>
                  <ReliabilityBadge score={player.reliabilityScore} tier={player.reliabilityTier} className="mt-0.5" />
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={getPlayerStatusVariant(player.status)} className="text-[10px]">
                    {player.status}
                  </Badge>
                  {player.hasPaid ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              </div>
            ))}

            {match.players.filter(p => p.isWaitlisted).length > 0 && (
              <>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide pt-2 px-1">Waitlist</p>
                {match.players.filter(p => p.isWaitlisted).map(player => (
                  <div key={player.id} className="card p-3 flex items-center gap-3 opacity-60">
                    <Avatar name={player.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{player.name}</p>
                      <p className="text-amber-400 text-xs">#{player.waitlistPosition} on waitlist</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === 'Payments' && (
          <div className="space-y-4">
            {match.isAdmin ? (
              <>
                <div className="card p-4">
                  <h3 className="font-semibold text-white text-sm mb-3">Payment Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cost per player</span>
                      <span className="text-white font-semibold">{formatCurrency(match.costPerPlayer)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total players</span>
                      <span className="text-white">{match.currentPlayers}</span>
                    </div>
                    <div className="border-t border-gray-700 pt-2 flex justify-between text-sm">
                      <span className="text-gray-400">Total revenue</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(match.costPerPlayer * match.currentPlayers)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Unpaid</span>
                      <span className="text-red-400 font-semibold">
                        {formatCurrency(match.costPerPlayer * match.players.filter(p => !p.hasPaid).length)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {match.players.map(p => (
                    <div key={p.id} className="card p-3 flex items-center gap-3">
                      <Avatar name={p.name} size="sm" />
                      <span className="text-white text-sm flex-1">{p.name}</span>
                      {p.hasPaid ? (
                        <Badge variant="success" className="text-[10px]">Paid</Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px]">Unpaid</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="card p-4 text-center space-y-4">
                <p className="text-white font-bold">My Payment</p>
                <div className="text-3xl font-extrabold text-emerald-400">
                  {formatCurrency(match.costPerPlayer)}
                </div>
                {match.myPaymentStatus === 'PAID' ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Payment confirmed</span>
                  </div>
                ) : (
                  <>
                    {match.upiId && (
                      <div className="bg-gray-900 rounded-xl p-3">
                        <p className="text-gray-400 text-xs mb-1">Pay via UPI</p>
                        <p className="text-white font-mono text-sm">{match.upiId}</p>
                      </div>
                    )}
                    {match.upiQrCode && (
                      <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={match.upiQrCode} alt="UPI QR" className="w-40 h-40 rounded-xl" />
                      </div>
                    )}
                    <button className="btn-primary w-full py-3">Mark as Paid</button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
