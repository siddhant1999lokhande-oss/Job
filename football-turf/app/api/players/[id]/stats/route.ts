import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
        reliabilityScore: true,
      },
    })

    if (!user) {
      return Response.json({ error: 'Player not found' }, { status: 404 })
    }

    // Fetch last 5 matches
    const recentMatchPlayers = await prisma.matchPlayer.findMany({
      where: { userId: id },
      orderBy: { registeredAt: 'desc' },
      take: 5,
      include: {
        match: {
          select: {
            id: true,
            title: true,
            date: true,
            status: true,
            venue: { select: { name: true } },
          },
        },
      },
    })

    return Response.json({
      userId: id,
      matchesPlayed: user.stats?.matchesPlayed ?? 0,
      goals: user.stats?.goals ?? 0,
      assists: user.stats?.assists ?? 0,
      mvpCount: user.stats?.mvpCount ?? 0,
      wins: user.stats?.wins ?? 0,
      losses: user.stats?.losses ?? 0,
      draws: user.stats?.draws ?? 0,
      cleanSheets: user.stats?.cleanSheets ?? 0,
      noShows: user.stats?.noShows ?? 0,
      lateCancels: user.stats?.lateCancels ?? 0,
      reliabilityScore: user.reliabilityScore?.score ?? 100,
      tier: user.reliabilityScore?.tier ?? 'BRONZE',
      recentMatches: recentMatchPlayers,
    })
  } catch (error) {
    console.error('GET /players/[id]/stats error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
