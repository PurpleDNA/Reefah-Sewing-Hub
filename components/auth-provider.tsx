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
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null)
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)

  // Use try-catch to handle potential initialization errors
  useEffect(() => {
    try {
      supabaseRef.current = createClient()
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
      // Return a minimal provider that doesn't break the app
      return
    }
  }, [])

  useEffect(() => {
    // Flag to prevent state updates after component unmount
    let isMounted = true

    const getUser = async () => {
      if (!supabaseRef.current) return
      try {
        const {
          data: { session },
        } = await supabaseRef.current.auth.getSession()

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

    // Set up auth state change listener
    const setupAuthListener = async () => {
      if (!supabaseRef.current) return
      try {
        const { data } = supabaseRef.current.auth.onAuthStateChange(async (_event, session) => {
          if (!isMounted) return

          const currentUser = session?.user ?? null
          setUser(currentUser)

          // If user just signed in, check if they have a profile
          if (currentUser && (_event === "SIGNED_IN" || _event === "USER_UPDATED")) {
            try {
              // First check if profile exists
              const { data, error } = await supabaseRef.current
                .from("profiles")
                .select("*")
                .eq("id", currentUser.id)
                .single()

              // If no profile exists or there was an error, create one
              if (!data || error) {
                console.log("Creating profile for user:", currentUser.id)

                // Get user metadata
                const fullName = currentUser.user_metadata.full_name || currentUser.user_metadata.name || ""

                await supabaseRef.current.from("profiles").insert({
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

          // Only refresh the router if the component is still mounted
          if (isMounted) {
            router.refresh()
          }
        })

        subscriptionRef.current = data
      } catch (error) {
        console.error("Error setting up auth listener:", error)
      }
    }

    // Initialize
    getUser()
    setupAuthListener()

    // Cleanup function
    return () => {
      isMounted = false

      // Unsubscribe from auth changes
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
    }
  }, [router])

  const signOut = async () => {
    if (!supabaseRef.current) return
    try {
      await supabaseRef.current.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  if (!supabaseRef.current) {
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

  return <AuthContext.Provider value={{ user, signOut, isLoading }}>{children}</AuthContext.Provider>
}
