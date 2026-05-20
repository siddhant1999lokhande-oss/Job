import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [
      totalPlayers,
      upcomingMatches,
      revenueData,
      unpaidData,
      noShowData,
      attendanceData,
    ] = await Promise.all([
      // Total active players
      prisma.user.count({ where: { isActive: true } }),

      // Upcoming matches
      prisma.match.count({
        where: { status: { in: ['UPCOMING', 'CONFIRMED'] }, date: { gte: new Date() } },
      }),

      // Total revenue (paid payments)
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),

      // Unpaid amount
      prisma.payment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),

      // No-show stats
      prisma.matchPlayer.count({ where: { status: 'NO_SHOW' } }),

      // Attendance stats
      prisma.matchPlayer.count({ where: { status: 'ATTENDED' } }),
    ])

    // Calculate no-show rate
    const totalRegistrations = await prisma.matchPlayer.count({
      where: { status: { in: ['ATTENDED', 'NO_SHOW'] } },
    })
    const noShowRate = totalRegistrations > 0
      ? ((noShowData / totalRegistrations) * 100).toFixed(1)
      : '0.0'

    // Average attendance per completed match
    const completedMatches = await prisma.match.count({ where: { status: 'COMPLETED' } })
    const avgAttendance = completedMatches > 0
      ? (attendanceData / completedMatches).toFixed(1)
      : '0.0'

    return Response.json({
      totalPlayers,
      upcomingMatches,
      totalRevenue: revenueData._sum.amount ?? 0,
      unpaidAmount: unpaidData._sum.amount ?? 0,
      noShowRate: parseFloat(noShowRate),
      avgAttendance: parseFloat(avgAttendance),
    })
  } catch (error) {
    console.error('GET /admin/stats error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
