import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params

    const events = await prisma.matchEvent.findMany({
      where: { matchId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        team: { select: { id: true, name: true, color: true } },
      },
      orderBy: [{ minute: 'asc' }, { createdAt: 'asc' }],
    })

    return Response.json({ events })
  } catch (error) {
    console.error('GET /matches/[id]/events error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matchId } = await params
    const body = await request.json()
    const { type, minute, teamId, description, userId: targetUserId } = body

    if (!type) {
      return Response.json({ error: 'type is required' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId,
        userId: targetUserId ?? session.userId,
        type,
        minute: minute ?? null,
        teamId: teamId ?? null,
        description: description ?? null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        team: { select: { id: true, name: true, color: true } },
      },
    })

    // Update team score and player stats for goals
    if (type === 'GOAL') {
      if (teamId) {
        await prisma.team.update({
          where: { id: teamId },
          data: { score: { increment: 1 } },
        })
      }
      const scorerId = targetUserId ?? session.userId
      await prisma.playerStats.upsert({
        where: { userId: scorerId },
        update: { goals: { increment: 1 } },
        create: { userId: scorerId, goals: 1 },
      })
    }

    // Update player stats for assists
    if (type === 'ASSIST') {
      const assisterId = targetUserId ?? session.userId
      await prisma.playerStats.upsert({
        where: { userId: assisterId },
        update: { assists: { increment: 1 } },
        create: { userId: assisterId, assists: 1 },
      })
    }

    return Response.json({ success: true, event })
  } catch (error) {
    console.error('POST /matches/[id]/events error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
