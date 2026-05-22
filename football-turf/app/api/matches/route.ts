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

    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
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
      costPerPlayer,
      notes,
      turfRules,
      // accept both naming conventions from the form
      jerseyColorA, jerseyColorB,
      jerseyTeamA, jerseyTeamB,
      groupId,
      isRecurring,
      recurringDays,
      recurringPattern,
    } = body

    if (!title || !date || !startTime || !endTime || !venueId || !maxPlayers) {
      return Response.json({ error: 'title, date, startTime, endTime, venueId and maxPlayers are required' }, { status: 400 })
    }

    const parsedMax = parseInt(String(maxPlayers), 10)

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
        maxPlayers: parsedMax,
        minPlayers: Math.max(2, Math.floor(parsedMax / 2)),
        costPerPlayer: costPerPlayer ?? 0,
        totalCost: (costPerPlayer ?? 0) * parsedMax,
        notes: notes ?? null,
        turfRules: turfRules ?? null,
        jerseyTeamA: jerseyTeamA ?? jerseyColorA ?? '#10b981',
        jerseyTeamB: jerseyTeamB ?? jerseyColorB ?? '#3b82f6',
        groupId: groupId ?? null,
        isRecurring: isRecurring ?? false,
        recurringPattern: recurringPattern ?? (recurringDays?.length ? JSON.stringify(recurringDays) : null),
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
