'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trophy, Target, TrendingUp, Calendar } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface StatsData {
  attendanceTrend: Array<{ label: string; attended: number; total: number }>
  goalsPerMatch: Array<{ label: string; goals: number }>
  positionBreakdown: Array<{ name: string; value: number }>
  monthlyActivity: Array<{ date: string; played: boolean }>
  personalBests: {
    longestStreak: number
    bestReliabilityScore: number
    mostGoalsInMatch: number
    totalGoals: number
    totalMatches: number
    totalMVPs: number
    winRate: number
  }
}

const POSITION_COLORS: Record<string, string> = {
  GK: '#f59e0b',
  DEF: '#3b82f6',
  MID: '#10b981',
  FWD: '#ef4444',
}

const CHART_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444']

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name?: string; color?: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      {label && <p className="text-gray-400 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? '#10b981' }} className="font-semibold">
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  )
}

function PersonalBestCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-white font-bold text-lg leading-none">{value}</p>
        <p className="text-gray-500 text-xs mt-0.5">{label}</p>
      </div>
    </div>
  )
}

export default function StatsPage() {
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('turfmate_token')
    if (!token) { router.push('/login'); return }
    fetch('/api/players/me/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(setStats)
      .catch(() => setStats({
        attendanceTrend: [
          { label: 'M1', attended: 1, total: 1 },
          { label: 'M2', attended: 0, total: 1 },
          { label: 'M3', attended: 1, total: 1 },
          { label: 'M4', attended: 1, total: 1 },
          { label: 'M5', attended: 1, total: 1 },
          { label: 'M6', attended: 0, total: 1 },
          { label: 'M7', attended: 1, total: 1 },
          { label: 'M8', attended: 1, total: 1 },
        ],
        goalsPerMatch: [
          { label: 'M1', goals: 2 }, { label: 'M2', goals: 0 }, { label: 'M3', goals: 1 },
          { label: 'M4', goals: 3 }, { label: 'M5', goals: 1 }, { label: 'M6', goals: 0 },
          { label: 'M7', goals: 2 }, { label: 'M8', goals: 1 },
        ],
        positionBreakdown: [
          { name: 'FWD', value: 45 }, { name: 'MID', value: 30 },
          { name: 'DEF', value: 20 }, { name: 'GK', value: 5 },
        ],
        monthlyActivity: [],
        personalBests: {
          longestStreak: 5, bestReliabilityScore: 88, mostGoalsInMatch: 3,
          totalGoals: 11, totalMatches: 8, totalMVPs: 2, winRate: 63,
        },
      }))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card h-48" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  // Build monthly calendar grid from last 10 weeks (70 days)
  const today = new Date()
  const calendarDays: Array<{ date: Date; played: boolean }> = []
  for (let i = 69; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const played = stats.monthlyActivity.some(m => new Date(m.date).toDateString() === d.toDateString())
    calendarDays.push({ date: d, played })
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <h1 className="font-extrabold text-white text-xl">My Statistics</h1>
      </div>

      {/* Personal Bests */}
      <div>
        <h2 className="font-bold text-white mb-3">Personal Bests</h2>
        <div className="grid grid-cols-2 gap-3">
          <PersonalBestCard icon={TrendingUp} label="Longest Streak" value={`${stats.personalBests.longestStreak} matches`} color="bg-emerald-500/10 text-emerald-400" />
          <PersonalBestCard icon={Trophy} label="Best Reliability" value={stats.personalBests.bestReliabilityScore} color="bg-yellow-500/10 text-yellow-400" />
          <PersonalBestCard icon={Target} label="Goals in 1 Match" value={stats.personalBests.mostGoalsInMatch} color="bg-red-500/10 text-red-400" />
          <PersonalBestCard icon={Calendar} label="Win Rate" value={`${stats.personalBests.winRate}%`} color="bg-blue-500/10 text-blue-400" />
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="card p-4">
        <h2 className="font-bold text-white mb-4">Attendance — Last 8 Matches</h2>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={stats.attendanceTrend} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1]} ticks={[0, 1]} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
            <Bar dataKey="attended" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Goals per Match */}
      <div className="card p-4">
        <h2 className="font-bold text-white mb-4">Goals per Match</h2>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={stats.goalsPerMatch}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone" dataKey="goals" stroke="#10b981" strokeWidth={2.5}
              dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Position Breakdown */}
      <div className="card p-4">
        <h2 className="font-bold text-white mb-4">Position Breakdown</h2>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie data={stats.positionBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" paddingAngle={3}>
                {stats.positionBreakdown.map((entry, i) => (
                  <Cell key={i} fill={POSITION_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {stats.positionBreakdown.map((entry, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: POSITION_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length] }} />
                <span className="text-gray-400 text-sm flex-1">{entry.name}</span>
                <span className="text-white text-sm font-semibold">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="card p-4">
        <h2 className="font-bold text-white mb-4">Activity — Last 10 Weeks</h2>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
          {calendarDays.map((day, i) => (
            <div
              key={i}
              className={`w-full aspect-square rounded-sm ${day.played ? 'bg-emerald-500' : 'bg-gray-800'}`}
              title={day.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-800" /> No match</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500" /> Played</div>
        </div>
      </div>
    </div>
  )
}
