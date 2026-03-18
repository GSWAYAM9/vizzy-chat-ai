import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

let supabase: SupabaseClient | null = null

// Only initialize Supabase if both credentials are present
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
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
