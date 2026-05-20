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

    const { id: matchId } = await params

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: { where: { status: { not: 'CANCELLED' } } },
        waitlist: { where: { status: 'WAITING' } },
      },
    })

    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    if (!['UPCOMING', 'CONFIRMED'].includes(match.status)) {
      return Response.json({ error: 'Match is not open for registration' }, { status: 400 })
    }

    const alreadyRegistered = match.players.some((p: { userId: string }) => p.userId === session.userId)
    if (alreadyRegistered) {
      return Response.json({ error: 'Already registered for this match' }, { status: 400 })
    }

    const alreadyWaitlisted = await prisma.waitlistEntry.findUnique({
      where: { matchId_userId: { matchId, userId: session.userId } },
    })
    if (alreadyWaitlisted && alreadyWaitlisted.status === 'WAITING') {
      return Response.json({ error: 'Already on the waitlist for this match' }, { status: 400 })
    }

    const isFull = match.players.length >= match.maxPlayers

    if (isFull) {
      // Add to waitlist
      const position = match.waitlist.length + 1
      await prisma.waitlistEntry.upsert({
        where: { matchId_userId: { matchId, userId: session.userId } },
        update: { status: 'WAITING', position },
        create: { matchId, userId: session.userId, position },
      })

      return Response.json({ success: true, status: 'waitlisted', position })
    }

    // Register player
    await prisma.matchPlayer.create({
      data: {
        matchId,
        userId: session.userId,
        status: 'REGISTERED',
      },
    })

    // Create payment record if cost > 0
    if (match.costPerPlayer > 0) {
      await prisma.payment.create({
        data: {
          matchId,
          userId: session.userId,
          amount: match.costPerPlayer,
          status: 'PENDING',
        },
      })
    }

    // Update or create PlayerStats
    await prisma.playerStats.upsert({
      where: { userId: session.userId },
      update: { matchesPlayed: { increment: 1 } },
      create: { userId: session.userId, matchesPlayed: 1 },
    })

    return Response.json({ success: true, status: 'joined' })
  } catch (error) {
    console.error('POST /matches/[id]/join error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
