"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { Star, TrendingUp, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ImageFeedback {
  id: string
  image_url: string
  composition_score: number
  color_harmony_score: number
  creativity_score: number
  overall_score: number
  critique: string
  strengths: string[]
  areas_for_improvement: string[]
  suggestions: string[]
}

interface FeedbackPanelProps {
  imageId?: string
  onRefresh?: () => void
}

export function FeedbackPanel({ imageId, onRefresh }: FeedbackPanelProps) {
  const [feedback, setFeedback] = useState<ImageFeedback | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: feedbackData, isLoading } = useSWR(
    imageId ? `/api/gallery/feedback?image_id=${imageId}` : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (feedbackData?.results?.[0]) {
      setFeedback(feedbackData.results[0])
    }
  }, [feedbackData])

  const handleGenerateFeedback = async () => {
    if (!imageId) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/gallery/feedback/generate_feedback/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_id: imageId }),
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data)
        onRefresh?.()
      }
    } catch (err) {
      console.error("Failed to generate feedback", err)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!imageId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Image Feedback</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-500">Select an image to view AI feedback</CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Image Feedback</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          AI Feedback & Critique
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!feedback ? (
          <Button onClick={handleGenerateFeedback} disabled={isGenerating} className="w-full">
            {isGenerating ? "Generating..." : "Generate AI Feedback"}
          </Button>
        ) : (
          <>
            {/* Scores */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{feedback.composition_score.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Composition</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{feedback.color_harmony_score.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Color</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{feedback.creativity_score.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Creativity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{feedback.overall_score.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Overall</div>
              </div>
            </div>

            {/* Critique */}
            {feedback.critique && (
              <div>
                <h4 className="font-semibold mb-2">Critique</h4>
                <p className="text-sm text-gray-700">{feedback.critique}</p>
              </div>
            )}

            {/* Strengths */}
            {feedback.strengths.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {feedback.strengths.map((strength, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Areas for Improvement */}
            {feedback.areas_for_improvement.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Areas for Improvement</h4>
                <div className="flex flex-wrap gap-2">
                  {feedback.areas_for_improvement.map((area, i) => (
                    <Badge key={i} variant="outline" className="bg-yellow-50">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600" />
                  Suggestions
                </h4>
                <ul className="space-y-2">
                  {feedback.suggestions.map((suggestion, i) => (
                    <li key={i} className="text-sm text-gray-700">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
