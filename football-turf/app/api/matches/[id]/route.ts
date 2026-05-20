import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createBulkNotifications, matchCancelledNotification } from '@/lib/notifications'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        venue: true,
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                skillLevel: true,
                preferredPosition: true,
                phone: true,
              },
            },
          },
        },
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true, preferredPosition: true },
                },
              },
            },
            captains: {
              where: { isActive: true },
              include: {
                user: { select: { id: true, name: true, avatar: true } },
              },
            },
          },
        },
        announcements: {
          orderBy: { sentAt: 'desc' },
        },
        captainAssignments: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            team: { select: { id: true, name: true, color: true } },
          },
        },
      },
    })

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    return Response.json(match)
  } catch (error) {
    console.error('GET /matches/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.date !== undefined && { date: new Date(body.date) }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.venueId !== undefined && { venueId: body.venueId }),
        ...(body.format !== undefined && { format: body.format }),
        ...(body.matchType !== undefined && { matchType: body.matchType }),
        ...(body.skillLevel !== undefined && { skillLevel: body.skillLevel }),
        ...(body.maxPlayers !== undefined && { maxPlayers: body.maxPlayers }),
        ...(body.minPlayers !== undefined && { minPlayers: body.minPlayers }),
        ...(body.costPerPlayer !== undefined && { costPerPlayer: body.costPerPlayer }),
        ...(body.totalCost !== undefined && { totalCost: body.totalCost }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.turfRules !== undefined && { turfRules: body.turfRules }),
        ...(body.jerseyTeamA !== undefined && { jerseyTeamA: body.jerseyTeamA }),
        ...(body.jerseyTeamB !== undefined && { jerseyTeamB: body.jerseyTeamB }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.weather !== undefined && { weather: body.weather }),
        ...(body.confirmDeadline !== undefined && {
          confirmDeadline: new Date(body.confirmDeadline),
        }),
      },
    })

    return Response.json({ success: true, match })
  } catch (error) {
    console.error('PATCH /matches/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        players: { select: { userId: true } },
      },
    })

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    await prisma.match.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    const notifications = match.players.map((p: { userId: string }) =>
      matchCancelledNotification(p.userId, match.title)
    )
    await createBulkNotifications(notifications)

    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /matches/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
