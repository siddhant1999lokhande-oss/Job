import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createBulkNotifications, teamAnnouncedNotification } from '@/lib/notifications'

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

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          where: { status: { not: 'CANCELLED' } },
          select: { userId: true },
        },
        teams: {
          include: {
            members: { select: { userId: true } },
          },
        },
      },
    })

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { teamsLocked: true },
    })

    // Build a userId -> teamName map
    const userTeamMap: Record<string, string> = {}
    for (const team of match.teams) {
      for (const member of team.members) {
        userTeamMap[member.userId] = team.name
      }
    }

    // Notify all registered players
    const notifications = match.players.map((p: (typeof match.players)[number]) =>
      teamAnnouncedNotification(
        p.userId,
        match.title,
        matchId,
        userTeamMap[p.userId] ?? 'Unknown Team'
      )
    )

    await createBulkNotifications(notifications)

    return Response.json({ success: true })
  } catch (error) {
    console.error('POST /matches/[id]/teams/lock error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
