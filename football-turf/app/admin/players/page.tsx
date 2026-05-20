'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Send, MoreVertical, History, UserX, Edit2 } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { ReliabilityBadge } from '@/components/reliability-badge'
import { Badge } from '@/components/ui/badge'
import { getPositionLabel, cn } from '@/lib/utils'

interface AdminPlayer {
  id: string
  name: string
  phone: string
  skillLevel?: string
  preferredPosition?: string
  reliabilityScore: number
  reliabilityTier: string
  matchesPlayed: number
  isActive: boolean
}

const SKILL_FILTERS = ['All', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']

export default function AdminPlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<AdminPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [skillFilter, setSkillFilter] = useState('All')
  const [selected, setSelected] = useState<string[]>([])
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)
  const [showAnnounce, setShowAnnounce] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const [sending, setSending] = useState(false)

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (skillFilter !== 'All') params.set('skillLevel', skillFilter)
    try {
      const res = await fetch(`/api/admin/players?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPlayers(data?.players ?? [])
    } catch { setPlayers([]) }
    finally { setLoading(false) }
  }, [search, skillFilter, router])

  useEffect(() => {
    const t = setTimeout(fetchPlayers, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchPlayers, search])

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const selectAll = () => {
    setSelected(selected.length === players.length ? [] : players.map(p => p.id))
  }

  const sendAnnouncement = async () => {
    if (!announcement.trim()) return
    setSending(true)
    const token = localStorage.getItem('turfmate_token')
    try {
      await fetch('/api/admin/announce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: announcement, playerIds: selected.length ? selected : undefined }),
      })
      setShowAnnounce(false)
      setAnnouncement('')
      setSelected([])
    } catch {}
    finally { setSending(false) }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950" onClick={() => setActionMenuId(null)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Players</h1>
        {selected.length > 0 && (
          <button
            onClick={() => setShowAnnounce(true)}
            className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-medium"
          >
            <Send className="w-3 h-3" />
            Announce ({selected.length})
          </button>
        )}
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Skill Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {SKILL_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setSkillFilter(s)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                skillFilter === s
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400',
              )}
            >
              {s === 'All' ? 'All Skills' : s}
            </button>
          ))}
        </div>

        {/* Select all bar */}
        {!loading && players.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <button onClick={selectAll} className="text-emerald-400 font-medium">
              {selected.length === players.length ? 'Deselect all' : `Select all (${players.length})`}
            </button>
            {selected.length > 0 && (
              <span className="text-gray-500">{selected.length} selected</span>
            )}
          </div>
        )}

        {/* Players list */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="card h-20 animate-pulse" />)}
          </div>
        ) : players.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">👥</span>
            <p className="text-white font-bold">No players found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <div
                key={player.id}
                className={cn(
                  'card overflow-hidden transition-colors',
                  selected.includes(player.id) && 'border-emerald-500/40 bg-emerald-500/5',
                )}
                onClick={(e) => { e.stopPropagation(); setActionMenuId(null) }}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(player.id) }}
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                      selected.includes(player.id)
                        ? 'bg-emerald-500 border-emerald-500'
                        : 'border-gray-600',
                    )}
                  >
                    {selected.includes(player.id) && (
                      <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <Avatar name={player.name} size="sm" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold truncate">{player.name}</p>
                      {!player.isActive && <Badge variant="danger" className="text-[10px]">Inactive</Badge>}
                    </div>
                    <p className="text-gray-500 text-xs">+91 {player.phone}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <ReliabilityBadge score={player.reliabilityScore} tier={player.reliabilityTier} className="text-[10px]" />
                      {player.preferredPosition && (
                        <span className="text-gray-600 text-[10px]">
                          {getPositionLabel(player.preferredPosition)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-gray-400 text-xs">{player.matchesPlayed} matches</span>
                    {player.skillLevel && (
                      <Badge variant="default" className="text-[10px]">{player.skillLevel}</Badge>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === player.id ? null : player.id) }}
                      className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mt-1"
                    >
                      <MoreVertical className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Inline actions */}
                {actionMenuId === player.id && (
                  <div className="border-t border-gray-700 grid grid-cols-3 divide-x divide-gray-700">
                    <button
                      onClick={() => router.push(`/admin/players/${player.id}/edit`)}
                      className="flex flex-col items-center gap-1 py-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Edit</span>
                    </button>
                    <button
                      onClick={() => router.push(`/admin/players/${player.id}/history`)}
                      className="flex flex-col items-center gap-1 py-2.5 text-gray-400 hover:text-white hover:bg-gray-700/50"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span className="text-[10px]">History</span>
                    </button>
                    <button
                      className="flex flex-col items-center gap-1 py-2.5 text-red-400 hover:bg-red-500/10"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Remove</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Announcement Modal */}
      {showAnnounce && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl p-6">
            <h3 className="font-bold text-white text-lg mb-1">Send Announcement</h3>
            <p className="text-gray-500 text-sm mb-4">
              {selected.length === 0
                ? 'To all players'
                : `To ${selected.length} selected player${selected.length > 1 ? 's' : ''}`}
            </p>
            <textarea
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Type your message..."
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAnnounce(false); setAnnouncement('') }}
                className="flex-1 py-3 rounded-full border border-gray-700 text-gray-400 font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={sendAnnouncement}
                disabled={sending || !announcement.trim()}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
