'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase-client'

interface User extends SupabaseUser {
  name?: string
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  isConfigured: boolean
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Skip if Supabase is not configured
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false)
      return
    }

    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user as User || null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user as User || null)
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (name) {
      await supabase.auth.updateUser({
        data: { name },
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.')
    }
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      },
    })
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signUp,
        signIn,
        signOut,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
