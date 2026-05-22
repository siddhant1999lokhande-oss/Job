'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, CheckCircle } from 'lucide-react'
import { useAdminGuard } from '@/lib/use-admin-guard'
import { cn } from '@/lib/utils'

interface MatchOption {
  id: string
  title: string
  date: string
}

export default function AdminAnnouncePage() {
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [message, setMessage] = useState('')
  const [target, setTarget] = useState<'all' | 'match'>('all')
  const [matchId, setMatchId] = useState('')
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const fetchMatches = useCallback(async () => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) return
    const res = await fetch('/api/admin/matches?status=UPCOMING', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setMatches(data?.matches ?? [])
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchMatches()
  }, [ready, fetchMatches])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    setSending(true)
    const token = localStorage.getItem('turfmate_token')
    try {
      const url = target === 'match' && matchId
        ? `/api/matches/${matchId}/announce`
        : '/api/admin/announce'
      const body = target === 'match' && matchId
        ? { message: message.trim(), type: 'INFO' }
        : { message: message.trim() }
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      setSent(true)
      setMessage('')
      setTimeout(() => setSent(false), 3000)
    } catch {}
    finally { setSending(false) }
  }

  if (!ready) return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Send Announcement</h1>
      </div>

      <form onSubmit={handleSend} className="px-4 py-6 space-y-5">
        {/* Target selector */}
        <div>
          <label className="text-gray-400 text-xs font-medium mb-2 block">Send to</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTarget('all')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                target === 'all'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400',
              )}
            >
              <Users className="w-4 h-4" /> All Players
            </button>
            <button
              type="button"
              onClick={() => setTarget('match')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-colors',
                target === 'match'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400',
              )}
            >
              🏟️ Specific Match
            </button>
          </div>
        </div>

        {/* Match picker */}
        {target === 'match' && (
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Select match</label>
            <select
              value={matchId}
              onChange={e => setMatchId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">-- Choose a match --</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.title} · {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Message */}
        <div>
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Message</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your announcement..."
            rows={5}
            autoFocus
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors resize-none"
          />
          <p className="text-gray-600 text-xs mt-1 text-right">{message.length}/500</p>
        </div>

        {sent && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Announcement sent successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !message.trim() || (target === 'match' && !matchId)}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {sending ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending...
            </>
          ) : (
            <><Send className="w-4 h-4" /> Send Announcement</>
          )}
        </button>
      </form>
    </div>
  )
}
