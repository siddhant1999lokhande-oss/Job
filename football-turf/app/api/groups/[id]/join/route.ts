import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return Response.json({ error: 'inviteCode is required' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) {
      return Response.json({ error: 'Group not found' }, { status: 404 })
    }

    if (group.inviteCode !== inviteCode) {
      return Response.json({ error: 'Invalid invite code' }, { status: 400 })
    }

    // Check if already a member
    const existing = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: session.userId } },
    })

    if (existing) {
      return Response.json({ error: 'Already a member of this group' }, { status: 400 })
    }

    const membership = await prisma.groupMember.create({
      data: {
        groupId,
        userId: session.userId,
        role: 'MEMBER',
      },
      include: {
        group: true,
      },
    })

    return Response.json({ success: true, group: membership.group, role: membership.role })
  } catch (error) {
    console.error('POST /groups/[id]/join error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
