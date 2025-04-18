"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

// Export the context so it can be imported in the hook
export interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      // If user just signed in, check if they have a profile
      if (currentUser && _event === "SIGNED_IN") {
        const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()

        // If no profile exists, create one
        if (!data) {
          await supabase.from("profiles").insert({
            id: currentUser.id,
            full_name: currentUser.user_metadata.full_name || "",
            email: currentUser.email,
          })
        }
      }

      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, signOut, isLoading }}>{children}</AuthContext.Provider>
}
