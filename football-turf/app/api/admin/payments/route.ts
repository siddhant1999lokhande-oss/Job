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
    const search = searchParams.get('search') ?? ''
    const matchId = searchParams.get('matchId') ?? ''
    const status = searchParams.get('status') ?? ''

    const payments = await prisma.payment.findMany({
      where: {
        AND: [
          matchId ? { matchId } : {},
          status ? { status } : {},
          search ? {
            OR: [
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { phone: { contains: search } } },
              { match: { title: { contains: search, mode: 'insensitive' } } },
            ],
          } : {},
        ],
      },
      include: {
        user: { select: { name: true } },
        match: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = payments.map(p => ({
      id: p.id,
      playerName: p.user.name,
      matchTitle: p.match.title,
      matchId: p.matchId,
      amount: p.amount,
      status: p.status,
      method: p.method ?? undefined,
      paidAt: p.paidAt?.toISOString() ?? undefined,
      createdAt: p.createdAt.toISOString(),
    }))

    const total = result.reduce((s, p) => s + p.amount, 0)
    const paid = result.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount, 0)
    const pending = result.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0)

    return Response.json({
      payments: result,
      summary: { total, paid, pending },
    })
  } catch (error) {
    console.error('admin payments error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
