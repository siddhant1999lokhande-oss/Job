import { cn } from '@/lib/utils'

interface ReliabilityBadgeProps {
  score: number
  tier: string
  showScore?: boolean
  className?: string
}

const TIER_CONFIG: Record<
  string,
  { icon: string; label: string; colorClass: string; bgClass: string }
> = {
  BRONZE: {
    icon: '🥉',
    label: 'Bronze',
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10 border-orange-500/30',
  },
  SILVER: {
    icon: '🥈',
    label: 'Silver',
    colorClass: 'text-gray-300',
    bgClass: 'bg-gray-500/10 border-gray-500/30',
  },
  GOLD: {
    icon: '🥇',
    label: 'Gold',
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/10 border-yellow-500/30',
  },
  PLATINUM: {
    icon: '💎',
    label: 'Platinum',
    colorClass: 'text-cyan-400',
    bgClass: 'bg-cyan-500/10 border-cyan-500/30',
  },
  LEGEND: {
    icon: '👑',
    label: 'Legend',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/10 border-purple-500/30',
  },
}

export function ReliabilityBadge({
  score,
  tier,
  showScore = false,
  className,
}: ReliabilityBadgeProps) {
  const config = TIER_CONFIG[tier?.toUpperCase()] ?? TIER_CONFIG['BRONZE']

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.bgClass,
        config.colorClass,
        className,
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
      {showScore && (
        <span className="opacity-70 font-normal">· {score}</span>
      )}
    </span>
  )
}
