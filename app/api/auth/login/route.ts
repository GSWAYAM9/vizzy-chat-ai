import { NextRequest, NextResponse } from 'next/server'
import { sql, isNeonConfigured } from '@/lib/neon-client'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured || !sql) {
      return NextResponse.json({ message: 'Database not configured' }, { status: 500 })
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 })
    }

    // Find user
    const users = await sql`
      SELECT id, email, name, password_hash FROM users WHERE email = ${email}
    `

    if (!users || users.length === 0) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const user = users[0]

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 })
    }

    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    console.log('[v0] User logged in:', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    }, { status: 200 })
  } catch (error) {
    console.error('[v0] Login error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
