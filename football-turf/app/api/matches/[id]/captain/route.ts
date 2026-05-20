import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createNotification, captainAssignedNotification } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: matchId } = await params
    const body = await request.json()
    const { teamId, userId } = body

    if (!teamId || !userId) {
      return Response.json({ error: 'teamId and userId are required' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    const team = await prisma.team.findUnique({ where: { id: teamId } })
    if (!team) {
      return Response.json({ error: 'Team not found' }, { status: 404 })
    }

    // Deactivate existing captain for this team
    await prisma.captainAssignment.updateMany({
      where: { matchId, teamId, isActive: true },
      data: { isActive: false },
    })

    // Create new captain assignment
    const captain = await prisma.captainAssignment.create({
      data: {
        matchId,
        teamId,
        userId,
        assignedBy: session.userId,
        isActive: true,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        team: { select: { id: true, name: true, color: true } },
      },
    })

    // Notify the new captain
    const notification = captainAssignedNotification(userId, match.title, matchId, team.name)
    await createNotification(notification)

    return Response.json({ success: true, captain })
  } catch (error) {
    console.error('POST /matches/[id]/captain error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
