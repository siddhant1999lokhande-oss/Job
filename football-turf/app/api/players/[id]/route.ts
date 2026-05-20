import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        reliabilityScore: true,
        stats: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        matchPlayers: {
          orderBy: { registeredAt: 'desc' },
          take: 10,
          include: {
            match: {
              select: { id: true, title: true, date: true, status: true, venue: { select: { name: true } } },
            },
          },
        },
      },
    })

    if (!user) {
      return Response.json({ error: 'Player not found' }, { status: 404 })
    }

    // Exclude sensitive fields
    const { ...profile } = user
    return Response.json({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      email: profile.email,
      preferredPosition: profile.preferredPosition,
      preferredFoot: profile.preferredFoot,
      skillLevel: profile.skillLevel,
      fitnessLevel: profile.fitnessLevel,
      gkWillingness: profile.gkWillingness,
      notes: profile.notes,
      role: profile.role,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      reliabilityScore: profile.reliabilityScore,
      stats: profile.stats,
      badges: profile.badges,
      recentMatches: profile.matchPlayers,
    })
  } catch (error) {
    console.error('GET /players/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Only admin or self can update
    if (session.role !== 'ADMIN' && session.userId !== id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      preferredPosition,
      preferredFoot,
      skillLevel,
      fitnessLevel,
      notes,
      gkWillingness,
    } = body

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(preferredPosition !== undefined && { preferredPosition }),
        ...(preferredFoot !== undefined && { preferredFoot }),
        ...(skillLevel !== undefined && { skillLevel }),
        ...(fitnessLevel !== undefined && { fitnessLevel }),
        ...(notes !== undefined && { notes }),
        ...(gkWillingness !== undefined && { gkWillingness }),
      },
      include: {
        reliabilityScore: true,
        stats: true,
      },
    })

    return Response.json({ success: true, user })
  } catch (error) {
    console.error('PATCH /players/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
