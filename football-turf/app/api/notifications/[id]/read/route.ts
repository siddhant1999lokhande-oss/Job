import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

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

    const notification = await prisma.notification.findUnique({ where: { id } })
    if (!notification) {
      return Response.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /notifications/[id]/read error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
