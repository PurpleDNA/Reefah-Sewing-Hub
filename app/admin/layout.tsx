import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found, redirecting to login")
      redirect("/auth/login?redirect=/admin")
    }

    // Check if user is an admin
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single()

    console.log("Admin check for user:", session.user.id, "Profile:", profile, "Error:", error)

    // If there's an error or the profile doesn't exist, create it
    if (error || !profile) {
      console.log("Profile not found or error, creating profile")

      // Create a profile for the user if it doesn't exist
      await supabase.from("profiles").insert({
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata.full_name || session.user.email,
        is_admin: false, // Default to non-admin
      })

      console.log("New user is not an admin, redirecting to home")
      redirect("/")
    }

    // Check if the user is an admin
    if (!profile.is_admin) {
      console.log("User is not an admin, redirecting to home")
      redirect("/")
    }

    console.log("User is admin, rendering admin layout")
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 p-8">{children}</div>
      </div>
    )
  } catch (error) {
    console.error("Error in admin layout:", error)
    redirect("/")
  }
}
