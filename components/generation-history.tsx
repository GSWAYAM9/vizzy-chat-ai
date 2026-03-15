'use client'

import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Heart, Copy, Trash2, Calendar, Clock, Zap } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'

interface GeneratedImage {
  id: string
  image_url: string
  thumbnail_url?: string
  prompt: string
  aspect_ratio: string
  model: string
  generation_time?: number
  likes_count: number
  is_favorited: boolean
  created_at: string
}

export function GenerationHistory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'liked'>('newest')
  const [filterAspectRatio, setFilterAspectRatio] = useState<string>('all')
  const [filterModel, setFilterModel] = useState<string>('all')

  const { data: images, isLoading, error, mutate } = useSWR<GeneratedImage[]>(
    '/api/gallery/images/',
    async (url) => {
      try {
        let token = localStorage.getItem('token')
        console.log('[v0] Token from localStorage:', token ? 'exists' : 'missing')
        
        if (!token) {
          console.log('[v0] No token found, cannot load history')
          throw new Error('No generation history yet. Start generating images to see them here!')
        }
        
        const res = await fetch(url, { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        })
        
        if (!res.ok) {
          const errorText = await res.text()
          console.error('[v0] API error:', res.status, res.statusText)
          console.error('[v0] Error response:', errorText)
          if (res.status === 401) {
            throw new Error('Session expired. Generate a new image to refresh.')
          }
          if (res.status === 500) {
            throw new Error('Backend server error. Please check backend logs.')
          }
          throw new Error(`API error: ${res.status}`)
        }
        
        const data = await res.json()
        console.log('[v0] Generated images loaded:', data)
        return Array.isArray(data) ? data : data.results || []
      } catch (err) {
        console.error('[v0] Error fetching images:', err)
        throw err
      }
    },
    { 
      revalidateOnFocus: true,
      dedupingInterval: 1000
    }
  )

  const filteredAndSortedImages = useMemo(() => {
    if (!images) return []

    let filtered = images.filter(img => 
      img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (filterAspectRatio !== 'all') {
      filtered = filtered.filter(img => img.aspect_ratio === filterAspectRatio)
    }

    if (filterModel !== 'all') {
      filtered = filtered.filter(img => img.model === filterModel)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'liked':
          return b.likes_count - a.likes_count
        default:
          return 0
      }
    })
  }, [images, searchQuery, sortBy, filterAspectRatio, filterModel])

  const handleLike = async (imageId: string) => {
    try {
      await fetch(`/api/gallery/images/${imageId}/like/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      await mutate()
      toast.success('Image liked!')
    } catch (error) {
      toast.error('Failed to like image')
    }
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast.success('Prompt copied!')
  }

  const handleDelete = async (imageId: string) => {
    try {
      await fetch(`/api/gallery/images/${imageId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      await mutate()
      toast.success('Image deleted')
    } catch (error) {
      toast.error('Failed to delete image')
    }
  }

  const handleDownload = async (imageUrl: string) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `vizzy-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Download started')
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center space-y-4">
            <p className="text-lg font-semibold text-muted-foreground">No Generation History</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {error?.message || 'Generate some AI images to see your history here!'}
            </p>
            <Button onClick={() => mutate()} variant="outline">
              Check Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-muted-foreground">Loading generation history...</p>
        </CardContent>
      </Card>
    )
  }

  const aspectRatios = [...new Set(images?.map(img => img.aspect_ratio) || [])]
  const models = [...new Set(images?.map(img => img.model) || [])]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">Generation History</h2>
        <p className="text-muted-foreground">All your AI-generated images and prompts</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Filter & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search by prompt..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="liked">Most Liked</SelectItem>
              </SelectContent>
            </Select>

            {aspectRatios.length > 0 && (
              <Select value={filterAspectRatio} onValueChange={setFilterAspectRatio}>
                <SelectTrigger>
                  <SelectValue placeholder="Aspect Ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratios</SelectItem>
                  {aspectRatios.map(ratio => (
                    <SelectItem key={ratio} value={ratio}>{ratio}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {models.length > 0 && (
              <Select value={filterModel} onValueChange={setFilterModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {models.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredAndSortedImages.length} image{filteredAndSortedImages.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Grid */}
      {filteredAndSortedImages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">No generated images found. Start creating!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedImages.map(image => (
            <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden bg-muted">
                <Image
                  src={image.thumbnail_url || image.image_url}
                  alt={image.prompt}
                  fill
                  className="object-cover hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end justify-between p-2 opacity-0 hover:opacity-100">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 hover:bg-white/40"
                      onClick={() => handleDownload(image.image_url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 hover:bg-white/40"
                      onClick={() => handleCopyPrompt(image.prompt)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 hover:bg-white/40"
                      onClick={() => handleLike(image.id)}
                    >
                      <Heart className="w-4 h-4" fill={image.is_favorited ? 'white' : 'none'} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-white/20 hover:bg-white/40"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="pt-3">
                <p className="text-sm line-clamp-2 text-muted-foreground mb-2">{image.prompt}</p>
                
                <div className="flex flex-wrap gap-1 mb-2">
                  <Badge variant="secondary" className="text-xs">{image.aspect_ratio}</Badge>
                  <Badge variant="outline" className="text-xs">{image.model}</Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(image.created_at).toLocaleDateString()}
                  </div>
                  {image.generation_time && (
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {image.generation_time.toFixed(1)}s
                    </div>
                  )}
                </div>

                {image.likes_count > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs">
                    <Heart className="w-3 h-3 fill-red-500 text-red-500" />
                    <span>{image.likes_count}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
