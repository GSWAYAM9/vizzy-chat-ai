import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon-client'

/**
 * POST /api/dasp/canvas/message
 * Add a message to a Canvas session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, content, role = 'user' } = body

    if (!sessionId || !userId || !content) {
      return NextResponse.json(
        { error: 'sessionId, userId, and content are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP Canvas] Adding message to session: ${sessionId}`)

    const message = {
      id: `msg_${Date.now()}`,
      timestamp: new Date(),
      role,
      content,
      type: 'text',
    }

    // Update session with new message
    await sql`
      UPDATE canvas_sessions
      SET 
        messages = array_append(messages, ${JSON.stringify(message)}::jsonb),
        updated_at = NOW()
      WHERE session_id = ${sessionId}
    `

    return NextResponse.json(
      {
        message: 'Message added',
        data: message,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[DASP Canvas] Error adding message:', error)
    return NextResponse.json(
      {
        error: 'Failed to add message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
