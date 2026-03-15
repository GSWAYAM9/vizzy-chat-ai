"use client"

import { useState } from "react"
import useSWR from "swr"
import { Settings, Plus, Trash2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface CustomInstruction {
  id: string
  name: string
  description: string
  system_instruction: string
  applicable_to: string
  is_active: boolean
  usage_count: number
}

export function CustomInstructionsManager() {
  const [instructions, setInstructions] = useState<CustomInstruction[]>([])
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [newInstruction, setNewInstruction] = useState("")
  const [newApplicableTo, setNewApplicableTo] = useState("generation")
  const [isCreating, setIsCreating] = useState(false)

  const { data: instructionsData, mutate } = useSWR(
    "/api/instructions/",
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  const handleCreateInstruction = async () => {
    if (!newName || !newInstruction) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/instructions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription,
          system_instruction: newInstruction,
          applicable_to: newApplicableTo,
          is_active: true,
        }),
      })

      if (response.ok) {
        setNewName("")
        setNewDescription("")
        setNewInstruction("")
        setNewApplicableTo("generation")
        await mutate()
      }
    } catch (err) {
      console.error("Failed to create instruction", err)
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      await fetch(`/api/instructions/${id}/toggle_active/`, { method: "POST" })
      await mutate()
    } catch (err) {
      console.error("Failed to toggle instruction", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/instructions/${id}/`, { method: "DELETE" })
      await mutate()
    } catch (err) {
      console.error("Failed to delete instruction", err)
    }
  }

  const data = instructionsData?.results || []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Custom Instructions
        </h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" gap="2">
              <Plus size={16} />
              New Instruction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Custom Instruction</DialogTitle>
              <DialogDescription>Define how the AI should behave for specific tasks</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="E.g., Surrealism Focus"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Brief explanation..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">System Instruction</label>
                <Textarea
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  placeholder="Write the instruction..."
                  rows={4}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Applies To</label>
                <select
                  value={newApplicableTo}
                  onChange={(e) => setNewApplicableTo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="generation">Image Generation</option>
                  <option value="feedback">Feedback & Critique</option>
                  <option value="suggestions">Suggestions</option>
                  <option value="refinement">Refinement</option>
                  <option value="all">All Features</option>
                </select>
              </div>

              <Button onClick={handleCreateInstruction} disabled={isCreating} className="w-full">
                {isCreating ? "Creating..." : "Create Instruction"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No custom instructions yet. Create one to personalize your experience.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.map((instruction: CustomInstruction) => (
            <Card key={instruction.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold">{instruction.name}</h4>
                    <p className="text-sm text-gray-600">{instruction.description}</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {instruction.applicable_to}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Used {instruction.usage_count}x
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(instruction.id)}
                      className={instruction.is_active ? "text-green-600" : "text-gray-400"}
                    >
                      <Check size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(instruction.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
                <div className="mt-3 text-sm bg-gray-50 p-2 rounded text-gray-700">
                  {instruction.system_instruction}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
