import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon-client'
import { VizzyCreationCanvas, type CanvasOutput } from '@/lib/dasp/canvas/vizzy-creation-canvas'

/**
 * POST /api/dasp/canvas/session/create
 * Create a new Canvas session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP Canvas] Creating session for user: ${userId}`)

    // Create canvas session in memory
    const canvas = new VizzyCreationCanvas(userId)
    const session = canvas.getSession()

    // Store in database
    await sql`
      INSERT INTO canvas_sessions (
        session_id,
        user_id,
        title,
        messages,
        outputs,
        iterations,
        session_memory,
        is_active
      )
      VALUES (
        ${session.id},
        ${userId}::uuid,
        ${session.title},
        ${JSON.stringify(session.messages)}::jsonb,
        ${JSON.stringify(session.outputs)}::jsonb,
        ${JSON.stringify(session.iterations)}::jsonb,
        ${JSON.stringify(session.sessionMemory)},
        true
      )
    `

    return NextResponse.json(
      {
        message: 'Canvas session created',
        session,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[DASP Canvas] Error creating session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dasp/canvas/session
 * Get an existing Canvas session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')

    if (!sessionId && !userId) {
      return NextResponse.json(
        { error: 'sessionId or userId is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP Canvas] Fetching session: ${sessionId || userId}`)

    let result

    if (sessionId) {
      result = await sql`
        SELECT * FROM canvas_sessions
        WHERE session_id = ${sessionId}
        LIMIT 1
      `
    } else {
      result = await sql`
        SELECT * FROM canvas_sessions
        WHERE user_id = ${userId}::uuid
        AND is_active = true
        ORDER BY updated_at DESC
        LIMIT 1
      `
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 }
      )
    }

    const row = result[0]
    const session = {
      id: row.id,
      sessionId: row.session_id,
      userId: row.user_id,
      title: row.title,
      messages: row.messages,
      outputs: row.outputs,
      iterations: row.iterations,
      sessionMemory: row.session_memory,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }

    return NextResponse.json(
      {
        session,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP Canvas] Error fetching session:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
