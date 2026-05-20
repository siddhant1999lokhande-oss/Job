'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import { MatchCard } from '@/components/match-card'
import { cn } from '@/lib/utils'

interface Match {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: string
  format: string
  currentPlayers: number
  maxPlayers: number
  status: string
  matchType: string
  costPerPlayer: number
  isJoined?: boolean
  skillLevel?: string
  players?: Array<{ name: string }>
}

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'mine', label: 'My Matches' },
  { id: 'completed', label: 'Completed' },
] as const

const FORMAT_CHIPS = ['5v5', '6v6', '7v7', '8v8', '11v11']
const SKILL_CHIPS = ['Beginner', 'Intermediate', 'Advanced', 'Mixed']

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [selectedFormats, setSelectedFormats] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchMatches = useCallback(async () => {
    setLoading(true)
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }

    const params = new URLSearchParams()
    if (activeTab === 'upcoming') params.set('status', 'UPCOMING')
    if (activeTab === 'mine') params.set('joined', 'true')
    if (activeTab === 'completed') params.set('status', 'COMPLETED')
    if (search) params.set('search', search)
    if (selectedFormats.length) params.set('format', selectedFormats.join(','))
    if (selectedSkills.length) params.set('skillLevel', selectedSkills.join(','))

    try {
      const res = await fetch(`/api/matches?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setMatches(data?.matches ?? [])

      // Check admin role from stored user
      const userStr = localStorage.getItem('turfmate_user')
      if (userStr) {
        const u = JSON.parse(userStr)
        setIsAdmin(u.role === 'ADMIN' || u.role === 'ORGANIZER')
      }
    } catch {
      setMatches([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, selectedFormats, selectedSkills, router])

  useEffect(() => {
    const debounce = setTimeout(fetchMatches, search ? 400 : 0)
    return () => clearTimeout(debounce)
  }, [fetchMatches, search])

  const toggleChip = (value: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      {/* Page title */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-extrabold text-white">Matches</h1>
        <button
          onClick={() => setShowFilters(f => !f)}
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center border transition-colors',
            showFilters
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-gray-800 border-gray-700 text-gray-400',
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search matches, venues..."
          className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-gray-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="card p-4 mb-4 space-y-3">
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_CHIPS.map(f => (
                <button
                  key={f}
                  onClick={() => toggleChip(f, selectedFormats, setSelectedFormats)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedFormats.includes(f)
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700',
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Skill Level</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_CHIPS.map(s => (
                <button
                  key={s}
                  onClick={() => toggleChip(s, selectedSkills, setSelectedSkills)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedSkills.includes(s)
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                      : 'bg-gray-800 text-gray-400 border-gray-700',
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          {(selectedFormats.length > 0 || selectedSkills.length > 0) && (
            <button
              onClick={() => { setSelectedFormats([]); setSelectedSkills([]) }}
              className="text-emerald-400 text-xs font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Matches list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card h-28 animate-pulse">
              <div className="flex h-full">
                <div className="w-14 bg-gray-700 rounded-l-xl" />
                <div className="flex-1 p-4 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                  <div className="h-3 bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">⚽</span>
          <p className="text-white font-bold text-lg mb-1">No matches found</p>
          <p className="text-gray-500 text-sm">
            {search ? 'Try a different search term' : 'Check back later for upcoming matches'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map(match => (
            <MatchCard key={match.id} {...match} />
          ))}
        </div>
      )}

      {/* FAB for admin */}
      {isAdmin && (
        <button
          onClick={() => router.push('/matches/create')}
          className="fixed bottom-24 right-4 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
          aria-label="Create match"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}
    </div>
  )
}
