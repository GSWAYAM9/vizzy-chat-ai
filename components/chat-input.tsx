"use client"

import { useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUp, Image as ImageIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const ASPECT_RATIOS = [
  { label: "Square (1:1)", value: "1:1" },
  { label: "Landscape (16:9)", value: "16:9" },
  { label: "Portrait (9:16)", value: "9:16" },
  { label: "Photo (3:2)", value: "3:2" },
  { label: "Photo Portrait (2:3)", value: "2:3" },
  { label: "Classic (4:3)", value: "4:3" },
]

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading: boolean
  aspectRatio: string
  onAspectRatioChange: (ratio: string) => void
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  aspectRatio,
  onAspectRatioChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !isLoading) {
          onSubmit()
        }
      }
    },
    [value, isLoading, onSubmit]
  )

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value)
      // Auto-resize
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    },
    [onChange]
  )

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-shadow focus-within:shadow-md focus-within:border-ring/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="flex-shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Select aspect ratio"
            >
              <ImageIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ASPECT_RATIOS.map((ratio) => (
              <DropdownMenuItem
                key={ratio.value}
                onClick={() => onAspectRatioChange(ratio.value)}
                className={cn(
                  aspectRatio === ratio.value && "bg-accent text-accent-foreground font-medium"
                )}
              >
                {ratio.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want to create..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent border-0 outline-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground disabled:opacity-50 py-1.5 max-h-40 scrollbar-thin"
          aria-label="Message input"
        />

        <Button
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          size="icon-sm"
          className="flex-shrink-0 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-30"
          aria-label="Send message"
        >
          <ArrowUp className="size-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between px-1 pt-2 pb-1">
        <span className="text-xs text-muted-foreground">
          {aspectRatio !== "1:1" ? `Aspect: ${aspectRatio}` : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          Shift + Enter for new line
        </span>
      </div>
    </div>
  )
}
