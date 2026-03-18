'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  name?: string
}

interface Session {
  access_token: string
  user: User
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
  const isConfigured = true // Neon is always available if DATABASE_URL is set

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedSession = localStorage.getItem('vizzy_session')
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession)
        setSession(parsed)
        setUser(parsed.user)
      } catch (e) {
        console.error('[v0] Error parsing stored session:', e)
      }
    }
    setIsLoading(false)
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign up failed')
      }

      const data = await response.json()
      const sessionData: Session = {
        access_token: data.token,
        user: data.user,
      }

      localStorage.setItem('vizzy_session', JSON.stringify(sessionData))
      setSession(sessionData)
      setUser(data.user)
    } catch (error) {
      console.error('[v0] Sign up error:', error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Sign in failed')
      }

      const data = await response.json()
      const sessionData: Session = {
        access_token: data.token,
        user: data.user,
      }

      localStorage.setItem('vizzy_session', JSON.stringify(sessionData))
      setSession(sessionData)
      setUser(data.user)
    } catch (error) {
      console.error('[v0] Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    localStorage.removeItem('vizzy_session')
    setSession(null)
    setUser(null)
  }

  const signInWithGoogle = async () => {
    throw new Error('Google sign-in not implemented yet')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isConfigured,
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
