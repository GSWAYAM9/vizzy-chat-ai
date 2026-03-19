import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon-client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Verification token is required' }, { status: 400 })
    }

    console.log('[v0] Verifying email with token:', token.substring(0, 10) + '...')

    // Find user with this verification token
    const users = await sql`
      SELECT id, email, email_verified FROM users WHERE email_verification_token = ${token}
    `

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Invalid or expired verification token' }, { status: 400 })
    }

    const user = users[0]

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        message: 'Email already verified',
        verified: true,
      }, { status: 200 })
    }

    // Mark email as verified
    await sql`
      UPDATE users
      SET email_verified = true, email_verified_at = NOW(), email_verification_token = NULL
      WHERE id = ${user.id}
    `

    console.log('[v0] Email verified for user:', user.id)

    return NextResponse.json({
      message: 'Email verified successfully',
      verified: true,
      email: user.email,
    }, { status: 200 })
  } catch (error) {
    console.error('[v0] Email verification error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
