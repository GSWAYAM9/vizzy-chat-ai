"use client"

import { useState } from "react"
import useSWR from "swr"
import { Lightbulb, Copy, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Suggestion {
  id: string
  suggestion_type: string
  title: string
  description: string
  suggested_prompt: string
  confidence_score: number
}

interface IdeaSuggestionsProps {
  imageId?: string
}

export function IdeaSuggestions({ imageId }: IdeaSuggestionsProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: suggestionsData, mutate } = useSWR(
    imageId ? `/api/suggestions?image_id=${imageId}` : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  const handleGenerateSuggestions = async () => {
    if (!imageId) return

    setIsGenerating(true)
    try {
      await fetch("/api/suggestions/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_id: imageId }),
      })
      await mutate()
    } catch (err) {
      console.error("Failed to generate suggestions", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
  }

  const suggestions = suggestionsData?.results || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Creative Suggestions
        </h3>
        <Button onClick={handleGenerateSuggestions} disabled={isGenerating || !imageId} size="sm">
          {isGenerating ? "Generating..." : "Generate Ideas"}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {imageId ? "Click 'Generate Ideas' to get creative suggestions" : "Select an image first"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {suggestions.map((suggestion: Suggestion) => (
            <Card
              key={suggestion.id}
              className={`cursor-pointer transition-all ${
                selectedSuggestion?.id === suggestion.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{suggestion.title}</CardTitle>
                    <Badge variant="outline" className="mt-2">
                      {suggestion.suggestion_type.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {(suggestion.confidence_score * 100).toFixed(0)}%
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">{suggestion.description}</p>

                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="font-semibold text-gray-600 mb-1">Suggested Prompt</p>
                  <p className="text-gray-800 line-clamp-2">{suggestion.suggested_prompt}</p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => handleCopyPrompt(suggestion.suggested_prompt)}
                >
                  <Copy size={14} />
                  Copy Prompt
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
