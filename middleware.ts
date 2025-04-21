import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const pathname = request.nextUrl.pathname

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
