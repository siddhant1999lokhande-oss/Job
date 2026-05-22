'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileForm {
  name: string
  preferredPosition: string
  preferredFoot: string
  skillLevel: number
  fitnessLevel: number
  gkWillingness: boolean
  notes: string
}

const POSITIONS = [
  { value: '', label: 'Not set' },
  { value: 'GK', label: '🧤 Goalkeeper' },
  { value: 'DEF', label: '🛡️ Defender' },
  { value: 'MID', label: '⚙️ Midfielder' },
  { value: 'FWD', label: '⚡ Forward' },
  { value: 'ANY', label: '🔄 Flexible' },
]

const FEET = [
  { value: 'RIGHT', label: 'Right' },
  { value: 'LEFT', label: 'Left' },
  { value: 'BOTH', label: 'Both' },
]

function SkillSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-gray-400 text-xs font-medium">{label}</label>
        <span className="text-emerald-400 text-xs font-bold">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500 h-1.5 rounded-full bg-gray-700 appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
        <span>Beginner</span>
        <span>Elite</span>
      </div>
    </div>
  )
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    preferredPosition: '',
    preferredFoot: 'RIGHT',
    skillLevel: 5,
    fitnessLevel: 5,
    gkWillingness: false,
    notes: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name ?? '',
          preferredPosition: data.preferredPosition ?? '',
          preferredFoot: data.preferredFoot ?? 'RIGHT',
          skillLevel: data.skillLevel ?? 5,
          fitnessLevel: data.fitnessLevel ?? 5,
          gkWillingness: data.gkWillingness ?? false,
          notes: data.notes ?? '',
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  const set = (key: keyof ProfileForm, value: ProfileForm[typeof key]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setError('')
    setSaving(true)
    try {
      const token = localStorage.getItem('turfmate_token')
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          preferredPosition: form.preferredPosition || null,
          preferredFoot: form.preferredFoot,
          skillLevel: form.skillLevel,
          fitnessLevel: form.fitnessLevel,
          gkWillingness: form.gkWillingness,
          notes: form.notes.trim() || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
      const data = await res.json()
      if (data.user) {
        const stored = localStorage.getItem('turfmate_user')
        const existing = stored ? JSON.parse(stored) : {}
        localStorage.setItem('turfmate_user', JSON.stringify({ ...existing, ...data.user }))
      }
      setSaved(true)
      setTimeout(() => router.push('/profile'), 800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="card h-16" />)}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800 sticky top-0 bg-gray-950 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Edit Profile</h1>
        {saved && <span className="text-emerald-400 text-xs font-medium">Saved!</span>}
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Name */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-white text-sm">Basic Info</h2>
          <div>
            <label className="text-gray-400 text-xs font-medium mb-1.5 block">Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Your full name"
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Position & Foot */}
        <div className="card p-4 space-y-4">
          <h2 className="font-semibold text-white text-sm">Playing Style</h2>

          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Preferred Position</label>
            <div className="grid grid-cols-2 gap-2">
              {POSITIONS.slice(1).map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => set('preferredPosition', p.value)}
                  className={cn(
                    'py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors text-left',
                    form.preferredPosition === p.value
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-600',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {form.preferredPosition && (
              <button
                type="button"
                onClick={() => set('preferredPosition', '')}
                className="text-gray-600 text-xs mt-2 hover:text-gray-400 transition-colors"
              >
                Clear selection
              </button>
            )}
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Preferred Foot</label>
            <div className="flex gap-2">
              {FEET.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => set('preferredFoot', f.value)}
                  className={cn(
                    'flex-1 py-2 rounded-xl border text-xs font-medium transition-colors',
                    form.preferredFoot === f.value
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400'
                      : 'bg-gray-900 border-gray-700 text-gray-400',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Skill Levels */}
        <div className="card p-4 space-y-5">
          <h2 className="font-semibold text-white text-sm">Skill Levels</h2>
          <SkillSlider label="Football Skill" value={form.skillLevel} onChange={v => set('skillLevel', v)} />
          <SkillSlider label="Fitness Level" value={form.fitnessLevel} onChange={v => set('fitnessLevel', v)} />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-medium">Willing to play GK</p>
              <p className="text-gray-500 text-xs">If no goalkeeper is available</p>
            </div>
            <button
              type="button"
              onClick={() => set('gkWillingness', !form.gkWillingness)}
              className={cn(
                'w-11 h-6 rounded-full transition-colors relative',
                form.gkWillingness ? 'bg-emerald-500' : 'bg-gray-700',
              )}
            >
              <div className={cn(
                'w-4 h-4 rounded-full bg-white absolute top-1 transition-transform',
                form.gkWillingness ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-4">
          <label className="text-gray-400 text-xs font-medium mb-1.5 block">Notes (optional)</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Any injuries, availability notes, or anything else..."
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors resize-none"
          />
        </div>

        {error && (
          <p className="text-red-400 text-xs text-center bg-red-500/10 py-2 px-3 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-3.5 text-base disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Profile
            </>
          )}
        </button>
      </form>
    </div>
  )
}
