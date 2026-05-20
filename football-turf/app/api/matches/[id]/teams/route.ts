import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { balanceTeams, BalancingMode, PlayerForBalancing } from '@/lib/team-balancer'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: matchId } = await params

    const teams = await prisma.team.findMany({
      where: { matchId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, preferredPosition: true, skillLevel: true },
            },
          },
        },
        captains: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    })

    return Response.json({ teams })
  } catch (error) {
    console.error('GET /matches/[id]/teams error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: matchId } = await params
    const body = await request.json()
    const { mode, teams: manualTeams } = body

    const match = await prisma.match.findUnique({ where: { id: matchId } })
    if (!match) {
      return Response.json({ error: 'Match not found' }, { status: 404 })
    }

    // Delete existing teams
    await prisma.team.deleteMany({ where: { matchId } })

    if (manualTeams && Array.isArray(manualTeams)) {
      // Save manually provided teams
      const createdTeams = await Promise.all(
        manualTeams.map(async (t: { name: string; color: string; playerIds: string[] }) => {
          const team = await prisma.team.create({
            data: { matchId, name: t.name, color: t.color ?? '#FF0000' },
          })
          if (t.playerIds && t.playerIds.length > 0) {
            await prisma.teamMember.createMany({
              data: t.playerIds.map((userId: string) => ({ teamId: team.id, userId })),
            })
          }
          return team
        })
      )

      const teamsWithMembers = await prisma.team.findMany({
        where: { matchId },
        include: { members: { include: { user: true } } },
      })

      return Response.json({ teams: teamsWithMembers })
    }

    // Auto-generate teams using balancer
    if (!mode) {
      return Response.json({ error: 'mode or teams is required' }, { status: 400 })
    }

    const registeredPlayers = await prisma.matchPlayer.findMany({
      where: {
        matchId,
        status: { in: ['REGISTERED', 'CONFIRMED'] },
      },
      include: {
        user: true,
      },
    })

    const playersForBalancing: PlayerForBalancing[] = registeredPlayers.map((mp: (typeof registeredPlayers)[number]) => ({
      id: mp.userId,
      name: mp.user.name,
      skillLevel: mp.user.skillLevel,
      preferredPosition: mp.user.preferredPosition,
      gkWillingness: mp.user.gkWillingness,
      fitnessLevel: mp.user.fitnessLevel,
      versatility: mp.user.versatility,
    }))

    const result = balanceTeams(playersForBalancing, mode as BalancingMode)

    const teamA = await prisma.team.create({
      data: { matchId, name: 'Team A', color: match.jerseyTeamA },
    })
    const teamB = await prisma.team.create({
      data: { matchId, name: 'Team B', color: match.jerseyTeamB },
    })

    if (result.teamA.length > 0) {
      await prisma.teamMember.createMany({
        data: result.teamA.map((p) => ({ teamId: teamA.id, userId: p.id })),
      })
    }
    if (result.teamB.length > 0) {
      await prisma.teamMember.createMany({
        data: result.teamB.map((p) => ({ teamId: teamB.id, userId: p.id })),
      })
    }

    const teamsWithMembers = await prisma.team.findMany({
      where: { matchId },
      include: { members: { include: { user: true } } },
    })

    return Response.json({ teams: teamsWithMembers, balanceScore: result.balanceScore })
  } catch (error) {
    console.error('POST /matches/[id]/teams error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
