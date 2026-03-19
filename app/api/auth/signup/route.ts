import { NextRequest, NextResponse } from 'next/server'
import { sql, isNeonConfigured } from '@/lib/neon-client'
import * as bcrypt from 'bcryptjs'
import { generateVerificationToken, sendVerificationEmail } from '@/lib/email-service'
import { createSubscription } from '@/lib/subscription/subscription-service'

async function ensureTablesExist() {
  try {
    console.log('[v0] ===== STARTING TABLE RECREATION =====')
    
    // FORCE DROP everything first
    console.log('[v0] DROPPING images table...')
    try {
      await sql`DROP TABLE IF EXISTS images CASCADE`
      console.log('[v0] ✓ Images table dropped')
    } catch (e: any) {
      console.log('[v0] Images drop note:', e?.message)
    }
    
    console.log('[v0] DROPPING users table...')
    try {
      await sql`DROP TABLE IF EXISTS users CASCADE`
      console.log('[v0] ✓ Users table dropped')
    } catch (e: any) {
      console.log('[v0] Users drop note:', e?.message)
    }

    // RECREATE users table with ALL columns
    console.log('[v0] CREATING users table with all required columns...')
    await sql`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        email_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
    console.log('[v0] ✓ Users table created with columns: id, email, name, password_hash, avatar_url, email_verified, email_verification_token, email_verified_at, created_at, updated_at')
    
    // RECREATE images table
    console.log('[v0] CREATING images table...')
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
    console.log('[v0] ✓ Images table created')
    console.log('[v0] ===== TABLE RECREATION COMPLETE =====')
    
  } catch (error) {
    console.error('[v0] CRITICAL: Error in ensureTablesExist:', error)
    throw error
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
    const verificationToken = generateVerificationToken()

    // Create user
    try {
      const result = await sql`
        INSERT INTO users (email, name, password_hash, email_verification_token)
        VALUES (${email}, ${name || null}, ${passwordHash}, ${verificationToken})
        RETURNING id, email, name
      `

      if (!result || result.length === 0) {
        return NextResponse.json({ message: 'Failed to create user' }, { status: 500 })
      }

      const user = result[0]
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

      // Initialize subscription for new user
      try {
        await createSubscription(user.id)
      } catch (subError) {
        console.error('[v0] Error creating subscription:', subError)
        // Don't fail signup if subscription creation fails
      }

      // Send verification email
      console.log('[v0] Sending verification email to:', email)
      await sendVerificationEmail(email, verificationToken, name)

      console.log('[v0] User signed up:', user.id)
      console.log('[v0] Email verification required. User must verify email at:', email)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          email_verified: false,
        },
        token,
        message: 'Account created successfully. Please check your email to verify your account.',
      }, { status: 201 })
    } catch (insertError: any) {
      console.error('[v0] Insert error:', insertError)
      
      // If column doesn't exist, it might be an old table structure
      if (insertError?.code === '42703') {
        console.log('[v0] Schema mismatch, dropping and recreating users table...')
        try {
          await sql`DROP TABLE IF EXISTS users CASCADE`
          await ensureTablesExist()
          
          // Retry insert with verification token
          const passwordHash = await bcrypt.hash(password, 10)
          const verificationToken = generateVerificationToken()
          const result = await sql`
            INSERT INTO users (email, name, password_hash, email_verification_token)
            VALUES (${email}, ${name || null}, ${passwordHash}, ${verificationToken})
            RETURNING id, email, name
          `

          const user = result[0]
          const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64')

          // Initialize subscription for new user
          try {
            await createSubscription(user.id)
          } catch (subError) {
            console.error('[v0] Error creating subscription:', subError)
            // Don't fail signup if subscription creation fails
          }

          // Send verification email
          await sendVerificationEmail(email, verificationToken, name)

          return NextResponse.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              email_verified: false,
            },
            token,
            message: 'Account created successfully. Please check your email to verify your account.',
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
