import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminSidebar from "@/components/admin/sidebar"

// This tree reads cookies (Supabase session), so it can never be statically
// rendered. Declare it dynamic so Next.js doesn't attempt static rendering.
export const dynamic = "force-dynamic"

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

    // If we get here, user is admin. Fetch unread contact-message count for
    // the sidebar badge (admins can read via RLS).
    const { count: unreadMessages } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)

    return (
      <div className="flex min-h-screen">
        <AdminSidebar unreadMessages={unreadMessages ?? 0} />
        <div className="flex-1 p-8">{children}</div>
      </div>
    )
  } catch (error) {
    // `redirect()` and dynamic-rendering bailouts work by throwing a special
    // error carrying a `digest`. Those are control flow, not failures — let
    // them propagate so the intended redirect (login / non-admin) actually
    // happens instead of being swallowed.
    if (
      error &&
      typeof (error as { digest?: unknown }).digest === "string"
    ) {
      throw error
    }

    // Only genuinely unexpected errors (e.g. Supabase/network) reach here.
    console.error("Error in admin layout:", error)
    redirect("/")
  }
}
