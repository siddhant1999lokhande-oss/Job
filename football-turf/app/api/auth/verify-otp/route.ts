import { prisma } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone, otp, name } = body

    if (!phone || !otp) {
      return Response.json({ error: 'Phone and OTP are required.' }, { status: 400 })
    }

    const tokenRecord = await prisma.otpToken.findFirst({
      where: {
        phone,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!tokenRecord) {
      return Response.json({ error: 'Invalid or expired OTP' }, { status: 401 })
    }

    await prisma.otpToken.update({
      where: { id: tokenRecord.id },
      data: { used: true },
    })

    let user = await prisma.user.findUnique({ where: { phone } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || phone,
          role: 'PLAYER',
        },
      })
    } else if (name && !user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name },
      })
    }

    const token = signToken({ userId: user.id, role: user.role })

    return Response.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
        skillLevel: user.skillLevel,
        preferredPosition: user.preferredPosition,
      },
    })
  } catch (error) {
    console.error('verify-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
