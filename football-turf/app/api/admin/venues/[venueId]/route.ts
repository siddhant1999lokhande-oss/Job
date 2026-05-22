import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'

type Params = { params: Promise<{ venueId: string }> }

export async function PATCH(request: Request, props: Params) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { venueId } = await props.params
    const { name, address, city, mapLink } = await request.json()
    const venue = await prisma.venue.update({
      where: { id: venueId },
      data: {
        ...(name && { name }),
        ...(address && { address }),
        ...(city && { city }),
        mapLink: mapLink ?? null,
      },
    })
    return Response.json({ success: true, venue })
  } catch (error) {
    console.error('PATCH /admin/venues error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: Params) {
  try {
    const session = await getSession(request)
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { venueId } = await props.params
    await prisma.venue.update({
      where: { id: venueId },
      data: { isActive: false },
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('DELETE /admin/venues error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
