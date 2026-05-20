import { prisma } from '@/lib/db'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const skillLevel = searchParams.get('skillLevel')
    const position = searchParams.get('position')
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const where: Record<string, unknown> = { isActive: true }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ]
    }

    if (skillLevel) {
      where.skillLevel = parseInt(skillLevel, 10)
    }

    if (position) {
      where.preferredPosition = position
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
        preferredPosition: true,
        preferredFoot: true,
        skillLevel: true,
        fitnessLevel: true,
        gkWillingness: true,
        role: true,
        createdAt: true,
        reliabilityScore: true,
        stats: true,
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.user.count({ where })

    return Response.json({ players: users, total, limit, offset })
  } catch (error) {
    console.error('GET /players error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
