import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { createNotification, waitlistPromotedNotification } from '@/lib/notifications'

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

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId: session.userId } },
    })

    if (!matchPlayer || matchPlayer.status === 'CANCELLED') {
      return Response.json({ error: 'You are not registered for this match' }, { status: 400 })
    }

    // Check if within 2 hours of match start
    const matchDateTime = new Date(match.date)
    const [hours, minutes] = match.startTime.split(':').map(Number)
    matchDateTime.setHours(hours, minutes, 0, 0)

    const twoHoursBefore = new Date(matchDateTime.getTime() - 2 * 60 * 60 * 1000)
    const isLateCancel = new Date() >= twoHoursBefore

    await prisma.matchPlayer.update({
      where: { id: matchPlayer.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        isLateCancel,
        ...(isLateCancel && {
          cancellationReason: 'Late cancellation — reliability penalty applied',
        }),
      },
    })

    // Auto-promote first waitlist entry
    const firstWaiting = await prisma.waitlistEntry.findFirst({
      where: { matchId, status: 'WAITING' },
      orderBy: { position: 'asc' },
    })

    if (firstWaiting) {
      await prisma.waitlistEntry.update({
        where: { id: firstWaiting.id },
        data: { status: 'PROMOTED', promotedAt: new Date() },
      })

      await prisma.matchPlayer.create({
        data: {
          matchId,
          userId: firstWaiting.userId,
          status: 'REGISTERED',
        },
      })

      const notification = waitlistPromotedNotification(
        firstWaiting.userId,
        match.title,
        matchId
      )
      await createNotification(notification)
    }

    return Response.json({ success: true, isLateCancel })
  } catch (error) {
    console.error('POST /matches/[id]/leave error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
