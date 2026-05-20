import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createBulkNotifications } from '@/lib/notifications'

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
    const { title, content, type, channels } = body

    if (!title || !content) {
      return Response.json({ error: 'title and content are required' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          where: { status: { not: 'CANCELLED' } },
          select: { userId: true },
        },
      },
    })

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        matchId,
        createdById: session.userId,
        title,
        content,
        type: type ?? 'INFO',
        channels: channels ?? 'IN_APP',
      },
    })

    // Create in-app notifications for all registered players
    const notifications = match.players.map((p: (typeof match.players)[number]) => ({
      userId: p.userId,
      type: 'ANNOUNCEMENT',
      title,
      body: content,
      data: { matchId, announcementId: announcement.id },
    }))

    await createBulkNotifications(notifications)

    return Response.json({ success: true, announcement })
  } catch (error) {
    console.error('POST /matches/[id]/announce error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
