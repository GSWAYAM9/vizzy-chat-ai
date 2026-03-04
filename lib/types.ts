export interface GeneratedImage {
  url: string
  prompt: string
  seed?: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  images?: GeneratedImage[]
  isLoading?: boolean
  error?: string
  timestamp: number
}
