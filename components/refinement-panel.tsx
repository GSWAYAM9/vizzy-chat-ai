"use client"

import { useState, useRef, useEffect } from "react"
import useSWR from "swr"
import { Send, Lightbulb, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface RefinementMessage {
  id: string
  refinement_number: number
  user_feedback: string
  ai_suggestion: string
  refined_prompt: string
  created_at: string
}

interface RefinementPanelProps {
  imageId: string
  onRefinementComplete?: (refinedImageId: string) => void
}

export function RefinementPanel({ imageId, onRefinementComplete }: RefinementPanelProps) {
  const [feedback, setFeedback] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: refinements, mutate } = useSWR(
    imageId ? `/api/refinement/${imageId}/history/` : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [refinements])

  const handleSubmitRefinement = async () => {
    if (!feedback.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/refinement/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: imageId,
          user_feedback: feedback,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback("")
        await mutate()
        onRefinementComplete?.(data.refined_image_id)
      }
    } catch (err) {
      console.error("Failed to submit refinement", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Iterative Refinement
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Refinement history */}
        <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-lg">
          {refinements?.results?.map((refinement: RefinementMessage) => (
            <div key={refinement.id} className="space-y-2">
              <div className="bg-blue-50 p-3 rounded text-sm">
                <p className="font-semibold text-blue-900">Your Feedback (Round {refinement.refinement_number})</p>
                <p className="text-blue-800">{refinement.user_feedback}</p>
              </div>
              <div className="bg-green-50 p-3 rounded text-sm">
                <p className="font-semibold text-green-900">AI Suggestion</p>
                <p className="text-green-800">{refinement.ai_suggestion}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Share your feedback to refine further</label>
          <Textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="E.g., Make it more vibrant, add more detail to the background..."
            className="resize-none"
            rows={3}
          />
          <Button
            onClick={handleSubmitRefinement}
            disabled={isLoading || !feedback.trim()}
            className="w-full gap-2"
          >
            <Send size={16} />
            {isLoading ? "Refining..." : "Submit Feedback"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
