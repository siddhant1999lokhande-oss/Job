import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  request: Request,
  props: { params: Promise<{ paymentId: string }> },
) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { paymentId } = await props.params
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
    if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'PAID', paidAt: new Date(), method: 'CASH' },
      select: { id: true, status: true, paidAt: true },
    })

    return Response.json({ success: true, payment: updated })
  } catch (error) {
    console.error('mark-paid error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
