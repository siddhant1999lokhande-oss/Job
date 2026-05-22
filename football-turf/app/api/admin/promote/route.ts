import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { userId, action } = await request.json()
    if (!userId || !action) {
      return Response.json({ error: 'userId and action required' }, { status: 400 })
    }
    if (!['promote', 'demote'].includes(action)) {
      return Response.json({ error: 'action must be promote or demote' }, { status: 400 })
    }

    // Super admin can't be demoted by a regular admin
    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) return Response.json({ error: 'User not found' }, { status: 404 })
    if (target.role === 'SUPER_ADMIN') {
      return Response.json({ error: 'Cannot change a super admin' }, { status: 403 })
    }
    // Prevent self-demotion
    if (userId === session.userId && action === 'demote') {
      return Response.json({ error: 'Cannot demote yourself' }, { status: 400 })
    }

    const newRole = action === 'promote' ? 'ADMIN' : 'PLAYER'
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, name: true, phone: true, role: true },
    })

    return Response.json({ success: true, user: updated })
  } catch (error) {
    console.error('promote error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
