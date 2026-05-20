import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const venues = await prisma.venue.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    })

    return Response.json({ venues })
  } catch (error) {
    console.error('GET /venues error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session || session.role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, address, city, latitude, longitude, mapLink, amenities, photos } = body

    if (!name || !address || !city) {
      return Response.json({ error: 'name, address, and city are required' }, { status: 400 })
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        address,
        city,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        mapLink: mapLink ?? null,
        amenities: amenities ? JSON.stringify(amenities) : null,
        photos: photos ? JSON.stringify(photos) : null,
      },
    })

    return Response.json({ success: true, venue }, { status: 201 })
  } catch (error) {
    console.error('POST /venues error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
