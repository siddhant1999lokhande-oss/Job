import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { message, playerIds } = await request.json()
    if (!message?.trim()) {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    let targetUserIds: string[]
    if (playerIds && Array.isArray(playerIds) && playerIds.length > 0) {
      targetUserIds = playerIds
    } else {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      })
      targetUserIds = users.map(u => u.id)
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: 'Announcement',
        content: message,
        createdById: session.userId,
      },
    })

    await prisma.notification.createMany({
      data: targetUserIds.map(userId => ({
        userId,
        type: 'ANNOUNCEMENT',
        title: 'Announcement',
        body: message,
        data: JSON.stringify({ announcementId: announcement.id }),
      })),
    })

    return Response.json({ success: true, sent: targetUserIds.length })
  } catch (error) {
    console.error('announce error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
