"use client"

import { useState } from "react"
import { BookOpen, Plus, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface StoryBuilderProps {
  onStoryCreated?: (storyId: string) => void
}

export function StoryBuilder({ onStoryCreated }: StoryBuilderProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [theme, setTheme] = useState("")
  const [targetCount, setTargetCount] = useState(5)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateStory = async () => {
    if (!title || !theme) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/stories/create_from_theme/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          theme,
          target_image_count: targetCount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onStoryCreated?.(data.id)
        // Reset form
        setTitle("")
        setDescription("")
        setTheme("")
        setTargetCount(5)
      }
    } catch (err) {
      console.error("Failed to create story", err)
    } finally {
      setIsCreating(false)
    }
  }

  const themeExamples = ["Fantasy Adventure", "Sci-Fi Journey", "Urban Exploration", "Nature Documentary", "Historical Timeline"]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Create Story Collection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Story Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., The Lost Temple"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your story concept..."
            rows={2}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Theme or Concept</label>
          <Input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="E.g., Ancient civilizations meeting modern technology"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {themeExamples.map((ex) => (
              <Button
                key={ex}
                variant="outline"
                size="sm"
                onClick={() => setTheme(ex)}
              >
                {ex}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Target Image Count</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="2"
              max="20"
              value={targetCount}
              onChange={(e) => setTargetCount(parseInt(e.target.value))}
              className="flex-1"
            />
            <Badge>{targetCount} images</Badge>
          </div>
        </div>

        <Button onClick={handleCreateStory} disabled={isCreating || !title || !theme} className="w-full gap-2">
          <Wand2 size={16} />
          {isCreating ? "Creating Story..." : "Create Story Collection"}
        </Button>
      </CardContent>
    </Card>
  )
}
