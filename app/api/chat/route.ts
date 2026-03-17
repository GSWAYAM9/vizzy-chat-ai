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
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured" },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { messages } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      )
    }

    // Format messages for Groq SDK
    const formattedMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    console.log("[v0] Chat API called with", formattedMessages.length, "messages")

    const groq = new Groq({
      apiKey: apiKey,
    })

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: formattedMessages,
      system: SYSTEM_PROMPT,
      temperature: 0.8,
      max_tokens: 500,
    })

    const text = response.choices[0]?.message?.content || ""

    console.log("[v0] Generated response:", text.substring(0, 100))

    return NextResponse.json({
      content: text,
    })
  } catch (error) {
    console.error("[Chat API Error]", error)
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
