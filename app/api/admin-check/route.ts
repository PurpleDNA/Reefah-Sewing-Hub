import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient()

    // Get the current session
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get the user's profile
    const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

    if (error) {
      return NextResponse.json({ error: "Error fetching profile", details: error }, { status: 500 })
    }

    // Return the profile data
    return NextResponse.json({
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      profile: profile,
      isAdmin: !!profile?.is_admin,
    })
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ error: "Server error", details: error }, { status: 500 })
  }
}
