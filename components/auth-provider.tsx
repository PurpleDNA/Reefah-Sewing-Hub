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
  const supabaseRef = useRef<any>(null)

  // Initialize Supabase client
  useEffect(() => {
    try {
      // Create the client only once
      if (!supabaseRef.current) {
        supabaseRef.current = createClient()
      }
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
    }
  }, [])

  // Handle auth state and cleanup
  useEffect(() => {
    // Flag to prevent state updates after component unmount
    let isMounted = true
    let authListener: { unsubscribe: () => void } | null = null

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

                // Get user metadata - handle both email/password and OAuth providers
                const fullName =
                  currentUser.user_metadata.full_name ||
                  currentUser.user_metadata.name ||
                  currentUser.user_metadata.preferred_username ||
                  ""

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

        // Store the listener for cleanup
        authListener = data.subscription
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
      if (authListener) {
        try {
          authListener.unsubscribe()
        } catch (error) {
          console.error("Error unsubscribing from auth listener:", error)
        }
      }
    }
  }, [router])

  const signOut = async () => {
    try {
      // Clear local storage cart
      localStorage.removeItem("cart")
      localStorage.removeItem("supabase.auth.token")

      // Sign out from Supabase
      const { error } = await supabaseRef.current.auth.signOut()

      if (error) {
        console.error("Error signing out:", error)
        throw error
      }

      // Clear user state
      setUser(null)

      // Force a hard refresh to clear any cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Even if there's an error, try to force logout
      setUser(null)
      window.location.href = "/"
    }
  }

  // Provide a fallback if Supabase client initialization failed
  if (!supabaseRef.current) {
    try {
      supabaseRef.current = createClient()
    } catch (error) {
      console.error("Failed to initialize Supabase client in fallback:", error)
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
  }

  return <AuthContext.Provider value={{ user, signOut, isLoading }}>{children}</AuthContext.Provider>
}
