// This file is deprecated - use /api/music/generate-song instead
export const dynamic = 'force-dynamic'
export async function POST() {
  return new Response(
    JSON.stringify({ error: 'Use /api/music/generate-song instead' }),
    { status: 404, headers: { 'content-type': 'application/json' } }
  )
}
