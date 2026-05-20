export interface PlayerForBalancing {
  id: string
  name: string
  skillLevel: number       // 1-10
  preferredPosition: string | null  // GK | DEF | MID | FWD | ANY
  gkWillingness: boolean
  fitnessLevel: number
  versatility: number
}

export type BalancingMode = 'BALANCED' | 'RANDOM' | 'SKILL_DRAFT'

export interface TeamResult {
  teamA: PlayerForBalancing[]
  teamB: PlayerForBalancing[]
  balanceScore: number     // 0-100, higher = more balanced
}

function compositeScore(player: PlayerForBalancing): number {
  return (
    player.skillLevel * 0.5 +
    player.fitnessLevel * 0.3 +
    player.versatility * 0.2
  )
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function calculateBalanceScore(
  teamA: PlayerForBalancing[],
  teamB: PlayerForBalancing[]
): number {
  if (teamA.length === 0 && teamB.length === 0) return 100

  const totalA = teamA.reduce((sum, p) => sum + compositeScore(p), 0)
  const totalB = teamB.reduce((sum, p) => sum + compositeScore(p), 0)

  // Max possible score per player: skillLevel=10, fitnessLevel=10, versatility=10
  // compositeScore = 10*0.5 + 10*0.3 + 10*0.2 = 10
  const maxPerPlayer = 10
  const maxPossible = Math.max(teamA.length, teamB.length) * maxPerPlayer

  if (maxPossible === 0) return 100

  const balanceScore = 100 - (Math.abs(totalA - totalB) / maxPossible) * 100
  return Math.max(0, Math.min(100, balanceScore))
}

export function balanceTeams(
  players: PlayerForBalancing[],
  mode: BalancingMode
): TeamResult {
  if (players.length === 0) {
    return { teamA: [], teamB: [], balanceScore: 100 }
  }

  let teamA: PlayerForBalancing[] = []
  let teamB: PlayerForBalancing[] = []

  if (mode === 'BALANCED') {
    // Step 1: Separate goalkeepers
    const goalkeepers = players.filter(
      (p) => p.gkWillingness || p.preferredPosition === 'GK'
    )
    const outfield = players.filter(
      (p) => !p.gkWillingness && p.preferredPosition !== 'GK'
    )

    // Assign one GK to each team if available
    const gkShuffled = shuffle(goalkeepers)
    const assignedGks: PlayerForBalancing[] = []
    if (gkShuffled.length >= 1) {
      teamA.push(gkShuffled[0])
      assignedGks.push(gkShuffled[0])
    }
    if (gkShuffled.length >= 2) {
      teamB.push(gkShuffled[1])
      assignedGks.push(gkShuffled[1])
    }

    // Remaining GKs treated as outfield players
    const extraGks = gkShuffled.slice(2)
    const remaining = [...outfield, ...extraGks].sort(
      (a, b) => compositeScore(b) - compositeScore(a)
    )

    // Snake draft: A gets 0,3,4,7,8... B gets 1,2,5,6,9,10...
    for (let i = 0; i < remaining.length; i++) {
      const pairIndex = Math.floor(i / 2)
      const posInPair = i % 2
      // Even pairs (0,1): A picks first (i=0), B picks second (i=1)
      // Odd pairs (2,3): B picks first (i=2), A picks second (i=3)
      const pickForA = pairIndex % 2 === 0 ? posInPair === 0 : posInPair === 1
      if (pickForA) {
        teamA.push(remaining[i])
      } else {
        teamB.push(remaining[i])
      }
    }
  } else if (mode === 'RANDOM') {
    const shuffled = shuffle(players)
    const half = Math.ceil(shuffled.length / 2)
    teamA = shuffled.slice(0, half)
    teamB = shuffled.slice(half)
  } else if (mode === 'SKILL_DRAFT') {
    // Sort by skill descending, teams alternate picks
    const sorted = [...players].sort((a, b) => b.skillLevel - a.skillLevel)
    for (let i = 0; i < sorted.length; i++) {
      if (i % 2 === 0) {
        teamA.push(sorted[i])
      } else {
        teamB.push(sorted[i])
      }
    }
  }

  const balanceScore = calculateBalanceScore(teamA, teamB)
  return { teamA, teamB, balanceScore }
}
