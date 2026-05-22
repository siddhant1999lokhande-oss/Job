'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, X, Check } from 'lucide-react'
import { useAdminGuard } from '@/lib/use-admin-guard'

interface Venue {
  id: string
  name: string
  address: string
  city: string
  mapLink?: string
  isActive: boolean
}

interface VenueForm {
  name: string
  address: string
  city: string
  mapLink: string
}

const EMPTY_FORM: VenueForm = { name: '', address: '', city: '', mapLink: '' }

export default function AdminVenuesPage() {
  const router = useRouter()
  const { ready } = useAdminGuard()

  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<VenueForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchVenues = useCallback(async () => {
    try {
      const res = await fetch('/api/venues')
      const data = await res.json()
      setVenues(data?.venues ?? [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchVenues()
  }, [ready, fetchVenues])

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setError(''); setShowForm(true) }

  const openEdit = (v: Venue) => {
    setForm({ name: v.name, address: v.address, city: v.city, mapLink: v.mapLink ?? '' })
    setEditId(v.id)
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.address.trim() || !form.city.trim()) {
      setError('Name, address, and city are required')
      return
    }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('turfmate_token')
    try {
      const url = editId ? `/api/admin/venues/${editId}` : '/api/admin/venues'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          mapLink: form.mapLink.trim() || null,
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Save failed') }
      setShowForm(false)
      setEditId(null)
      fetchVenues()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this venue?')) return
    const token = localStorage.getItem('turfmate_token')
    try {
      await fetch(`/api/admin/venues/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      setVenues(prev => prev.filter(v => v.id !== id))
    } catch {}
  }

  if (!ready) return null

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-bold text-white text-lg flex-1">Venues</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-medium"
        >
          <Plus className="w-3.5 h-3.5" /> Add Venue
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
          </div>
        ) : venues.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-white font-bold">No venues yet</p>
            <p className="text-gray-500 text-sm text-center">Add turfs and grounds where matches will be played.</p>
            <button onClick={openAdd} className="btn-primary px-6 py-2.5 text-sm">
              Add First Venue
            </button>
          </div>
        ) : (
          venues.map(venue => (
            <div key={venue.id} className="card p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{venue.name}</p>
                <p className="text-gray-400 text-xs mt-0.5">{venue.address}</p>
                <p className="text-gray-600 text-xs">{venue.city}</p>
                {venue.mapLink && (
                  <a href={venue.mapLink} target="_blank" rel="noopener noreferrer"
                    className="text-emerald-400 text-xs mt-1 inline-block hover:underline">
                    📍 View on map
                  </a>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEdit(venue)}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-300" />
                </button>
                <button
                  onClick={() => handleDelete(venue.id)}
                  className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end">
          <div className="w-full max-w-md mx-auto bg-gray-900 rounded-t-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">{editId ? 'Edit Venue' : 'Add Venue'}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-300" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              {(['name', 'address', 'city'] as const).map(field => (
                <div key={field}>
                  <label className="text-gray-400 text-xs font-medium mb-1 block capitalize">{field} *</label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={field === 'name' ? 'e.g. Green Turf Arena' : field === 'address' ? 'Street / area' : 'City'}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              ))}
              <div>
                <label className="text-gray-400 text-xs font-medium mb-1 block">Google Maps link (optional)</label>
                <input
                  type="url"
                  value={form.mapLink}
                  onChange={e => setForm(p => ({ ...p, mapLink: e.target.value }))}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-full border border-gray-700 text-gray-400 font-semibold text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary py-3 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? '...' : <><Check className="w-4 h-4" /> {editId ? 'Save' : 'Add'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
