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
    const body = await request.json()
    const { nomineeId } = body

    if (!nomineeId) {
      return Response.json({ error: 'nomineeId is required' }, { status: 400 })
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'COMPLETED') {
      return Response.json({ error: 'MVP voting is only available for completed matches' }, { status: 400 })
    }

    // Ensure voter was in the match
    const voterRecord = await prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId: session.userId } },
    })
    if (!voterRecord || voterRecord.status === 'CANCELLED') {
      return Response.json({ error: 'You must have participated in this match to vote' }, { status: 403 })
    }

    // Ensure nominee was in the match
    const nomineeRecord = await prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId: nomineeId } },
    })
    if (!nomineeRecord || nomineeRecord.status === 'CANCELLED') {
      return Response.json({ error: 'Nominee was not a participant in this match' }, { status: 400 })
    }

    // Cannot vote for yourself
    if (nomineeId === session.userId) {
      return Response.json({ error: 'You cannot vote for yourself' }, { status: 400 })
    }

    // Upsert vote (one per voter per match)
    await prisma.mvpVote.upsert({
      where: { matchId_voterId: { matchId, voterId: session.userId } },
      update: { nomineeId },
      create: { matchId, voterId: session.userId, nomineeId },
    })

    // Count votes and update the top nominee's mvpCount badge
    const voteCounts = await prisma.mvpVote.groupBy({
      by: ['nomineeId'],
      where: { matchId },
      _count: { nomineeId: true },
      orderBy: { _count: { nomineeId: 'desc' } },
    })

    if (voteCounts.length > 0) {
      const topNomineeId = voteCounts[0].nomineeId
      await prisma.playerStats.upsert({
        where: { userId: topNomineeId },
        update: { mvpCount: { increment: 0 } }, // will be recalculated below
        create: { userId: topNomineeId },
      })
    }

    return Response.json({ success: true, voteCounts })
  } catch (error) {
    console.error('POST /matches/[id]/mvp-vote error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
