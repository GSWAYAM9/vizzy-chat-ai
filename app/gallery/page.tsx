"use client"

import { useState } from "react"
import { ImageGallery } from "@/components/image-gallery"
import { FeedbackPanel } from "@/components/feedback-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Heart, Grid3x3 } from "lucide-react"

export default function GalleryPage() {
  const [selectedImageId, setSelectedImageId] = useState<string | undefined>()
  const [showFavorites, setShowFavorites] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Gallery</h1>
        <Button
          variant={showFavorites ? "default" : "outline"}
          onClick={() => setShowFavorites(!showFavorites)}
          className="gap-2"
        >
          <Heart size={18} />
          {showFavorites ? "All Images" : "Favorites"}
        </Button>
      </div>

      <Tabs defaultValue="gallery" className="space-y-4">
        <TabsList>
          <TabsTrigger value="gallery" className="gap-2">
            <Grid3x3 size={16} />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="feedback">Feedback & Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-4">
          <ImageGallery showFavorites={showFavorites} key={refreshKey} />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <FeedbackPanel imageId={selectedImageId} onRefresh={handleRefresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
