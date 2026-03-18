import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

const SYSTEM_PROMPT = `You are Vizzy, a creative assistant specialized in helping users generate and refine AI images. Your role is to:

1. Help users articulate their creative vision through thoughtful questions and suggestions
2. Provide creative refinements and improvements to their image concepts
3. Suggest relevant details, styles, moods, and artistic techniques to enhance their prompts
4. Offer alternatives and variations when asked
5. Give constructive feedback on their creative ideas
6. Remember context from the conversation to provide more personalized suggestions

Keep responses concise and creative-focused. When the user is ready to generate an image, help them craft a detailed, visual prompt. Always be encouraging and enthusiastic about their creative ideas.

When a user asks for image generation details like aspect ratio or art style recommendations, provide specific, actionable suggestions they can use.`

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Chat API: POST request received")
    
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error("[v0] GROQ_API_KEY not configured")
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("[v0] Failed to parse JSON body:", parseError)
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      )
    }
    
    const { messages } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      console.error("[v0] Invalid messages format:", { messages })
      return NextResponse.json(
        { error: "Messages array is required and cannot be empty" },
        { status: 400 }
      )
    }

    // Format messages for Groq SDK - include system as first message
    const formattedMessages = [
      {
        role: "system" as const,
        content: SYSTEM_PROMPT,
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
      })),
    ]

    console.log("[v0] Chat API: formatted", formattedMessages.length, "messages")

    let groq: any
    try {
      groq = new Groq({
        apiKey: apiKey,
      })
    } catch (groqInitError) {
      console.error("[v0] Failed to initialize Groq client:", groqInitError)
      return NextResponse.json(
        { error: "Failed to initialize Groq client" },
        { status: 500 }
      )
    }

    let response
    try {
      console.log("[v0] Chat API: calling Groq with model llama-3.3-70b-versatile")
      response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: formattedMessages,
        temperature: 0.8,
        max_tokens: 500,
      })
    } catch (groqError: any) {
      console.error("[v0] Groq API error:", {
        message: groqError?.message,
        status: groqError?.status,
        error: groqError,
      })
      return NextResponse.json(
        { error: `Groq API error: ${groqError?.message || "Unknown error"}` },
        { status: groqError?.status || 500 }
      )
    }

    const text = response.choices[0]?.message?.content || ""

    if (!text) {
      console.warn("[v0] Groq returned empty response")
      return NextResponse.json(
        { error: "Empty response from Groq" },
        { status: 500 }
      )
    }

    console.log("[v0] Chat API: successfully generated response, length:", text.length)

    return NextResponse.json({
      content: text,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in chat API:", error)
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
