export async function GET(request) {
  try {
    const url = new URL(request.url)
    const generationId = url.searchParams.get('generationId')

    console.log('[MUSIC-STATUS] Check for:', generationId)

    if (!generationId) {
      return new Response(JSON.stringify({ error: 'generationId required' }), { status: 400 })
    }

    const response = {
      generationId: generationId,
      status: 'completed',
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      title: 'Generated Music',
      prompt: 'Music'
    }
    
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('[MUSIC-STATUS] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}
