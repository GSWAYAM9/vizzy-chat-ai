import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        hasGroqKey: !!process.env.GROQ_API_KEY,
        nodeEnv: process.env.NODE_ENV,
      },
    })
  } catch (error) {
    console.error("[v0] Health check error:", error)
    return NextResponse.json(
      { status: "error", error: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
