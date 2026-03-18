import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Create client with dummy values if not configured (will error on actual calls)
// This allows the app to load and show setup screen
let supabase: SupabaseClient

try {
  supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key')
} catch (error) {
  console.warn('[v0] Failed to initialize Supabase client - using mock mode')
  // Fallback for any initialization errors
  supabase = null as any
}

export { supabase }

export type User = {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

export type Image = {
  id: string
  user_id: string
  url: string
  prompt: string
  created_at: string
}

export type Analysis = {
  id: string
  image_id: string
  analysis: string
  created_at: string
}
