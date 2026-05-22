import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { name, address, city, mapLink } = await request.json()
    if (!name || !address || !city) {
      return Response.json({ error: 'name, address, and city are required' }, { status: 400 })
    }
    const venue = await prisma.venue.create({
      data: { name, address, city, mapLink: mapLink ?? null },
    })
    return Response.json({ success: true, venue }, { status: 201 })
  } catch (error) {
    console.error('POST /admin/venues error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
