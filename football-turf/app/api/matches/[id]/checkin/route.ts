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

    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { matchId_userId: { matchId, userId: session.userId } },
    })

    if (!matchPlayer) {
      return Response.json({ error: 'You are not registered for this match' }, { status: 400 })
    }

    if (matchPlayer.status === 'CANCELLED') {
      return Response.json({ error: 'You have cancelled your registration' }, { status: 400 })
    }

    await prisma.matchPlayer.update({
      where: { id: matchPlayer.id },
      data: {
        checkedInAt: new Date(),
        status: 'ATTENDED',
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('POST /matches/[id]/checkin error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
