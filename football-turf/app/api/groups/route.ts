import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.groupMember.findMany({
      where: { userId: session.userId },
      include: {
        group: {
          include: {
            _count: { select: { members: true, matches: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    })

    const groups = memberships.map((m: (typeof memberships)[number]) => ({
      ...m.group,
      myRole: m.role,
      joinedAt: m.joinedAt,
    }))

    return Response.json({ groups })
  } catch (error) {
    console.error('GET /groups error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, avatar, isPrivate } = body

    if (!name) {
      return Response.json({ error: 'name is required' }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: {
        name,
        description: description ?? null,
        avatar: avatar ?? null,
        isPrivate: isPrivate ?? false,
        members: {
          create: {
            userId: session.userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    })

    return Response.json({ success: true, group }, { status: 201 })
  } catch (error) {
    console.error('POST /groups error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
