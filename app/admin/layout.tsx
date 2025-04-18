import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  // Check if user is authenticated and is an admin
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/auth/login?redirect=/admin")
  }

  // Check if user is an admin
  const { data: profile, error } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

  // Log the profile data and error for debugging
  console.log("Admin check for user:", session.user.id)
  console.log("Profile data:", profile)
  console.log("Error:", error)

  // If there's an error or the profile doesn't exist, create it
  if (error || !profile) {
    // Create a profile for the user if it doesn't exist
    const { error: insertError } = await supabase.from("profiles").insert({
      id: session.user.id,
      email: session.user.email,
      full_name: session.user.user_metadata.full_name || session.user.email,
      is_admin: false, // Default to non-admin
    })

    console.log("Created new profile, insert error:", insertError)

    // Redirect to home since the new profile isn't an admin
    redirect("/")
  }

  // Check if the user is an admin
  if (!profile.is_admin) {
    console.log("User is not an admin")
    redirect("/")
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-8">{children}</div>
    </div>
  )
}
