import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      take: 20,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId: session.userId, isRead: false },
    })

    return Response.json({ notifications, unreadCount })
  } catch (error) {
    console.error('GET /notifications error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { userId: session.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /notifications error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
