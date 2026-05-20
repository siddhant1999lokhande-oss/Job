import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export type AuthUser = {
  userId: string
  role: string
}

const JWT_SECRET = process.env.JWT_SECRET ?? 'football-turf-jwt-secret-2024'

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser & jwt.JwtPayload
    return { userId: decoded.userId, role: decoded.role }
  } catch {
    return null
  }
}

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function hashOtp(otp: string): string {
  return bcrypt.hashSync(otp, 10)
}

export async function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash)
}

export async function getSession(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  return verifyToken(token)
}
