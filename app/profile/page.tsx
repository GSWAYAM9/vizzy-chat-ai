"use client"

import { useAuth } from "@/lib/neon-auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft, LogOut } from "lucide-react"

export default function ProfilePage() {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <main className="h-dvh flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sign in to view your profile</h1>
          <Link href="/auth/login">
            <Button>Sign In</Button>
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your Vizzy account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">User ID</label>
                <Input value={user.id} disabled />
              </div>
              {user.user_metadata?.name && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={user.user_metadata.name} disabled />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/gallery">
                <Button variant="outline" className="w-full justify-start">
                  View My Gallery
                </Button>
              </Link>
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => {
                  signOut()
                  window.location.href = "/auth/login"
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
