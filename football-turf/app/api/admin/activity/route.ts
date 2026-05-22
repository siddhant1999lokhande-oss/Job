import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const events = await prisma.matchEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, type: true, description: true, createdAt: true },
    })

    const announcements = await prisma.announcement.findMany({
      orderBy: { sentAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, sentAt: true },
    })

    const items = [
      ...events.map(e => ({
        id: e.id,
        type: e.type,
        message: e.description ?? e.type,
        createdAt: e.createdAt.toISOString(),
      })),
      ...announcements.map(a => ({
        id: a.id,
        type: 'ANNOUNCEMENT',
        message: a.content,
        createdAt: a.sentAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20)

    return Response.json({ items })
  } catch (error) {
    console.error('admin activity error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
