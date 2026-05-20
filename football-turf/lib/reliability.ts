export interface ReliabilityInput {
  totalMatches: number
  attended: number
  noShows: number
  lateCancels: number   // cancelled within 2 hours of match
}

/**
 * Calculate reliability score (0–100).
 * New players (< 3 matches) receive a grace score of 75.
 *
 * Formula:
 *   base             = (attended / totalMatches) * 100
 *   noShowPenalty    = noShows * 15
 *   lateCancelPenalty = lateCancels * 8
 *   score            = clamp(base - noShowPenalty - lateCancelPenalty, 0, 100)
 */
export function calculateReliabilityScore(input: ReliabilityInput): number {
  const { totalMatches, attended, noShows, lateCancels } = input

  if (totalMatches < 3) {
    return 75
  }

  const base = (attended / totalMatches) * 100
  const noShowPenalty = noShows * 15
  const lateCancelPenalty = lateCancels * 8
  const score = base - noShowPenalty - lateCancelPenalty

  return Math.max(0, Math.min(100, score))
}

export function getReliabilityTier(
  score: number
): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGEND' {
  if (score >= 95) return 'LEGEND'
  if (score >= 85) return 'PLATINUM'
  if (score >= 70) return 'GOLD'
  if (score >= 50) return 'SILVER'
  return 'BRONZE'
}

export function getReliabilityLabel(score: number): string {
  const tier = getReliabilityTier(score)
  const labels: Record<string, string> = {
    LEGEND: '🌟 Legend Reliable',
    PLATINUM: '💎 Platinum Reliable',
    GOLD: '🥇 Gold Reliable',
    SILVER: '🥈 Silver Reliable',
    BRONZE: '🥉 Bronze Reliable',
  }
  return labels[tier] ?? '🥉 Bronze Reliable'
}

export function shouldWarnPlayer(score: number): boolean {
  return score < 60
}

export function canJoinMatch(score: number, minRequired?: number): boolean {
  return score >= (minRequired ?? 40)
}
