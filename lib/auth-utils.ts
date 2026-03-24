import { NextRequest } from 'next/server'

export interface SessionUser {
  id: string
  email: string
  name?: string
}

export interface Session {
  access_token: string
  user: SessionUser
}

/**
 * Extract session from Authorization header
 * Format: "Bearer <token>"
 * Token format: "<user_id>:<timestamp>" in base64
 */
export async function getSession(request?: NextRequest): Promise<Session | null> {
  try {
    let authHeader = ''

    // Try to get from request header if provided
    if (request) {
      authHeader = request.headers.get('Authorization') || ''
    }

    if (!authHeader) {
      console.log('[AUTH] No Authorization header found')
      return null
    }

    // Parse Bearer token
    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('[AUTH] Invalid Authorization header format')
      return null
    }

    const token = parts[1]

    // Decode token (format: "user_id:timestamp")
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [userId, timestamp] = decoded.split(':')

      if (!userId) {
        console.log('[AUTH] Invalid token format')
        return null
      }

      // Create session object
      const session: Session = {
        access_token: token,
        user: {
          id: userId,
          email: '', // Email not stored in token
          name: '',
        },
      }

      console.log('[AUTH] Session extracted for user:', userId)
      return session
    } catch (decodeError) {
      console.log('[AUTH] Failed to decode token:', decodeError)
      return null
    }
  } catch (error) {
    console.error('[AUTH] Error getting session:', error)
    return null
  }
}

/**
 * Get user ID from Authorization header
 */
export async function getUserId(request?: NextRequest): Promise<string | null> {
  const session = await getSession(request)
  return session?.user.id || null
}
