import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Image editing feature uses /api/generate endpoint" },
    { status: 410 }
  )
}
