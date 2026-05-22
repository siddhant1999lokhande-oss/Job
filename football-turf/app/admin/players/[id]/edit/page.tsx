'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { useAdminGuard } from '@/lib/use-admin-guard'
import { cn } from '@/lib/utils'

const POSITIONS = [
  { value: '', label: 'Not set' },
  { value: 'GK', label: '🧤 Goalkeeper' },
  { value: 'DEF', label: '🛡️ Defender' },
  { value: 'MID', label: '⚙️ Midfielder' },
  { value: 'FWD', label: '⚡ Forward' },
  { value: 'ANY', label: '🔄 Flexible' },
]

interface PlayerData {
  id: string
  name: string
  phone: string
  preferredPosition?: string
  skillLevel: number
  isActive: boolean
}

export default function AdminPlayerEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [form, setForm] = useState({ name: '', preferredPosition: '', skillLevel: 5, isActive: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    const token = localStorage.getItem('turfmate_token')
    if (!token) return
    fetch(`/api/players/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setPlayer(data)
        setForm({
          name: data.name ?? '',
          preferredPosition: data.preferredPosition ?? '',
          skillLevel: data.skillLevel ?? 5,
          isActive: data.isActive ?? true,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, ready])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('turfmate_token')
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          preferredPosition: form.preferredPosition || null,
          skillLevel: form.skillLevel,
          isActive: form.isActive,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
      router.back()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSaving(false) }
  }

  if (!ready || loading) return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-3 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="card h-16" />)}
    </div>
  )

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg">Edit Player</h1>
          {player && <p className="text-gray-500 text-xs">+91 {player.phone}</p>}
        </div>
      </div>

      <form onSubmit={handleSave} className="px-4 py-6 space-y-5">
        <div className="card p-4 space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Preferred Position</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.slice(1).map(p => (
                <button key={p.value} type="button"
                  onClick={() => setForm(prev => ({ ...prev, preferredPosition: p.value }))}
                  className={cn('py-2 px-3 rounded-xl border text-xs font-medium transition-colors text-left',
                    form.preferredPosition === p.value
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-gray-900 border-gray-700 text-gray-400')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-gray-400 text-xs font-medium">Skill Level</label>
              <span className="text-emerald-400 text-xs font-bold">{form.skillLevel}/10</span>
            </div>
            <input type="range" min={1} max={10} value={form.skillLevel}
              onChange={e => setForm(p => ({ ...p, skillLevel: Number(e.target.value) }))}
              className="w-full accent-emerald-500 h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer" />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Active player</p>
              <p className="text-gray-500 text-xs">Inactive players can&apos;t join matches</p>
            </div>
            <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
              className={cn('w-11 h-6 rounded-full transition-colors relative', form.isActive ? 'bg-emerald-500' : 'bg-gray-700')}>
              <div className={cn('w-4 h-4 rounded-full bg-white absolute top-1 transition-transform', form.isActive ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}

        <button type="submit" disabled={saving}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50">
          {saving ? '...' : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </form>
    </div>
  )
}
