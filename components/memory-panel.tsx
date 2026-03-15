"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Brain, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface UserMemory {
  favorite_styles: string[]
  favorite_themes: string[]
  favorite_moods: string[]
  creative_values: string
  artistic_goals: string
  preferred_quality_level: string
  preferred_generation_speed: string
}

export function MemoryPanel() {
  const [memory, setMemory] = useState<UserMemory | null>(null)
  const [newStyle, setNewStyle] = useState("")
  const [newTheme, setNewTheme] = useState("")
  const [newMood, setNewMood] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { data: memoryData } = useSWR(
    "/api/memory/my_memory/",
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (memoryData) {
      setMemory(memoryData)
    }
  }, [memoryData])

  const handleAddToArray = (field: keyof UserMemory, value: string) => {
    if (!memory || !value.trim()) return

    const currentArray = (memory[field] as string[]) || []
    if (!currentArray.includes(value)) {
      const updated = {
        ...memory,
        [field]: [...currentArray, value],
      }
      setMemory(updated)

      // Clear input
      if (field === "favorite_styles") setNewStyle("")
      else if (field === "favorite_themes") setNewTheme("")
      else if (field === "favorite_moods") setNewMood("")
    }
  }

  const handleRemoveFromArray = (field: keyof UserMemory, value: string) => {
    if (!memory) return

    const updated = {
      ...memory,
      [field]: (memory[field] as string[]).filter((item) => item !== value),
    }
    setMemory(updated)
  }

  const handleSave = async () => {
    if (!memory) return

    setIsSaving(true)
    try {
      await fetch("/api/memory/update_memory/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memory),
      })
    } catch (err) {
      console.error("Failed to save memory", err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!memory) {
    return <div className="text-center py-8">Loading preferences...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Creative Memory & Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Favorite Styles */}
          <div>
            <label className="text-sm font-medium mb-2 block">Favorite Artistic Styles</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newStyle}
                onChange={(e) => setNewStyle(e.target.value)}
                placeholder="Add a style..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddToArray("favorite_styles", newStyle)
                  }
                }}
              />
              <Button onClick={() => handleAddToArray("favorite_styles", newStyle)} size="sm">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memory.favorite_styles?.map((style) => (
                <Badge key={style} variant="secondary" className="cursor-pointer">
                  {style}
                  <button onClick={() => handleRemoveFromArray("favorite_styles", style)} className="ml-1">
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Favorite Themes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Favorite Themes</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTheme}
                onChange={(e) => setNewTheme(e.target.value)}
                placeholder="Add a theme..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddToArray("favorite_themes", newTheme)
                  }
                }}
              />
              <Button onClick={() => handleAddToArray("favorite_themes", newTheme)} size="sm">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memory.favorite_themes?.map((theme) => (
                <Badge key={theme} variant="secondary" className="cursor-pointer">
                  {theme}
                  <button onClick={() => handleRemoveFromArray("favorite_themes", theme)} className="ml-1">
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Favorite Moods */}
          <div>
            <label className="text-sm font-medium mb-2 block">Favorite Moods & Atmospheres</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newMood}
                onChange={(e) => setNewMood(e.target.value)}
                placeholder="Add a mood..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddToArray("favorite_moods", newMood)
                  }
                }}
              />
              <Button onClick={() => handleAddToArray("favorite_moods", newMood)} size="sm">
                <Plus size={16} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {memory.favorite_moods?.map((mood) => (
                <Badge key={mood} variant="secondary" className="cursor-pointer">
                  {mood}
                  <button onClick={() => handleRemoveFromArray("favorite_moods", mood)} className="ml-1">
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Creative Values */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Creative Values</label>
            <Textarea
              value={memory.creative_values}
              onChange={(e) =>
                setMemory({
                  ...memory,
                  creative_values: e.target.value,
                })
              }
              placeholder="What matters most to you in art? (e.g., authenticity, innovation, beauty...)"
              rows={3}
            />
          </div>

          {/* Artistic Goals */}
          <div>
            <label className="text-sm font-medium mb-2 block">Your Artistic Goals</label>
            <Textarea
              value={memory.artistic_goals}
              onChange={(e) =>
                setMemory({
                  ...memory,
                  artistic_goals: e.target.value,
                })
              }
              placeholder="What are you trying to achieve with your art?"
              rows={3}
            />
          </div>

          {/* Quality Level */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Quality Level</label>
            <div className="grid grid-cols-4 gap-2">
              {["draft", "standard", "high", "ultra"].map((level) => (
                <Button
                  key={level}
                  variant={memory.preferred_quality_level === level ? "default" : "outline"}
                  onClick={() => setMemory({ ...memory, preferred_quality_level: level })}
                  className="text-xs"
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Speed */}
          <div>
            <label className="text-sm font-medium mb-2 block">Preferred Generation Speed</label>
            <div className="grid grid-cols-3 gap-2">
              {["fast", "balanced", "quality"].map((speed) => (
                <Button
                  key={speed}
                  variant={memory.preferred_generation_speed === speed ? "default" : "outline"}
                  onClick={() => setMemory({ ...memory, preferred_generation_speed: speed })}
                >
                  {speed.charAt(0).toUpperCase() + speed.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
