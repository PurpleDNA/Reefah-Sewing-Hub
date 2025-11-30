import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      console.log("No session found, redirecting to login")
      redirect("/auth/login?redirect=/admin")
    }

    // Direct query to check if user is admin - bypassing RLS
    const { data, error } = await supabase.rpc("check_if_admin", {
      user_id: session.user.id,
    })

    if (error) {
      console.error("Error checking admin status:", error)
      // Fallback to direct query
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single()

      if (profileError || !profile || !profile.is_admin) {
        console.log("User is not an admin, redirecting to home")
        redirect("/")
      }
    } else if (!data) {
      console.log("User is not an admin, redirecting to home")
      redirect("/")
    }

    // If we get here, user is admin
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
