import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      console.log('[v0] Supabase not configured for gallery fetch')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    // Get the user's session from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.log('[v0] No auth token provided for gallery fetch')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    console.log('[v0] Fetching images from Supabase with user token')

    // Get current user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.log('[v0] User authentication failed for gallery fetch')
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    // Fetch images for this user from Supabase
    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Supabase error fetching images:', error)
      return NextResponse.json({ results: [] }, { status: 200 })
    }

    console.log('[v0] Retrieved', images?.length || 0, 'images from Supabase')

    // Transform data to match frontend expectations
    const results = (images || []).map((img: any) => ({
      id: img.id,
      image_url: img.url,
      thumbnail_url: img.url,
      prompt: img.prompt,
      aspect_ratio: img.aspect_ratio || '1:1',
      created_at: img.created_at,
      is_favorited: img.is_favorited || false,
    }))

    return NextResponse.json({ results }, { status: 200 })
  } catch (error) {
    console.error('[v0] Error fetching gallery images:', error)
    return NextResponse.json({ results: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      console.log('[v0] Supabase not configured, skipping gallery save')
      return NextResponse.json({ message: 'Image generated successfully (gallery unavailable)' }, { status: 201 })
    }

    // Get the user's session from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.log('[v0] No auth token provided for gallery save')
      return NextResponse.json({ message: 'Image generated successfully' }, { status: 201 })
    }

    const body = await request.json()

    // Get current user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.log('[v0] User authentication failed for gallery save')
      return NextResponse.json({ message: 'Image generated successfully' }, { status: 201 })
    }

    console.log('[v0] Saving images to Supabase for user:', user.id)

    // Save each image to Supabase
    const imagesToSave = (Array.isArray(body.images) ? body.images : [body]).map((img: any) => ({
      user_id: user.id,
      url: img.url || img.image_url,
      prompt: body.prompt || img.prompt,
      aspect_ratio: body.aspect_ratio || '1:1',
      seed: img.seed,
    }))

    const { data: savedImages, error: saveError } = await supabase
      .from('images')
      .insert(imagesToSave)
      .select()

    if (saveError) {
      console.warn('[v0] Supabase save warning:', saveError)
      return NextResponse.json({ message: 'Image generated (gallery save failed)', success: true }, { status: 201 })
    }

    console.log('[v0] Successfully saved', savedImages?.length || 0, 'images to Supabase')

    return NextResponse.json({ 
      message: 'Images saved successfully',
      saved: savedImages?.length || 0,
    }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error in gallery POST:', error)
    return NextResponse.json({ message: 'Image generated (gallery unavailable)' }, { status: 201 })
  }
}
