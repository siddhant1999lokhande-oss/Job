import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const full = searchParams.get('full') === 'true'

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        reliabilityScore: true,
        stats: true,
      },
    })

    if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

    const base = {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferredPosition: user.preferredPosition,
      preferredFoot: user.preferredFoot,
      skillLevel: user.skillLevel,
      fitnessLevel: user.fitnessLevel,
      gkWillingness: user.gkWillingness,
      notes: user.notes,
      isActive: user.isActive,
      createdAt: user.createdAt,
      reliabilityScore: user.reliabilityScore?.score ?? 75,
      reliabilityTier: user.reliabilityScore?.tier ?? 'SILVER',
    }

    if (!full) return Response.json(base)

    const [matchPlayers, playerBadges] = await Promise.all([
      prisma.matchPlayer.findMany({
        where: { userId: session.userId },
        orderBy: { registeredAt: 'desc' },
        take: 10,
        include: {
          match: { select: { id: true, title: true, date: true } },
        },
      }),
      prisma.playerBadge.findMany({
        where: { userId: session.userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
    ])

    const s = user.stats
    const wins = s?.wins ?? 0
    const total = s?.matchesPlayed ?? 0

    return Response.json({
      ...base,
      stats: {
        matches: total,
        goals: s?.goals ?? 0,
        mvp: s?.mvpCount ?? 0,
        winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
      },
      recentMatches: matchPlayers.map(mp => ({
        id: mp.match.id,
        title: mp.match.title,
        date: mp.match.date,
        result: null,
        attendanceStatus: mp.status,
      })),
      badges: playerBadges.map(pb => ({
        id: pb.badge.id,
        name: pb.badge.name,
        icon: pb.badge.icon,
        earnedAt: pb.earnedAt,
      })),
    })
  } catch (error) {
    console.error('me error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, preferredPosition, preferredFoot, skillLevel, fitnessLevel, gkWillingness, notes } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (preferredPosition !== undefined) data.preferredPosition = preferredPosition
    if (preferredFoot !== undefined) data.preferredFoot = preferredFoot
    if (skillLevel !== undefined) data.skillLevel = Number(skillLevel)
    if (fitnessLevel !== undefined) data.fitnessLevel = Number(fitnessLevel)
    if (gkWillingness !== undefined) data.gkWillingness = Boolean(gkWillingness)
    if (notes !== undefined) data.notes = notes

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true, name: true, phone: true, role: true, avatar: true,
        preferredPosition: true, preferredFoot: true, skillLevel: true,
        fitnessLevel: true, gkWillingness: true, notes: true,
      },
    })

    return Response.json({ success: true, user: updated })
  } catch (error) {
    console.error('profile update error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
