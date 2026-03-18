"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Navbar() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Vizzy</h1>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/gallery">
            <Button variant="ghost" size="sm">
              Gallery
            </Button>
          </Link>

          <Link href="/profile">
            <Button variant="ghost" size="sm">
              {user?.email || "Profile"}
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}
