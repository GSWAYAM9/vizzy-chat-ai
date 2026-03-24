export async function GET(req) {
  try {
    return new Response(
      JSON.stringify({ error: 'Music generation is currently disabled' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
