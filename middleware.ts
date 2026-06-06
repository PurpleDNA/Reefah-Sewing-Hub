import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Safety net for password-recovery / OAuth links: if Supabase can't honor the
  // configured redirectTo (e.g. the URL isn't in the dashboard allow-list) it
  // falls back to the Site URL and appends ?code=... to the root. Forward that
  // code to /auth/callback so the session gets exchanged and the user lands on
  // the reset-password form instead of getting stranded on the homepage.
  const code = request.nextUrl.searchParams.get("code")
  if (pathname === "/" && code) {
    const callbackUrl = new URL("/auth/callback", request.url)
    callbackUrl.searchParams.set("code", code)
    callbackUrl.searchParams.set("redirect", "/auth/reset-password")
    return NextResponse.redirect(callbackUrl)
  }

  // Add custom headers for debugging
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Add custom headers to help with debugging
  response.headers.set("x-middleware-cache", "no-cache")
  response.headers.set("Cache-Control", "no-store, max-age=0")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
