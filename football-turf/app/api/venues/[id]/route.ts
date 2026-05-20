import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const venue = await prisma.venue.findUnique({
      where: { id },
      include: {
        matches: {
          where: {
            status: { in: ['UPCOMING', 'CONFIRMED'] },
            date: { gte: new Date() },
          },
          orderBy: { date: 'asc' },
          take: 10,
          include: {
            _count: { select: { players: true } },
          },
        },
      },
    })

    if (!venue) {
      return Response.json({ error: 'Venue not found' }, { status: 404 })
    }

    return Response.json(venue)
  } catch (error) {
    console.error('GET /venues/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const venue = await prisma.venue.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.latitude !== undefined && { latitude: body.latitude }),
        ...(body.longitude !== undefined && { longitude: body.longitude }),
        ...(body.mapLink !== undefined && { mapLink: body.mapLink }),
        ...(body.amenities !== undefined && { amenities: JSON.stringify(body.amenities) }),
        ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    })

    return Response.json({ success: true, venue })
  } catch (error) {
    console.error('PATCH /venues/[id] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
