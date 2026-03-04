"use client"

import { useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"

interface ImageLightboxProps {
  imageUrl: string | null
  prompt: string
  onClose: () => void
}

export function ImageLightbox({ imageUrl, prompt, onClose }: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (imageUrl) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [imageUrl, handleKeyDown])

  if (!imageUrl) return null

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
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
      window.open(imageUrl, "_blank")
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={(e) => {
            e.stopPropagation()
            handleDownload()
          }}
          className="bg-card/90 backdrop-blur-sm border-border hover:bg-card"
          aria-label="Download image"
        >
          <Download className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onClose}
          className="bg-card/90 backdrop-blur-sm border-border hover:bg-card"
          aria-label="Close preview"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div
        className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={`Generated: ${prompt}`}
          className="max-w-full max-h-[78vh] object-contain rounded-xl shadow-2xl"
        />
        {prompt && (
          <div className="text-sm text-muted-foreground text-center max-w-md px-4 leading-relaxed">
            {prompt}
          </div>
        )}
      </div>
    </div>
  )
}
