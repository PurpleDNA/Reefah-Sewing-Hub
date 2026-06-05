import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const redirect = requestUrl.searchParams.get("redirect")

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Only honor internal paths. Reject absolute URLs and protocol-relative
  // ("//evil.com") values to avoid an open-redirect; fall back to home.
  const safePath = redirect && redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/"

  return NextResponse.redirect(new URL(safePath, requestUrl.origin))
}
