'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, CheckCircle, Clock, RefreshCw, Filter } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PaymentEntry {
  id: string
  playerName: string
  matchTitle: string
  matchId: string
  amount: number
  status: 'PAID' | 'PENDING' | 'REFUNDED' | 'WAIVED'
  method?: string
  paidAt?: string
  createdAt: string
}

interface MatchOption {
  id: string
  title: string
}

type StatusFilter = 'ALL' | 'PAID' | 'PENDING' | 'REFUNDED'

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PAID', label: 'Paid' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'REFUNDED', label: 'Refunded' },
]

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  switch (status) {
    case 'PAID': return 'success'
    case 'PENDING': return 'warning'
    case 'REFUNDED': return 'info'
    case 'WAIVED': return 'default'
    default: return 'default'
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return 'just now'
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [matches, setMatches] = useState<MatchOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedMatch, setSelectedMatch] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)
  const [summary, setSummary] = useState({ total: 0, paid: 0, pending: 0 })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchPayments = useCallback(async (q: string, matchId: string, status: StatusFilter) => {
    setLoading(true)
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    const params = new URLSearchParams()
    if (q) params.set('search', q)
    if (matchId !== 'ALL') params.set('matchId', matchId)
    if (status !== 'ALL') params.set('status', status)
    try {
      const res = await fetch(`/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setPayments(data?.payments ?? [])
      if (data?.summary) setSummary(data.summary)
    } catch {
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch('/api/admin/matches?status=all&limit=50', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => setMatches(d?.matches ?? []))
      .catch(() => {})
  }, [router])

  useEffect(() => {
    fetchPayments(search, selectedMatch, statusFilter)
  }, [selectedMatch, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchPayments(value, selectedMatch, statusFilter), 400)
  }

  const handleMarkPaid = async (paymentId: string) => {
    setMarkingPaid(paymentId)
    const token = localStorage.getItem('turfmate_token')
    try {
      await fetch(`/api/admin/payments/${paymentId}/mark-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      setPayments(prev =>
        prev.map(p => p.id === paymentId ? { ...p, status: 'PAID', paidAt: new Date().toISOString() } : p)
      )
    } catch {}
    finally { setMarkingPaid(null) }
  }

  const paidCount = payments.filter(p => p.status === 'PAID').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-800">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-white text-lg">Payments</h1>
          <p className="text-gray-500 text-xs">Track and confirm payments</p>
        </div>
        <button
          onClick={() => fetchPayments(search, selectedMatch, statusFilter)}
          className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <div className="card p-3 text-center">
            <p className="text-emerald-400 font-extrabold text-lg leading-none">{formatCurrency(paidAmount)}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Collected</p>
            <p className="text-gray-600 text-[10px]">{paidCount} paid</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-amber-400 font-extrabold text-lg leading-none">
              {formatCurrency(totalAmount - paidAmount)}
            </p>
            <p className="text-gray-500 text-[10px] mt-0.5">Pending</p>
            <p className="text-gray-600 text-[10px]">{pendingCount} unpaid</p>
          </div>
          <div className="card p-3 text-center">
            <p className="text-white font-extrabold text-lg leading-none">{formatCurrency(totalAmount)}</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Total</p>
            <p className="text-gray-600 text-[10px]">{payments.length} entries</p>
          </div>
        </div>

        {/* Collection progress */}
        {totalAmount > 0 && (
          <div className="card p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-gray-400 text-xs">Collection progress</span>
              <span className="text-emerald-400 text-xs font-semibold">
                {Math.round((paidAmount / totalAmount) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.round((paidAmount / totalAmount) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search by player name..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Match filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              value={selectedMatch}
              onChange={e => setSelectedMatch(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="ALL">All Matches</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>

          {/* Status tabs */}
          <div className="flex gap-2">
            {STATUS_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'flex-1 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  statusFilter === tab.id
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Payment List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="card h-20 animate-pulse" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="text-5xl mb-3">💰</span>
            <p className="text-white font-bold">No payments found</p>
            {(search || selectedMatch !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearch('')
                  setSelectedMatch('ALL')
                  setStatusFilter('ALL')
                }}
                className="text-emerald-400 text-sm mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {payments.map(payment => (
              <div key={payment.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={payment.playerName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white font-semibold text-sm truncate">{payment.playerName}</p>
                      <span className="text-emerald-400 font-bold text-sm shrink-0">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{payment.matchTitle}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant={getStatusVariant(payment.status)} className="text-[10px]">
                        {payment.status}
                      </Badge>
                      {payment.method && (
                        <span className="text-gray-600 text-[10px]">{payment.method}</span>
                      )}
                      {payment.paidAt ? (
                        <span className="text-gray-600 text-[10px] flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          {timeAgo(payment.paidAt)}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {timeAgo(payment.createdAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mark Paid action */}
                {payment.status === 'PENDING' && (
                  <button
                    onClick={() => handleMarkPaid(payment.id)}
                    disabled={markingPaid === payment.id}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  >
                    {markingPaid === payment.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Marking...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Mark as Paid
                      </>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
