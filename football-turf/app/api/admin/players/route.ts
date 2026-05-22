import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

function skillIntToLabel(level: number): string {
  if (level <= 3) return 'BEGINNER'
  if (level <= 6) return 'INTERMEDIATE'
  return 'ADVANCED'
}

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const skillLevelFilter = searchParams.get('skillLevel') ?? ''

    const skillRange = skillLevelFilter === 'BEGINNER' ? { lte: 3 }
      : skillLevelFilter === 'INTERMEDIATE' ? { gte: 4, lte: 6 }
      : skillLevelFilter === 'ADVANCED' ? { gte: 7 }
      : undefined

    const users = await prisma.user.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          } : {},
          skillRange ? { skillLevel: skillRange } : {},
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        skillLevel: true,
        preferredPosition: true,
        isActive: true,
        stats: {
          select: { matchesPlayed: true },
        },
        reliabilityScore: {
          select: { score: true, tier: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const players = users.map(u => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      role: u.role,
      skillLevel: skillIntToLabel(u.skillLevel),
      preferredPosition: u.preferredPosition ?? undefined,
      isActive: u.isActive,
      matchesPlayed: u.stats?.matchesPlayed ?? 0,
      reliabilityScore: u.reliabilityScore?.score ?? 75,
      reliabilityTier: u.reliabilityScore?.tier ?? 'SILVER',
    }))

    return Response.json({ players })
  } catch (error) {
    console.error('admin players error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
