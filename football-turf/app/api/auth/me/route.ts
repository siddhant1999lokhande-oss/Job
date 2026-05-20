import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        reliabilityScore: true,
        stats: true,
      },
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      preferredPosition: user.preferredPosition,
      preferredFoot: user.preferredFoot,
      skillLevel: user.skillLevel,
      fitnessLevel: user.fitnessLevel,
      gkWillingness: user.gkWillingness,
      notes: user.notes,
      isActive: user.isActive,
      createdAt: user.createdAt,
      reliabilityScore: user.reliabilityScore,
      playerStats: user.stats,
    })
  } catch (error) {
    console.error('me error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
