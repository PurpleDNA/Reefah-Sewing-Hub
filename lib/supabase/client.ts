import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (client) return client

  // Check if the environment variables are defined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key is missing")
    throw new Error("Supabase URL or Anon Key is missing")
  }

  try {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey)
    return client
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    throw error
  }
}
