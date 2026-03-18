import { NextRequest, NextResponse } from 'next/server'
import { sql, isNeonConfigured } from '@/lib/neon-client'
import * as bcrypt from 'bcryptjs'

async function ensureTablesExist() {
  try {
    console.log('[v0] Ensuring database tables exist...')
    
    // First, try to add the missing name column if the table exists but doesn't have it
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)`
      console.log('[v0] Added name column to users table (if missing)')
    } catch (alterError: any) {
      // If alter fails, the table might not exist or there's another issue
      console.log('[v0] Alter table attempt (may be normal if table doesn\'t exist yet):', alterError?.message)
    }

    // Ensure users table exists with correct schema
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('[v0] Users table created or already exists')
    
    // Ensure images table exists with correct schema
    await sql`
      CREATE TABLE IF NOT EXISTS images (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        url TEXT NOT NULL,
        prompt TEXT NOT NULL,
        aspect_ratio VARCHAR(20) DEFAULT '1:1',
        seed INTEGER,
        is_favorited BOOLEAN DEFAULT FALSE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('[v0] Images table created or already exists')
    
  } catch (error) {
    console.error('[v0] Error ensuring tables:', error)
    // Try to recover by dropping and recreating
    try {
      console.log('[v0] Attempting to recover by recreating tables...')
      await sql`DROP TABLE IF EXISTS images CASCADE`
      await sql`DROP TABLE IF EXISTS users CASCADE`
      
      await sql`
        CREATE TABLE users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          password_hash VARCHAR(255) NOT NULL,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await sql`
        CREATE TABLE images (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          url TEXT NOT NULL,
          prompt TEXT NOT NULL,
          aspect_ratio VARCHAR(20) DEFAULT '1:1',
          seed INTEGER,
          is_favorited BOOLEAN DEFAULT FALSE,
          likes_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      console.log('[v0] Tables successfully recovered')
    } catch (recoveryError) {
      console.error('[v0] Table recovery failed:', recoveryError)
      throw recoveryError
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured || !sql) {
      return NextResponse.json({ message: 'Database not configured' }, { status: 500 })
    }

    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password required' }, { status: 400 })
    }

    // Ensure tables exist on first signup attempt
    await ensureTablesExist()

    // Check if user already exists
    try {
      const existingUser = await sql`
        SELECT id FROM users WHERE email = ${email}
      `

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json({ message: 'User already exists' }, { status: 409 })
      }
    } catch (checkError) {
      console.log('[v0] First signup, creating user table...')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    try {
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
    } catch (insertError: any) {
      console.error('[v0] Insert error:', insertError)
      
      // If column doesn't exist, it might be an old table structure
      if (insertError?.code === '42703') {
        console.log('[v0] Schema mismatch, dropping and recreating users table...')
        try {
          await sql`DROP TABLE IF EXISTS users CASCADE`
          await ensureTablesExist()
          
          // Retry insert
          const passwordHash = await bcrypt.hash(password, 10)
          const result = await sql`
            INSERT INTO users (email, name, password_hash)
            VALUES (${email}, ${name || null}, ${passwordHash})
            RETURNING id, email, name
          `

          const user = result[0]
          const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
            },
            token,
          }, { status: 201 })
        } catch (retryError) {
          console.error('[v0] Retry failed:', retryError)
          return NextResponse.json({ message: 'Failed to create user - database schema error' }, { status: 500 })
        }
      }
      
      throw insertError
    }
  } catch (error) {
    console.error('[v0] Signup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
