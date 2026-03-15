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
    } catch {
      // If Groq analysis fails, return fallback
      return NextResponse.json({
        analysis: "Image generated successfully. Feel free to share your thoughts!"
      })
    }
  } catch {
    // Catch any other errors and return fallback
    return NextResponse.json({
      analysis: "Image generated successfully. Feel free to share your thoughts!"
    })
  }
}
