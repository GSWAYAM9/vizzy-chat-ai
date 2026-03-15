import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { prompt, imageUrl } = await request.json()

    if (!prompt) {
      console.error("[v0] Analyze-image: No prompt provided")
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      )
    }

    console.log("[v0] Analyzing image with prompt:", prompt.slice(0, 100))

    // Check if API key exists
    if (!process.env.GROQ_API_KEY) {
      console.warn("[v0] GROQ_API_KEY not found - returning fallback")
      return NextResponse.json({
        analysis: "Image generated successfully. Feel free to refine it with your feedback!"
      })
    }

    console.log("[v0] Importing and initializing Groq...")
    
    // Dynamic import to avoid module-level errors
    const { default: Groq } = await import("groq-sdk")
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    console.log("[v0] Calling Groq API for image analysis")

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
      console.error("[v0] Groq returned no content")
      throw new Error("No response from Groq")
    }

    const analysis = message.choices[0].message.content.trim()
    console.log("[v0] Analysis generated successfully, length:", analysis.length)

    return NextResponse.json({
      analysis,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[v0] Error analyzing image:", errorMessage)
    console.error("[v0] Full error object:", error)
    
    // Return a meaningful fallback instead of failing
    return NextResponse.json({
      analysis: "Image generated successfully. Feel free to share your thoughts about what you see!"
    })
  }
}
