import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const groupId = searchParams.get('groupId')
    const upcoming = searchParams.get('upcoming')
    const limit = parseInt(searchParams.get('limit') ?? '20', 10)
    const offset = parseInt(searchParams.get('offset') ?? '0', 10)

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    } else if (upcoming === 'true') {
      where.status = { in: ['UPCOMING', 'CONFIRMED'] }
      where.date = { gte: new Date() }
    }

    if (groupId) {
      where.groupId = groupId
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        venue: true,
        _count: { select: { players: true } },
      },
      orderBy: { date: 'asc' },
      take: limit,
      skip: offset,
    })

    const total = await prisma.match.count({ where })

    return Response.json({ matches, total, limit, offset })
  } catch (error) {
    console.error('GET /matches error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      date,
      startTime,
      endTime,
      venueId,
      format,
      matchType,
      skillLevel,
      maxPlayers,
      minPlayers,
      costPerPlayer,
      totalCost,
      notes,
      turfRules,
      jerseyTeamA,
      jerseyTeamB,
      groupId,
      isRecurring,
      recurringPattern,
    } = body

    if (!title || !date || !startTime || !endTime || !venueId || !maxPlayers || !minPlayers) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const match = await prisma.match.create({
      data: {
        title,
        date: new Date(date),
        startTime,
        endTime,
        venueId,
        format: format ?? '6v6',
        matchType: matchType ?? 'CASUAL',
        skillLevel: skillLevel ?? 'ALL',
        maxPlayers: parseInt(maxPlayers, 10),
        minPlayers: parseInt(minPlayers, 10),
        costPerPlayer: costPerPlayer ?? 0,
        totalCost: totalCost ?? 0,
        notes: notes ?? null,
        turfRules: turfRules ?? null,
        jerseyTeamA: jerseyTeamA ?? '#FF0000',
        jerseyTeamB: jerseyTeamB ?? '#0000FF',
        groupId: groupId ?? null,
        isRecurring: isRecurring ?? false,
        recurringPattern: recurringPattern ?? null,
        createdById: session.userId,
      },
      include: {
        venue: true,
      },
    })

    return Response.json({ success: true, match }, { status: 201 })
  } catch (error) {
    console.error('POST /matches error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
