export async function POST(request: Request) {
  return Response.json(
    { error: 'Music generation is temporarily disabled' },
    { status: 503 }
  )
}
