// This file is deprecated - use /api/music/check-status instead
export const dynamic = 'force-dynamic'
export async function GET() {
  return new Response(
    JSON.stringify({ error: 'Use /api/music/check-status instead' }),
    { status: 404, headers: { 'content-type': 'application/json' } }
  )
}
