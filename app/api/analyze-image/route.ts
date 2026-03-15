import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      // Gracefully return without analysis if no API key
      return NextResponse.json({
        analysis: "Image generated successfully. Feel free to refine it with your feedback!"
      })
    }

    try {
      // Dynamically import Groq only when needed
      const Groq = (await import("groq-sdk")).default
      
      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })

      const message = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `You are an expert art critic and image analyst. Analyze the generated image based on this prompt and provide insightful commentary as a structured list of bullet points.

Generation prompt: "${prompt}"

Provide your analysis ONLY as bullet points in this format:
• Overall assessment of how well the image matches the prompt
• Artistic style and technical execution details
• Composition and visual elements that work well
• Color palette and mood analysis
• Notable strengths of the image
• Interesting artistic choices or design decisions
• Technical quality observations

Be specific and insightful, not generic. Focus on what makes this image successful. Return ONLY the bullet points, nothing else.`,
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
    } catch (groqError) {
      const errorMsg = groqError instanceof Error ? groqError.message : String(groqError)
      console.error("[v0] Groq analysis failed:", errorMsg)
      // If Groq analysis fails, return fallback
      return NextResponse.json({
        analysis: "Image generated successfully. Feel free to share your thoughts!"
      })
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[v0] Analyze-image error:", errorMsg)
    // Catch any other errors and return fallback
    return NextResponse.json({
      analysis: "Image generated successfully. Feel free to share your thoughts!"
    })
  }
}
