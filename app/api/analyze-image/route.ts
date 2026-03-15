import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

// Initialize Groq client
let groq: Groq | null = null

function getGroqClient(): Groq | null {
  if (!groq && process.env.GROQ_API_KEY) {
    try {
      groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })
    } catch (e) {
      console.error("[v0] Failed to initialize Groq:", e)
      return null
    }
  }
  return groq
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    const groqClient = getGroqClient()
    if (!groqClient) {
      return NextResponse.json(
        { error: "Groq not configured" },
        { status: 500 }
      )
    }

    console.log("[v0] Analyzing image with prompt:", prompt.slice(0, 100))

    const message = await groqClient.chat.completions.create({
      model: "mixtral-8x7b-32768",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are an expert art critic and image analyst. Analyze the image based on this generation prompt and provide insightful commentary.

Generation prompt: "${prompt}"

Provide a detailed analysis including:
1. Overall assessment of how well the image matches the prompt
2. Artistic style and technical execution
3. Composition and visual elements that work well
4. Color palette and mood
5. Notable strengths of the image (use bullet points)
6. Any interesting artistic choices or details

Format your response as natural, flowing commentary with bullet points for specific strengths. Be specific and insightful, not generic.`,
        },
      ],
    })

    if (!message.choices[0]?.message?.content) {
      throw new Error("No response from Groq")
    }

    const analysis = message.choices[0].message.content.trim()

    return NextResponse.json({
      analysis,
    })
  } catch (error) {
    console.error("[v0] Error analyzing image:", error)
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    )
  }
}
