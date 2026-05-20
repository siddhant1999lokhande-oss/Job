import { prisma } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') ?? 'reliability'

    let leaderboard

    if (type === 'reliability') {
      const scores = await prisma.reliabilityScore.findMany({
        orderBy: { score: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatar: true, preferredPosition: true } },
        },
      })
      leaderboard = scores.map((s: (typeof scores)[number], i: number) => ({
        rank: i + 1,
        userId: s.userId,
        user: s.user,
        score: s.score,
        tier: s.tier,
        totalMatches: s.totalMatches,
        attended: s.attended,
      }))
    } else if (type === 'goals') {
      const stats = await prisma.playerStats.findMany({
        orderBy: { goals: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatar: true, preferredPosition: true } },
        },
      })
      leaderboard = stats.map((s: (typeof stats)[number], i: number) => ({
        rank: i + 1,
        userId: s.userId,
        user: s.user,
        goals: s.goals,
        assists: s.assists,
        matchesPlayed: s.matchesPlayed,
      }))
    } else if (type === 'attendance') {
      const stats = await prisma.playerStats.findMany({
        orderBy: { matchesPlayed: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatar: true, preferredPosition: true } },
        },
      })
      leaderboard = stats.map((s: (typeof stats)[number], i: number) => ({
        rank: i + 1,
        userId: s.userId,
        user: s.user,
        matchesPlayed: s.matchesPlayed,
        noShows: s.noShows,
      }))
    } else if (type === 'mvp') {
      const stats = await prisma.playerStats.findMany({
        orderBy: { mvpCount: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatar: true, preferredPosition: true } },
        },
      })
      leaderboard = stats.map((s: (typeof stats)[number], i: number) => ({
        rank: i + 1,
        userId: s.userId,
        user: s.user,
        mvpCount: s.mvpCount,
        matchesPlayed: s.matchesPlayed,
      }))
    } else if (type === 'wins') {
      const stats = await prisma.playerStats.findMany({
        orderBy: { wins: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, name: true, avatar: true, preferredPosition: true } },
        },
      })
      leaderboard = stats.map((s: (typeof stats)[number], i: number) => ({
        rank: i + 1,
        userId: s.userId,
        user: s.user,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        matchesPlayed: s.matchesPlayed,
      }))
    } else {
      return Response.json({ error: 'Invalid type. Use: reliability | goals | attendance | mvp | wins' }, { status: 400 })
    }

    return Response.json({ type, leaderboard })
  } catch (error) {
    console.error('GET /leaderboard error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
