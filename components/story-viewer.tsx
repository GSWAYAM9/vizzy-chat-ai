"use client"

import { useState } from "react"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface StorySequence {
  id: string
  sequence_number: number
  narrative_text: string
  scene_description: string
  generated_prompt: string
  image_url: string
}

interface Story {
  id: string
  title: string
  description: string
  theme: string
  target_image_count: number
  current_image_count: number
  completion_percentage: number
  sequences: StorySequence[]
}

interface StoryViewerProps {
  storyId: string
}

export function StoryViewer({ storyId }: StoryViewerProps) {
  const [currentScene, setCurrentScene] = useState(0)

  const { data: story, isLoading } = useSWR(
    storyId ? `/api/stories/${storyId}/story_viewer/` : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  if (isLoading || !story) {
    return <div className="text-center py-8">Loading story...</div>
  }

  const sequences: StorySequence[] = story.sequences || []
  const currentSequence = sequences[currentScene]

  const handleNext = () => {
    if (currentScene < sequences.length - 1) {
      setCurrentScene(currentScene + 1)
    }
  }

  const handlePrevious = () => {
    if (currentScene > 0) {
      setCurrentScene(currentScene - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Story header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-6 h-6" />
          <h1 className="text-3xl font-bold">{story.title}</h1>
        </div>
        <p className="text-gray-600">{story.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge>{story.theme}</Badge>
          <Badge variant="outline">
            {story.current_image_count} of {story.target_image_count} scenes
          </Badge>
        </div>
        <div className="mt-3">
          <Progress value={story.completion_percentage} className="h-2" />
          <p className="text-sm text-gray-600 mt-1">{story.completion_percentage}% Complete</p>
        </div>
      </div>

      {/* Scene viewer */}
      {currentSequence ? (
        <Card className="overflow-hidden">
          <div className="relative">
            {/* Image */}
            <div className="relative w-full aspect-video bg-gray-900">
              <img
                src={currentSequence.image_url}
                alt={`Scene ${currentSequence.sequence_number}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded">
                Scene {currentSequence.sequence_number} of {sequences.length}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="absolute inset-0 flex items-center justify-between p-4">
              <Button
                variant="ghost"
                className="text-white bg-black/40 hover:bg-black/60"
                disabled={currentScene === 0}
                onClick={handlePrevious}
              >
                <ChevronLeft size={24} />
              </Button>
              <Button
                variant="ghost"
                className="text-white bg-black/40 hover:bg-black/60"
                disabled={currentScene === sequences.length - 1}
                onClick={handleNext}
              >
                <ChevronRight size={24} />
              </Button>
            </div>
          </div>

          {/* Story details */}
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Narrative</h3>
              <p className="text-gray-700 leading-relaxed">{currentSequence.narrative_text}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Scene Description</h3>
              <p className="text-gray-700 leading-relaxed">{currentSequence.scene_description}</p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Generation Prompt</h3>
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-800">
                {currentSequence.generated_prompt}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No scenes added yet. Start building your story!
          </CardContent>
        </Card>
      )}

      {/* Scene thumbnails */}
      {sequences.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Scene Timeline</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sequences.map((seq, index) => (
              <button
                key={seq.id}
                onClick={() => setCurrentScene(index)}
                className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                  currentScene === index ? "border-blue-500 ring-2 ring-blue-300" : "border-gray-300"
                }`}
              >
                <img src={seq.image_url} alt={`Scene ${seq.sequence_number}`} className="w-full h-full object-cover" />
                <div className="text-xs text-center py-1 bg-gray-100">{seq.sequence_number}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
