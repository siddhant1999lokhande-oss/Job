'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shuffle, Lock, RefreshCw, Star } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { cn, getPositionLabel } from '@/lib/utils'

interface PlayerCard {
  id: string
  name: string
  position?: string
  skillLevel?: string
  skillStars?: number
  reliabilityScore: number
  reliabilityTier: string
  teamId?: string | null
  isCaptain?: boolean
}

interface Team {
  id: string
  name: string
  color: string
  captainId?: string | null
  players: PlayerCard[]
}

interface TeamBuilderData {
  matchId: string
  matchTitle: string
  players: PlayerCard[]
  teams: Team[]
  isLocked: boolean
  balanceScore: number
}

type Mode = 'BALANCED' | 'RANDOM' | 'DRAFT'

const MODES: Mode[] = ['BALANCED', 'RANDOM', 'DRAFT']

function SkillStars({ count = 0 }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < count ? 'text-amber-400' : 'text-gray-700'} style={{ fontSize: 10 }}>★</span>
      ))}
    </div>
  )
}

function PlayerTile({
  player, isAssigned, onToggleCaptain, dragging,
}: {
  player: PlayerCard
  isAssigned: boolean
  onToggleCaptain?: () => void
  dragging?: boolean
}) {
  return (
    <div
      className={cn(
        'card p-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing select-none',
        dragging ? 'opacity-50' : '',
        isAssigned ? 'opacity-100' : 'border-gray-700',
      )}
    >
      <Avatar name={player.name} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-white text-xs font-semibold truncate">
          {player.isCaptain && '⭐ '}{player.name}
        </p>
        <div className="flex items-center gap-1.5">
          {player.position && (
            <span className="text-gray-500 text-[10px]">{player.position}</span>
          )}
          <SkillStars count={player.skillStars ?? 3} />
        </div>
      </div>
      {onToggleCaptain && (
        <button
          onClick={e => { e.stopPropagation(); onToggleCaptain() }}
          className={cn('w-5 h-5 rounded-full flex items-center justify-center', player.isCaptain ? 'text-amber-400' : 'text-gray-600')}
        >
          <Star className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

export default function TeamBuilderPage({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = use(params)
  const router = useRouter()
  const [data, setData] = useState<TeamBuilderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<Mode>('BALANCED')
  const [generating, setGenerating] = useState(false)
  const [locking, setLocking] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null)

  const token = typeof window !== 'undefined' ? localStorage.getItem('turfmate_token') : ''

  const fetchData = useCallback(async () => {
    if (!token) { router.push('/login'); return }
    try {
      const res = await fetch(`/api/admin/teams/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setData(await res.json())
    } catch {}
    finally { setLoading(false) }
  }, [matchId, router, token])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAutoGenerate = async () => {
    if (!data || !token) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/admin/teams/${matchId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }),
      })
      setData(await res.json())
    } catch {}
    finally { setGenerating(false) }
  }

  const handleLockTeams = async () => {
    if (!token) return
    setLocking(true)
    try {
      await fetch(`/api/admin/teams/${matchId}/lock`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setShowConfirmModal(false)
      fetchData()
    } catch {}
    finally { setLocking(false) }
  }

  const handleDragStart = (playerId: string) => setDraggedPlayerId(playerId)
  const handleDragEnd = () => setDraggedPlayerId(null)

  const handleDropToTeam = async (teamId: string) => {
    if (!draggedPlayerId || !token) return
    try {
      await fetch(`/api/admin/teams/${matchId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerId: draggedPlayerId, teamId }),
      })
      fetchData()
    } catch {}
    setDraggedPlayerId(null)
  }

  const handleDropToUnassigned = async () => {
    if (!draggedPlayerId || !token) return
    try {
      await fetch(`/api/admin/teams/${matchId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playerId: draggedPlayerId, teamId: null }),
      })
      fetchData()
    } catch {}
    setDraggedPlayerId(null)
  }

  const toggleCaptain = async (teamId: string, playerId: string) => {
    if (!token) return
    await fetch(`/api/admin/teams/${matchId}/captain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ teamId, playerId }),
    })
    fetchData()
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/2" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="card h-20" />)}
        </div>
      </div>
    )
  }

  if (!data) return null

  const unassigned = data.players.filter(p => !p.teamId)

  const getBalanceColor = (score: number) => {
    if (score >= 75) return 'text-emerald-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const whatsappMsg = encodeURIComponent(
    `⚽ Teams for *${data.matchTitle}*:\n\n` +
    data.teams.map(t =>
      `*${t.name}*\n${t.players.map(p => (p.isCaptain ? `⭐ ${p.name} (C)` : `• ${p.name}`)).join('\n')}`
    ).join('\n\n')
  )

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white text-base truncate">Team Builder</h1>
            <p className="text-gray-500 text-xs truncate">{data.matchTitle}</p>
          </div>
          {/* Balance Score */}
          <div className="text-right">
            <div className={`text-lg font-extrabold ${getBalanceColor(data.balanceScore)}`}>
              {data.balanceScore}%
            </div>
            <div className="text-gray-600 text-[10px]">Balance</div>
          </div>
        </div>

        {/* Mode + Actions */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5 flex-1">
            {MODES.map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                  mode === m ? 'bg-emerald-500 text-white' : 'text-gray-400',
                )}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={handleAutoGenerate}
            disabled={generating || data.isLocked}
            className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shuffle className="w-3.5 h-3.5" />}
            {generating ? 'Generating...' : 'Auto'}
          </button>
          {!data.isLocked ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-lg text-xs font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-gray-700 text-gray-400 px-3 py-2 rounded-lg text-xs">
              <Lock className="w-3.5 h-3.5" />
              Locked
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Teams */}
        <div className="grid grid-cols-2 gap-3">
          {data.teams.map(team => (
            <div
              key={team.id}
              className="card p-3"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDropToTeam(team.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 rounded-full border-2 border-gray-600 shrink-0" style={{ backgroundColor: team.color }} />
                <span className="text-white text-sm font-bold flex-1 truncate">{team.name}</span>
                <span className="text-gray-500 text-xs">{team.players.length}</span>
              </div>
              <div className="space-y-1.5 min-h-[60px]">
                {team.players.map(p => (
                  <div
                    key={p.id}
                    draggable={!data.isLocked}
                    onDragStart={() => handleDragStart(p.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <PlayerTile
                      player={p}
                      isAssigned
                      dragging={draggedPlayerId === p.id}
                      onToggleCaptain={data.isLocked ? undefined : () => toggleCaptain(team.id, p.id)}
                    />
                  </div>
                ))}
                {team.players.length === 0 && (
                  <div className="h-12 border-2 border-dashed border-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-600 text-xs">Drop here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Unassigned players */}
        {unassigned.length > 0 && (
          <div
            className="card p-3"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDropToUnassigned}
          >
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">
              Unassigned ({unassigned.length})
            </p>
            <div className="space-y-1.5">
              {unassigned.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={() => handleDragStart(p.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className={cn('card p-2.5 flex items-center gap-2 cursor-grab', draggedPlayerId === p.id && 'opacity-50')}>
                    <Avatar name={p.name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{p.name}</p>
                      <div className="flex items-center gap-1.5">
                        {p.position && <span className="text-gray-500 text-[10px]">{p.position}</span>}
                        <SkillStars count={p.skillStars ?? 3} />
                      </div>
                    </div>
                    <ReliabilityBadge score={p.reliabilityScore} tier={p.reliabilityTier} className="text-[10px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lock Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-2">Lock Teams?</h3>
            <p className="text-gray-400 text-sm mb-4">
              Teams will be locked and players will be notified. This cannot be undone.
            </p>

            {/* WhatsApp preview */}
            <div className="bg-gray-800 rounded-xl p-3 mb-4 text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-y-auto max-h-36">
              {data.teams.map(t =>
                `${t.name}:\n${t.players.map(p => (p.isCaptain ? `⭐ ${p.name} (C)` : `  • ${p.name}`)).join('\n')}`
              ).join('\n\n')}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 rounded-full border border-gray-700 text-gray-400 font-semibold text-sm"
              >
                Cancel
              </button>
              <a
                href={`https://wa.me/?text=${whatsappMsg}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 rounded-full bg-green-600 text-white font-semibold text-sm text-center"
              >
                Share on WhatsApp
              </a>
              <button
                onClick={handleLockTeams}
                disabled={locking}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {locking ? 'Locking...' : 'Lock Teams'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
