export async function POST(request) {
  try {
    const body = await request.json()
    const prompt = body?.prompt

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt required' }), { status: 400 })
    }

    console.log('[MUSIC] Generation:', prompt)
    
    const response = {
      generationId: 'test_' + Date.now(),
      title: prompt.substring(0, 100),
      audioUrl: 'data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==',
      status: 'completed',
      prompt: prompt,
    }
    
    return new Response(JSON.stringify(response), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (error) {
    console.error('[MUSIC] Error:', error)
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}
