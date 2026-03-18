import { NextRequest, NextResponse } from 'next/server'
import { sql, isNeonConfigured } from '@/lib/neon-client'
import * as bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured || !sql) {
      return NextResponse.json({ message: 'Database not configured' }, { status: 500 })
    }

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const result = await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name || null}, ${passwordHash})
      RETURNING id, email, name
    `

    if (!result || result.length === 0) {
      return NextResponse.json({ message: 'Failed to create user' }, { status: 500 })
    }

    const user = result[0]
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

    console.log('[v0] User signed up:', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
