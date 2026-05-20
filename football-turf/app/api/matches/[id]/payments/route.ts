import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: matchId } = await params

    const payments = await prisma.payment.findMany({
      where: { matchId },
      include: {
        user: { select: { id: true, name: true, phone: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ payments })
  } catch (error) {
    console.error('GET /matches/[id]/payments error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: matchId } = await params
    const body = await request.json()
    const { method, transactionId, upiRef, screenshot } = body

    if (!method) {
      return Response.json({ error: 'method is required' }, { status: 400 })
    }

    const existing = await prisma.payment.findFirst({
      where: { matchId, userId: session.userId },
    })

    if (!existing) {
      return Response.json({ error: 'No payment record found for this match' }, { status: 404 })
    }

    const payment = await prisma.payment.update({
      where: { id: existing.id },
      data: {
        method,
        transactionId: transactionId ?? null,
        upiRef: upiRef ?? null,
        screenshot: screenshot ?? null,
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    return Response.json({ success: true, payment })
  } catch (error) {
    console.error('POST /matches/[id]/payments error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
