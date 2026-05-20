import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { phone } = body

    if (!phone || !/^\d{10}$/.test(phone)) {
      return Response.json({ error: 'Invalid phone number. Must be 10 digits.' }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.otpToken.create({
      data: {
        phone,
        otp,
        expiresAt,
      },
    })

    // In production, send via SMS. For demo, return in response.
    return Response.json({ success: true, otp, message: 'OTP sent' })
  } catch (error) {
    console.error('send-otp error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
