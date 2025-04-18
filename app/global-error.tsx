"use client"

import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-muted-foreground mb-8">We're sorry, but there was an error loading the application.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => reset()}>Try again</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              Go to homepage
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
