'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Edit2, Eye, XCircle, Copy, MoreVertical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatMatchDate, formatMatchTime, cn } from '@/lib/utils'
import { useAdminGuard } from '@/lib/use-admin-guard'

interface AdminMatch {
  id: string
  title: string
  date: string
  startTime: string
  venue: string
  format: string
  status: string
  currentPlayers: number
  maxPlayers: number
  paidCount: number
  costPerPlayer: number
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'UPCOMING', label: 'Upcoming' },
  { id: 'CONFIRMED', label: 'Confirmed' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
]

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'CONFIRMED': return 'success'
    case 'UPCOMING': return 'info'
    case 'IN_PROGRESS': return 'warning'
    case 'COMPLETED': return 'default'
    case 'CANCELLED': return 'danger'
    default: return 'default'
  }
}

export default function AdminMatchesPage() {
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [matches, setMatches] = useState<AdminMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [actionMenuId, setActionMenuId] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('status', filter)
    if (search) params.set('search', search)
    try {
      const res = await fetch(`/api/admin/matches?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMatches(data?.matches ?? [])
    } catch { setMatches([]) }
    finally { setLoading(false) }
  }, [filter, search, router])

  useEffect(() => {
    const t = setTimeout(fetchMatches, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchMatches, search])

  const handleAction = async (matchId: string, action: 'cancel' | 'duplicate') => {
    const token = localStorage.getItem('turfmate_token')
    setActionMenuId(null)
    try {
      await fetch(`/api/admin/matches/${matchId}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchMatches()
    } catch {}
  }

  if (!ready) return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Manage Matches</h1>
        <Link
          href="/matches/create"
          className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <Plus className="w-4 h-4 text-white" />
        </Link>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search matches..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                filter === f.id
                  ? 'bg-emerald-500 border-emerald-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-4xl mb-3">🏟️</span>
            <p className="text-white font-bold">No matches found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map(match => (
              <div key={match.id} className="card overflow-hidden" onClick={() => setActionMenuId(null)}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{match.title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {formatMatchDate(new Date(match.date))} · {formatMatchTime(match.startTime)}
                      </p>
                      <p className="text-gray-500 text-xs">{match.venue}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={getStatusVariant(match.status)} className="text-[10px]">
                        {match.status}
                      </Badge>
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenuId(actionMenuId === match.id ? null : match.id) }}
                        className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center"
                      >
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs mt-2">
                    <span className="text-gray-400">
                      👥 {match.currentPlayers}/{match.maxPlayers}
                    </span>
                    <span className="text-gray-400">
                      {match.format}
                    </span>
                    <span className={match.paidCount === match.currentPlayers ? 'text-emerald-400' : 'text-amber-400'}>
                      💰 {match.paidCount}/{match.currentPlayers} paid
                    </span>
                  </div>
                </div>

                {/* Action menu */}
                {actionMenuId === match.id && (
                  <div className="border-t border-gray-700 grid grid-cols-4 divide-x divide-gray-700">
                    <Link
                      href={`/matches/${match.id}`}
                      className="flex flex-col items-center gap-1 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-[10px]">View</span>
                    </Link>
                    <Link
                      href={`/matches/${match.id}/edit`}
                      className="flex flex-col items-center gap-1 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="text-[10px]">Edit</span>
                    </Link>
                    <button
                      onClick={() => handleAction(match.id, 'duplicate')}
                      className="flex flex-col items-center gap-1 py-3 text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="text-[10px]">Duplicate</span>
                    </button>
                    {match.status !== 'CANCELLED' && match.status !== 'COMPLETED' && (
                      <button
                        onClick={() => handleAction(match.id, 'cancel')}
                        className="flex flex-col items-center gap-1 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-[10px]">Cancel</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
