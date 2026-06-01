"use client"

import { createContext, useState, useEffect, type ReactNode, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User, Session } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

// Export the context so it can be imported in the hook
export interface AuthContextType {
  user: User | null
  signOut: () => Promise<void>
  isLoading: boolean
  session: Session | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
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
          data: { session: currentSession },
        } = await supabaseRef.current.auth.getSession()

        if (isMounted) {
          setSession(currentSession)
          setUser(currentSession?.user ?? null)
          setIsLoading(false)

          // Debug auth state
          console.log("Auth state initialized:", {
            isAuthenticated: !!currentSession,
            provider: currentSession?.user?.app_metadata?.provider,
            userId: currentSession?.user?.id,
          })
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
        const { data } = supabaseRef.current.auth.onAuthStateChange(async (event:any, currentSession:any) => {
          if (!isMounted) return

          console.log("Auth state changed:", { event, userId: currentSession?.user?.id })

          setSession(currentSession)
          const currentUser = currentSession?.user ?? null
          setUser(currentUser)

          // If user just signed in, check if they have a profile.
          // IMPORTANT: never `await` other Supabase calls directly inside this
          // callback — it runs while the auth lock is held, and any Supabase
          // query needs the session (same lock) => deadlock that hangs
          // signInWithPassword forever. Defer the work with setTimeout(0).
          if (currentUser && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
            setTimeout(async () => {
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
            }, 0)
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
      console.log("Starting sign out process")

      // Clear cart data
      localStorage.removeItem("cart")

      // Get the auth provider before signing out
      const provider = user?.app_metadata?.provider || "unknown"
      console.log(`Signing out user with provider: ${provider}`)

      // Clear all Supabase and auth-related items from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.includes("supabase") || key.includes("auth") || key.includes("token") || key.includes("sb-")) {
          console.log(`Removing localStorage key: ${key}`)
          localStorage.removeItem(key)
        }
      })

      // Sign out from Supabase
      if (supabaseRef.current) {
        const { error } = await supabaseRef.current.auth.signOut({ scope: "global" })
        if (error) {
          console.error("Error during Supabase signOut:", error)
        } else {
          console.log("Supabase signOut successful")
        }
      }

      // Clear cookies that might be related to auth
      document.cookie.split(";").forEach((c) => {
        const cookieName = c.split("=")[0].trim()
        if (cookieName.includes("supabase") || cookieName.includes("sb-")) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
          console.log(`Cleared cookie: ${cookieName}`)
        }
      })

      // Clear user state
      setUser(null)
      setSession(null)

      console.log("Sign out process completed, redirecting to home page")

      // Force a hard refresh to clear any cached state
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Even if there's an error, try to force logout
      setUser(null)
      setSession(null)
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
            session: null,
            signOut: async () => {},
            isLoading: false,
          }}
        >
          {children}
        </AuthContext.Provider>
      )
    }
  }

  return <AuthContext.Provider value={{ user, session, signOut, isLoading }}>{children}</AuthContext.Provider>
}
