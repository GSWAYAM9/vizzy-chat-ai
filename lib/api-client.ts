const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export const apiClient = {
  // Chat endpoints
  async chat(messages: { role: string; content: string }[], token?: string) {
    const response = await fetch(`/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ messages }),
    })
    if (!response.ok) throw new Error('Chat failed')
    return response.json()
  },

  // Image generation endpoints
  async generateImage(
    prompt: string,
    width: number = 512,
    height: number = 512,
    token?: string
  ) {
    const response = await fetch(`/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ prompt, width, height }),
    })
    if (!response.ok) throw new Error('Image generation failed')
    return response.json()
  },

  // Image analysis endpoints
  async analyzeImage(imageUrl: string, token?: string) {
    const response = await fetch(`/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ imageUrl }),
    })
    if (!response.ok) throw new Error('Image analysis failed')
    return response.json()
  },

  async getAnalysisHistory(token?: string) {
    const response = await fetch(`/api/analysis/history`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch analysis history')
    return response.json()
  },

  // Gallery endpoints
  async getGalleryImages(token?: string) {
    const response = await fetch(`/api/gallery/images`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch gallery')
    return response.json()
  },

  async getFavoriteImages(token?: string) {
    const response = await fetch(`/api/gallery/images/favorites`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch favorites')
    return response.json()
  },

  async saveFavorite(imageId: string, token?: string) {
    const response = await fetch(`/api/gallery/images/${imageId}/like`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to save favorite')
    return response.json()
  },

  async removeFavorite(imageId: string, token?: string) {
    const response = await fetch(`/api/gallery/images/${imageId}/like`, {
      method: 'DELETE',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to remove favorite')
    return response.json()
  },

  // Batch processing endpoints
  async createBatchJob(
    prompts: string[],
    width: number = 512,
    height: number = 512,
    token?: string
  ) {
    const response = await fetch(`/api/batch/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ prompts, width, height }),
    })
    if (!response.ok) throw new Error('Failed to create batch job')
    return response.json()
  },

  async getBatchJob(jobId: string, token?: string) {
    const response = await fetch(`/api/batch/${jobId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch batch job')
    return response.json()
  },

  async listBatchJobs(token?: string) {
    const response = await fetch(`/api/batch/jobs`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to fetch batch jobs')
    return response.json()
  },

  async cancelBatchJob(jobId: string, token?: string) {
    const response = await fetch(`/api/batch/${jobId}/cancel`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error('Failed to cancel batch job')
    return response.json()
  },

  // Health check
  async health() {
    const response = await fetch(`/api/health`)
    return response.json()
  },
}
