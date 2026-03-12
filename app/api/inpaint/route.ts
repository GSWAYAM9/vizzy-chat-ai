import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: "Image editing is temporarily disabled" },
    { status: 503 }
  )
}
