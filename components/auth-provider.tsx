"use client"

import { createContext, useState, useEffect, type ReactNode, useRef } from "react"
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

  const subscription = useRef<any>(null)

  // Use try-catch to handle potential initialization errors
  let supabase
  try {
    supabase = createClient()
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error)
    // Return a minimal provider that doesn't break the app
    return (
      <AuthContext.Provider
        value={{
          user: null,
          signOut: async () => {},
          isLoading: false,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  useEffect(() => {
    let isMounted = true

    const getUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (isMounted) {
          setUser(session?.user ?? null)
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error getting session:", error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    getUser()

    try {
      subscription.current = supabase.auth.onAuthStateChange(async (_event, session) => {
        const currentUser = session?.user ?? null
        if (isMounted) {
          setUser(currentUser)
        }

        // If user just signed in, check if they have a profile
        if (currentUser && (_event === "SIGNED_IN" || _event === "USER_UPDATED")) {
          try {
            // First check if profile exists
            const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()

            // If no profile exists or there was an error, create one
            if (!data || error) {
              console.log("Creating profile for user:", currentUser.id)

              // Get user metadata
              const fullName = currentUser.user_metadata.full_name || currentUser.user_metadata.name || ""

              await supabase.from("profiles").insert({
                id: currentUser.id,
                full_name: fullName,
                email: currentUser.email,
                // Don't set is_admin here - that should be done manually
              })
            }
          } catch (error) {
            console.error("Error checking/creating profile:", error)
          }
        }

        router.refresh()
      })
    } catch (error) {
      console.error("Error setting up auth state change listener:", error)
    }

    return () => {
      isMounted = false
      if (subscription.current && subscription.current.unsubscribe) {
        subscription.current.unsubscribe()
      }
    }
  }, [router, supabase])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return <AuthContext.Provider value={{ user, signOut, isLoading }}>{children}</AuthContext.Provider>
}
