'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminGuard } from '@/lib/use-admin-guard'

const FORMATS = ['5v5', '6v6', '7v7', '8v8', '11v11']
const SKILL_LEVELS = ['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED']
const MATCH_TYPES = ['CASUAL', 'COMPETITIVE']

interface Venue { id: string; name: string; address: string }

interface FormData {
  // Step 1
  title: string
  date: string
  startTime: string
  endTime: string
  format: string
  matchType: string
  // Step 2
  venueId: string
  maxPlayers: number
  costPerPlayer: number
  skillLevel: string
  // Step 3
  notes: string
  turfRules: string
  jerseyColorA: string
  jerseyColorB: string
  cancellationPolicy: string
  isRecurring: boolean
  recurringDays: string[]
}

const INITIAL_FORM: FormData = {
  title: '', date: '', startTime: '', endTime: '', format: '6v6', matchType: 'CASUAL',
  venueId: '', maxPlayers: 12, costPerPlayer: 150, skillLevel: 'ALL',
  notes: '', turfRules: '', jerseyColorA: '#10b981', jerseyColorB: '#3b82f6',
  cancellationPolicy: '', isRecurring: false, recurringDays: [],
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const STEP_LABELS = ['Basic Info', 'Venue & Players', 'Rules & Settings']

export default function CreateMatchPage() {
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch('/api/venues', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setVenues(d?.venues ?? []))
      .catch(() => {})
  }, [router])

  const set = (field: keyof FormData, value: unknown) => {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (step === 0) {
      if (!form.title.trim()) newErrors.title = 'Title is required'
      if (!form.date) newErrors.date = 'Date is required'
      if (!form.startTime) newErrors.startTime = 'Start time is required'
      if (!form.endTime) newErrors.endTime = 'End time is required'
    }
    if (step === 1) {
      if (!form.venueId) newErrors.venueId = 'Please select a venue'
      if (form.maxPlayers < 2) newErrors.maxPlayers = 'At least 2 players required'
      if (form.costPerPlayer < 0) newErrors.costPerPlayer = 'Cost cannot be negative'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 2))
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    setLoading(true)
    setSubmitError('')
    const token = localStorage.getItem('turfmate_token')
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create match')
      router.push(`/matches/${data.match.id}`)
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create match')
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day: string) => {
    const days = form.recurringDays.includes(day)
      ? form.recurringDays.filter(d => d !== day)
      : [...form.recurringDays, day]
    set('recurringDays', days)
  }

  if (!ready) return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button
          onClick={() => step === 0 ? router.back() : setStep(s => s - 1)}
          className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg">Create Match</h1>
          <p className="text-gray-500 text-xs">{STEP_LABELS[step]}</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center px-4 py-4 gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors',
                i < step ? 'bg-emerald-500 border-emerald-500 text-white'
                  : i === step ? 'border-emerald-500 text-emerald-400'
                  : 'border-gray-700 text-gray-600',
              )}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={cn(
                'text-[10px] mt-1 text-center',
                i === step ? 'text-emerald-400' : 'text-gray-600',
              )}>{label}</span>
            </div>
            {i < 2 && <div className={cn('h-px flex-1 mx-1 mt-[-14px]', i < step ? 'bg-emerald-500' : 'bg-gray-700')} />}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="px-4 pb-32 space-y-4">
        {/* STEP 1: Basic Info */}
        {step === 0 && (
          <>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Match Title *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Sunday Warriors FC"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Date *
              </label>
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => set('date', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              />
              {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Start Time *</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={e => set('startTime', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">End Time *</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={e => set('endTime', e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Format</label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => set('format', f)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                      form.format === f
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-gray-800 border-gray-700 text-gray-400',
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Match Type</label>
              <div className="flex flex-wrap gap-2">
                {MATCH_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set('matchType', t)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                      form.matchType === t
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEP 2: Venue & Players */}
        {step === 1 && (
          <>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Venue *</label>
              <select
                value={form.venueId}
                onChange={e => set('venueId', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">Select venue...</option>
                {venues.map(v => (
                  <option key={v.id} value={v.id}>{v.name} — {v.address}</option>
                ))}
              </select>
              {errors.venueId && <p className="text-red-400 text-xs mt-1">{errors.venueId}</p>}
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">
                Max Players: <span className="text-emerald-400">{form.maxPlayers}</span>
              </label>
              <input
                type="range"
                min={2}
                max={22}
                step={1}
                value={form.maxPlayers}
                onChange={e => set('maxPlayers', Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>2</span><span>22</span>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Cost per Player (₹)</label>
              <input
                type="number"
                value={form.costPerPlayer}
                min={0}
                onChange={e => set('costPerPlayer', Number(e.target.value))}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Skill Level</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_LEVELS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('skillLevel', s)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                      form.skillLevel === s
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* STEP 3: Rules & Settings */}
        {step === 2 && (
          <>
            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Match Notes</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any important info for players..."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Turf Rules</label>
              <textarea
                value={form.turfRules}
                onChange={e => set('turfRules', e.target.value)}
                placeholder="No studs, bring water, etc."
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-2">Jersey Colors</label>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <input type="color" value={form.jerseyColorA} onChange={e => set('jerseyColorA', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                  <span className="text-gray-400 text-sm">Team A</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.jerseyColorB} onChange={e => set('jerseyColorB', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                  <span className="text-gray-400 text-sm">Team B</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-semibold uppercase tracking-wide block mb-1.5">Cancellation Policy</label>
              <input
                type="text"
                value={form.cancellationPolicy}
                onChange={e => set('cancellationPolicy', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium text-sm">Recurring Match</p>
                  <p className="text-gray-500 text-xs">Repeat every week on selected days</p>
                </div>
                <button
                  type="button"
                  onClick={() => set('isRecurring', !form.isRecurring)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative',
                    form.isRecurring ? 'bg-emerald-500' : 'bg-gray-700',
                  )}
                >
                  <span className={cn(
                    'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                    form.isRecurring ? 'translate-x-5.5 left-0.5' : 'left-0.5',
                  )} />
                </button>
              </div>
              {form.isRecurring && (
                <div className="flex gap-1.5 flex-wrap">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={cn(
                        'w-9 h-9 rounded-full text-xs font-medium border transition-colors',
                        form.recurringDays.includes(d)
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-gray-800 border-gray-700 text-gray-400',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-gray-950 border-t border-gray-800">
        <div className="max-w-md mx-auto space-y-2">
          {submitError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-xl text-center">
              {submitError}
            </div>
          )}
          {step < 2 ? (
            <button onClick={handleNext} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-3.5 disabled:opacity-50">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating Match...
                </span>
              ) : (
                '✓ Create Match'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
