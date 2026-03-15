"use client"

import { useState } from "react"
import { Copy, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface DeepPromptBuilderProps {
  onPromptGenerated?: (fullPrompt: string) => void
}

export function DeepPromptBuilder({ onPromptGenerated }: DeepPromptBuilderProps) {
  const [basePrompt, setBasePrompt] = useState("")
  const [styleDescriptor, setStyleDescriptor] = useState("")
  const [compositionNotes, setCompositionNotes] = useState("")
  const [moodAtmosphere, setMoodAtmosphere] = useState("")
  const [technicalDetails, setTechnicalDetails] = useState("")
  const [qualityModifiers, setQualityModifiers] = useState<string[]>([
    "masterpiece",
    "highly detailed",
    "professional",
  ])
  const [generatedPrompt, setGeneratedPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateFullPrompt = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch("/api/deep-prompts/generate/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_prompt: basePrompt,
          style_descriptor: styleDescriptor,
          composition_notes: compositionNotes,
          mood_atmosphere: moodAtmosphere,
          technical_details: technicalDetails,
          quality_modifiers: qualityModifiers,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedPrompt(data.generated_full_prompt)
        onPromptGenerated?.(data.generated_full_prompt)
      }
    } catch (err) {
      console.error("Failed to generate prompt", err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
  }

  const addQualityModifier = (modifier: string) => {
    if (!qualityModifiers.includes(modifier)) {
      setQualityModifiers([...qualityModifiers, modifier])
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Deep Prompt Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Base Prompt */}
          <div>
            <label className="text-sm font-medium mb-2 block">Main Concept</label>
            <Textarea
              value={basePrompt}
              onChange={(e) => setBasePrompt(e.target.value)}
              placeholder="E.g., A serene forest clearing with ancient stone ruins..."
              rows={2}
            />
          </div>

          {/* Style Descriptor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Art Style & Aesthetic</label>
            <Textarea
              value={styleDescriptor}
              onChange={(e) => setStyleDescriptor(e.target.value)}
              placeholder="E.g., oil painting, cyberpunk neon, watercolor, digital art..."
              rows={2}
            />
          </div>

          {/* Composition */}
          <div>
            <label className="text-sm font-medium mb-2 block">Composition & Framing</label>
            <Textarea
              value={compositionNotes}
              onChange={(e) => setCompositionNotes(e.target.value)}
              placeholder="E.g., rule of thirds, wide angle, macro shot, centered subject..."
              rows={2}
            />
          </div>

          {/* Mood */}
          <div>
            <label className="text-sm font-medium mb-2 block">Mood & Atmosphere</label>
            <Textarea
              value={moodAtmosphere}
              onChange={(e) => setMoodAtmosphere(e.target.value)}
              placeholder="E.g., ethereal, mysterious, warm and inviting, dystopian..."
              rows={2}
            />
          </div>

          {/* Technical Details */}
          <div>
            <label className="text-sm font-medium mb-2 block">Technical Details</label>
            <Textarea
              value={technicalDetails}
              onChange={(e) => setTechnicalDetails(e.target.value)}
              placeholder="E.g., volumetric lighting, ray tracing, depth of field, 8k resolution..."
              rows={2}
            />
          </div>

          {/* Quality Modifiers */}
          <div>
            <label className="text-sm font-medium mb-2 block">Quality Modifiers</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {qualityModifiers.map((modifier) => (
                <Badge key={modifier} variant="secondary" className="cursor-pointer">
                  {modifier}
                  <button
                    onClick={() => setQualityModifiers(qualityModifiers.filter((m) => m !== modifier))}
                    className="ml-2"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {["trending on artstation", "award-winning", "stunning", "cinematic", "hyper realistic"].map(
                (mod) => (
                  <Button key={mod} variant="outline" size="sm" onClick={() => addQualityModifier(mod)}>
                    + {mod}
                  </Button>
                )
              )}
            </div>
          </div>

          <Button onClick={handleGenerateFullPrompt} disabled={isGenerating} className="w-full gap-2">
            <Wand2 size={16} />
            {isGenerating ? "Generating..." : "Generate Full Prompt"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Prompt */}
      {generatedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Prompt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-800 leading-relaxed">{generatedPrompt}</p>
            </div>
            <Button onClick={handleCopyPrompt} className="w-full gap-2" variant="outline">
              <Copy size={16} />
              Copy to Clipboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
