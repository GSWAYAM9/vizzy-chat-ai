import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL

export const isNeonConfigured = Boolean(DATABASE_URL)

let sql: any = null

if (DATABASE_URL) {
  sql = neon(DATABASE_URL)
  console.log('[v0] Neon database configured')
} else {
  console.log('[v0] Neon database not configured - DATABASE_URL missing')
}

export { sql }

export type User = {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export type Image = {
  id: string
  user_id: string
  url: string
  prompt: string
  aspect_ratio?: string
  seed?: number
  is_favorited?: boolean
  likes_count?: number
  created_at: string
  updated_at: string
}

export type Analysis = {
  id: string
  image_id: string
  analysis: string
  rating?: number
  created_at: string
}
