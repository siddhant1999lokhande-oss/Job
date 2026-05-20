'use client'

import { useRouter } from 'next/navigation'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { cn, formatMatchDate, formatMatchTime, formatCurrency } from '@/lib/utils'

interface MatchCardProps {
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
  players?: Array<{ name: string; avatar?: string }>
  skillLevel?: string
}

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

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    UPCOMING: 'Upcoming',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'Live',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  }
  return labels[status] ?? status
}

export function MatchCard({
  id, title, date, startTime, endTime, venue, format,
  currentPlayers, maxPlayers, status, costPerPlayer,
  isJoined, players = [], skillLevel,
}: MatchCardProps) {
  const router = useRouter()
  const isFull = currentPlayers >= maxPlayers
  const slotsLeft = maxPlayers - currentPlayers
  const matchDate = new Date(date)
  const dayNum = matchDate.getDate()
  const monthStr = matchDate.toLocaleString('en-IN', { month: 'short' })

  return (
    <div
      onClick={() => router.push(`/matches/${id}`)}
      className={cn(
        'card flex gap-0 overflow-hidden cursor-pointer hover:border-emerald-500/40 transition-all active:scale-[0.99]',
        isJoined && 'border-emerald-500/30',
      )}
    >
      {/* Date column */}
      <div className="bg-gray-900 flex flex-col items-center justify-center px-4 py-4 shrink-0 min-w-[60px] border-r border-gray-700">
        <span className="text-2xl font-extrabold text-emerald-400 leading-none">{dayNum}</span>
        <span className="text-gray-500 text-xs font-medium uppercase mt-0.5">{monthStr}</span>
      </div>

      {/* Match details */}
      <div className="flex-1 min-w-0 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-white text-sm line-clamp-1">{title}</h3>
          <Badge variant={getStatusVariant(status)} className="shrink-0 text-[10px]">
            {getStatusLabel(status)}
          </Badge>
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <Clock className="w-3 h-3 shrink-0" />
            <span>{formatMatchTime(startTime)} – {formatMatchTime(endTime)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-400 text-xs">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="line-clamp-1">{venue}</span>
          </div>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          <Badge variant="info" className="text-[10px]">{format}</Badge>
          {skillLevel && (
            <Badge variant="default" className="text-[10px]">{skillLevel}</Badge>
          )}
          <span className="text-emerald-400 text-xs font-semibold">
            {formatCurrency(costPerPlayer)}/player
          </span>
        </div>

        {/* Players row + join status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Avatar stack */}
            {players.length > 0 && (
              <div className="flex -space-x-2">
                {players.slice(0, 5).map((p, i) => (
                  <Avatar key={i} name={p.name} src={p.avatar} size="sm" className="border-2 border-gray-800" />
                ))}
                {players.length > 5 && (
                  <div className="w-7 h-7 rounded-full bg-gray-700 border-2 border-gray-800 flex items-center justify-center text-[10px] text-gray-400 font-medium">
                    +{players.length - 5}
                  </div>
                )}
              </div>
            )}
            <span className="text-gray-500 text-xs">
              <Users className="w-3 h-3 inline mr-0.5" />
              {currentPlayers}/{maxPlayers}
            </span>
          </div>

          {/* Join / Full / Joined pill */}
          {isJoined ? (
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              ✓ Joined
            </span>
          ) : isFull ? (
            <span className="bg-gray-700 text-gray-500 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              Full
            </span>
          ) : (
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2.5 py-1 rounded-full">
              {slotsLeft} slot{slotsLeft !== 1 ? 's' : ''} left
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
