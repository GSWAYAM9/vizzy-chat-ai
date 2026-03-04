"use client"

import { useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ArrowUp,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Loader2,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const ASPECT_RATIOS = [
  { label: "Square", value: "1:1", desc: "1024 x 1024", icon: Square },
  { label: "Landscape", value: "16:9", desc: "1536 x 864", icon: RectangleHorizontal },
  { label: "Portrait", value: "9:16", desc: "864 x 1536", icon: RectangleVertical },
  { label: "Photo Wide", value: "3:2", desc: "1536 x 1024", icon: RectangleHorizontal },
  { label: "Photo Tall", value: "2:3", desc: "1024 x 1536", icon: RectangleVertical },
  { label: "Classic", value: "4:3", desc: "1365 x 1024", icon: RectangleHorizontal },
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

  // Auto-focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

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
      const textarea = e.target
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    },
    [onChange]
  )

  // Reset textarea height when value is cleared (after submit)
  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value])

  const currentRatio = ASPECT_RATIOS.find((r) => r.value === aspectRatio) || ASPECT_RATIOS[0]

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div
        className={cn(
          "relative flex items-end gap-2 rounded-2xl border bg-card p-2.5 shadow-sm transition-all duration-300",
          "focus-within:shadow-md focus-within:border-accent/40",
          isLoading && "opacity-80"
        )}
      >
        {/* Aspect ratio picker */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl"
                  aria-label={`Aspect ratio: ${currentRatio.label}`}
                >
                  <currentRatio.icon className="size-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="top">Aspect ratio</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              Image Dimensions
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ASPECT_RATIOS.map((ratio) => {
              const RatioIcon = ratio.icon
              return (
                <DropdownMenuItem
                  key={ratio.value}
                  onClick={() => onAspectRatioChange(ratio.value)}
                  className={cn(
                    "flex items-center gap-3 cursor-pointer",
                    aspectRatio === ratio.value && "bg-accent/10 text-accent font-medium"
                  )}
                >
                  <RatioIcon className="size-4 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-sm">{ratio.label}</span>
                    <span className="text-xs text-muted-foreground">{ratio.desc}</span>
                  </div>
                  {aspectRatio === ratio.value && (
                    <div className="ml-auto size-1.5 rounded-full bg-accent" />
                  )}
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to create..."
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent border-0 outline-none text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 disabled:opacity-50 py-1.5 max-h-40"
          aria-label="Message input"
        />

        {/* Send / loading button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onSubmit}
              disabled={!value.trim() || isLoading}
              size="icon-sm"
              className={cn(
                "flex-shrink-0 rounded-xl transition-all duration-300",
                value.trim() && !isLoading
                  ? "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm"
                  : "bg-secondary text-muted-foreground"
              )}
              aria-label={isLoading ? "Generating..." : "Send message"}
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ArrowUp className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isLoading ? "Generating..." : "Send"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Footer hints */}
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
          {aspectRatio !== "1:1" && (
            <span className="text-xs text-accent/80 bg-accent/10 px-2 py-0.5 rounded-md font-medium">
              {currentRatio.label} {aspectRatio}
            </span>
          )}
        </div>
        <span className="text-[11px] text-muted-foreground/50">
          Shift + Enter for new line
        </span>
      </div>
    </div>
  )
}
