import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { supabase } from './supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'santa-jump-secret'

export interface JWTPayload {
  userId: string
  phone: string
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', payload.userId)
    .single()

  return user
}

// Dev accounts với OTP mặc định 123456
const DEV_EMAILS = ['congdat192@gmail.com']

export function generateOTP(email?: string): string {
  // Mock OTP mode hoặc dev email
  if (process.env.MOCK_OTP_ENABLED === 'true') {
    return '123456'
  }

  // Dev accounts luôn dùng OTP 123456
  if (email && DEV_EMAILS.includes(email)) {
    return '123456'
  }

  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function maskPhone(phone: string): string {
  if (phone.length < 6) return phone
  return phone.slice(0, 2) + '****' + phone.slice(-3)
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateVoucherCode(): string {
  const prefix = 'MKTD'
  const random = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `${prefix}-${random}`
}
