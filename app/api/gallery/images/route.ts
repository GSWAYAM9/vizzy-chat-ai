import { NextRequest, NextResponse } from 'next/server'
import { sql, isNeonConfigured } from '@/lib/neon-client'

export async function GET(request: NextRequest) {
  try {
    if (!isNeonConfigured || !sql) {
      console.log('[v0] Neon database not configured, using local cache')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    // Get the user ID from Authorization header (for now, use a simple bearer token)
    const authHeader = request.headers.get('authorization')
    const userId = authHeader?.replace('Bearer ', '')

    if (!userId) {
      console.log('[v0] No user ID provided, using local cache')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    console.log('[v0] Fetching images from Neon for user:', userId)

    // Fetch images for this user from Neon with timeout
    const imagesPromise = sql`
      SELECT id, url, prompt, aspect_ratio, seed, is_favorited, likes_count, created_at, updated_at
      FROM images
      WHERE user_id = ${userId}::uuid
      ORDER BY created_at DESC
      LIMIT 100
    `

    const imagesTimeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 5000)
    )

    let images
    try {
      images = await Promise.race([
        imagesPromise,
        imagesTimeoutPromise as any,
      ]) as any[]
    } catch (timeoutErr) {
      console.log('[v0] Images query timed out, using local cache')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    console.log('[v0] Successfully retrieved', images?.length || 0, 'images from Neon')

    // Transform data to match frontend expectations
    const results = (images || []).map((img: any) => ({
      id: img.id,
      image_url: img.url,
      thumbnail_url: img.url,
      prompt: img.prompt,
      aspect_ratio: img.aspect_ratio || '1:1',
      created_at: img.created_at,
      is_favorited: img.is_favorited || false,
      likes_count: img.likes_count || 0,
    }))

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching gallery images:', error)
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured || !sql) {
      console.log('[v0] Neon database not configured, skipping gallery save')
      return NextResponse.json({ message: 'Image generated successfully (gallery unavailable)' }, { status: 201 })
    }

    const authHeader = request.headers.get('authorization')
    const userId = authHeader?.replace('Bearer ', '')

    if (!userId) {
      console.log('[v0] No user ID provided for gallery save')
      return NextResponse.json({ message: 'Image generated successfully' }, { status: 201 })
    }

    const body = await request.json()

    console.log('[v0] Saving images to Neon for user:', userId)

    // Prepare images for bulk insert
    const imagesToSave = (Array.isArray(body.images) ? body.images : [body]).map((img: any) => ({
      user_id: userId,
      url: img.url || img.image_url,
      prompt: body.prompt || img.prompt,
      aspect_ratio: body.aspect_ratio || '1:1',
      seed: img.seed || null,
    }))

    try {
      // Insert images into Neon
      const result = await sql`
        INSERT INTO images (user_id, url, prompt, aspect_ratio, seed)
        VALUES 
        ${sql(imagesToSave.map((img: typeof imagesToSave[0]) => [img.user_id, img.url, img.prompt, img.aspect_ratio, img.seed]))}
        RETURNING id, url, prompt, created_at
      `

      console.log('[v0] Successfully saved', result?.length || 0, 'images to Neon')

      return NextResponse.json({ 
        message: 'Images saved successfully',
        saved: result?.length || 0,
      }, { status: 201 })
    } catch (dbError) {
      console.warn('[v0] Database save error:', dbError)
      return NextResponse.json({ message: 'Image generated (gallery save failed)', success: true }, { status: 201 })
    }
  } catch (error) {
    console.error('[v0] Error in gallery POST:', error)
    return NextResponse.json({ message: 'Image generated (gallery unavailable)' }, { status: 201 })
  }
}
