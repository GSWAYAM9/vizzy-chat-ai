import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/neon-client'

/**
 * POST /api/dasp/canvas/output
 * Add a creative output to a Canvas session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId, output } = body

    if (!sessionId || !userId || !output) {
      return NextResponse.json(
        { error: 'sessionId, userId, and output are required' },
        { status: 400 }
      )
    }

    console.log(`[DASP Canvas] Saving output to session: ${sessionId}`)

    // Save output to database
    const result = await sql`
      INSERT INTO canvas_outputs (
        session_id,
        user_id,
        output_type,
        title,
        description,
        content_url,
        content_metadata,
        generated_by,
        generation_params
      )
      VALUES (
        (SELECT id FROM canvas_sessions WHERE session_id = ${sessionId}),
        ${userId}::uuid,
        ${output.type},
        ${output.title},
        ${output.description},
        ${output.content?.url || null},
        ${JSON.stringify(output.content?.metadata || {})}::jsonb,
        ${output.generatedBy},
        ${JSON.stringify(output.generationParams || {})}::jsonb
      )
      RETURNING id, created_at
    `

    if (!result || result.length === 0) {
      throw new Error('Failed to save output')
    }

    const savedOutput = {
      id: result[0].id,
      ...output,
      savedAt: result[0].created_at,
    }

    // Update session with output
    await sql`
      UPDATE canvas_sessions
      SET updated_at = NOW()
      WHERE session_id = ${sessionId}
    `

    return NextResponse.json(
      {
        message: 'Output saved',
        output: savedOutput,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[DASP Canvas] Error saving output:', error)
    return NextResponse.json(
      {
        error: 'Failed to save output',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dasp/canvas/output
 * Get outputs from a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      )
    }

    console.log(`[DASP Canvas] Fetching outputs for session: ${sessionId}`)

    const result = await sql`
      SELECT co.*
      FROM canvas_outputs co
      JOIN canvas_sessions cs ON co.session_id = cs.id
      WHERE cs.session_id = ${sessionId}
      ORDER BY co.created_at DESC
    `

    return NextResponse.json(
      {
        outputs: result || [],
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[DASP Canvas] Error fetching outputs:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch outputs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
