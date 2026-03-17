"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Heart, Trash2, Download, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface GeneratedImage {
  id: string
  image_url: string
  thumbnail_url: string
  prompt: string
  aspect_ratio: string
  created_at: string
  is_favorited: boolean
  likes_count: number
}

interface ImageGalleryProps {
  aspectRatioFilter?: string
  showFavorites?: boolean
}

export function ImageGallery({ aspectRatioFilter, showFavorites = false }: ImageGalleryProps) {
  const [filter, setFilter] = useState(aspectRatioFilter)
  const [images, setImages] = useState<GeneratedImage[]>([])

  const { data: galleryData, isLoading, error } = useSWR(
    showFavorites ? "/api/gallery/images/favorites" : "/api/gallery/images",
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )

  useEffect(() => {
    if (galleryData?.results) {
      const filtered = aspectRatioFilter
        ? galleryData.results.filter((img: GeneratedImage) => img.aspect_ratio === filter)
        : galleryData.results
      setImages(filtered)
    }
  }, [galleryData, filter, aspectRatioFilter])

  const handleToggleFavorite = async (imageId: string) => {
    try {
      await fetch(`/api/gallery/images/${imageId}/toggle_favorite/`, { method: "POST" })
      // Refresh data
      mutate()
    } catch (err) {
      console.error("Failed to toggle favorite", err)
    }
  }

  const handleDownload = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `vizzy-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Failed to download image", err)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading gallery...</div>
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Failed to load gallery</div>
  }

  if (images.length === 0) {
    return <div className="text-center py-8 text-gray-500">No images yet. Start creating!</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Image Gallery</h2>
        {aspectRatioFilter && (
          <div className="flex gap-2">
            <Badge variant="outline">{filter}</Badge>
            <Button variant="ghost" size="sm" onClick={() => setFilter(aspectRatioFilter)}>
              Clear Filter
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative overflow-hidden rounded-lg bg-gray-100 aspect-square cursor-pointer hover:shadow-lg transition-shadow"
          >
            <img
              src={image.thumbnail_url || image.image_url}
              alt={image.prompt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
              {/* Prompt */}
              <p className="text-white text-sm line-clamp-3">{image.prompt}</p>

              {/* Action buttons */}
              <div className="flex gap-2 justify-between">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleToggleFavorite(image.id)}
                >
                  <Heart
                    size={16}
                    className={image.is_favorited ? "fill-red-500 text-red-500" : ""}
                  />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => handleDownload(image.image_url, image.prompt)}
                >
                  <Download size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => navigator.clipboard.writeText(image.prompt)}
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            {/* Like count badge */}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {image.likes_count} likes
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
