import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') ?? ''
    const search = searchParams.get('search') ?? ''

    const matches = await prisma.match.findMany({
      where: {
        AND: [
          status && status !== 'all' ? { status } : {},
          search ? { title: { contains: search, mode: 'insensitive' } } : {},
        ],
      },
      include: {
        venue: { select: { name: true } },
        players: { select: { userId: true } },
        payments: { select: { status: true } },
      },
      orderBy: { date: 'desc' },
    })

    const result = matches.map(m => ({
      id: m.id,
      title: m.title,
      date: m.date,
      startTime: m.startTime,
      venue: m.venue?.name ?? 'TBD',
      format: m.format,
      status: m.status,
      currentPlayers: m.players.length,
      maxPlayers: m.maxPlayers,
      paidCount: m.payments.filter(p => p.status === 'PAID').length,
      costPerPlayer: m.costPerPlayer,
    }))

    return Response.json({ matches: result })
  } catch (error) {
    console.error('admin matches error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
