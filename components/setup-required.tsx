'use client'

import { AlertCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SetupRequired() {
  return (
    <div className="h-dvh flex items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="w-full max-w-md mx-auto px-4 py-8">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <h1 className="text-2xl font-bold">Setup Required</h1>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Vizzy Chat AI needs Supabase credentials to enable user authentication, image galleries, and data persistence.
          </p>

          <div className="bg-muted rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-3">Required Environment Variables:</h3>
            <ul className="space-y-2 text-sm font-mono">
              <li className="text-muted-foreground">
                <span className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</span>
              </li>
              <li className="text-muted-foreground">
                <span className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
              </li>
            </ul>
          </div>

          <ol className="space-y-3 text-sm mb-6">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">1</span>
              <span>Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a> and create a project</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">2</span>
              <span>Copy your Project URL and Anon Key from project settings</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">3</span>
              <span>Add them to Settings → Vars in the top right</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">4</span>
              <span>Refresh the page after adding variables</span>
            </li>
          </ol>

          <Button className="w-full" asChild>
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">
              Create Supabase Project
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}
