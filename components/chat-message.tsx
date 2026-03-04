"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Download,
  Expand,
  RotateCcw,
  Sparkles,
} from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/lib/types"

interface ChatMessageProps {
  message: ChatMessageType
  onImageClick: (imageUrl: string, prompt: string) => void
  onRetry?: () => void
}

export function ChatMessage({ message, onImageClick, onRetry }: ChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl mx-auto w-full px-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="flex-shrink-0 size-8 rounded-lg bg-accent flex items-center justify-center mt-1">
          <Sparkles className="size-4 text-accent-foreground" />
        </div>
      )}

      <div className={cn("flex flex-col gap-3 max-w-[85%] md:max-w-[75%]", isUser && "items-end")}>
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isUser
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-secondary-foreground rounded-bl-md"
            )}
          >
            {message.content}
          </div>
        )}

        {message.isLoading && (
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
              <span>Generating your image...</span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <Skeleton className="aspect-square w-full max-w-sm rounded-xl" />
            </div>
          </div>
        )}

        {message.images && message.images.length > 0 && (
          <div
            className={cn(
              "grid gap-3 w-full",
              message.images.length === 1 && "grid-cols-1 max-w-sm",
              message.images.length === 2 && "grid-cols-2 max-w-lg",
              message.images.length >= 3 && "grid-cols-2 max-w-lg"
            )}
          >
            {message.images.map((image, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <img
                  src={image.url}
                  alt={`Generated: ${image.prompt}`}
                  className="w-full aspect-square object-cover cursor-pointer transition-transform duration-300 group-hover:scale-[1.02]"
                  onClick={() => onImageClick(image.url, image.prompt)}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-background/80 hover:bg-background text-foreground backdrop-blur-sm"
                    onClick={() => onImageClick(image.url, image.prompt)}
                    aria-label="View full size"
                  >
                    <Expand className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-background/80 hover:bg-background text-foreground backdrop-blur-sm"
                    onClick={() => handleDownload(image.url, image.prompt)}
                    aria-label="Download image"
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {message.error && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-destructive">{message.error}</span>
            {onRetry && (
              <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1 text-muted-foreground hover:text-foreground">
                <RotateCcw className="size-3" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

async function handleDownload(url: string, prompt: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = blobUrl
    a.download = `vizzy-${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "-")}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, "_blank")
  }
}
