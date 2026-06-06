import type React from "react"
import type { Metadata } from "next"
import { Fraunces, Hanken_Grotesk } from "next/font/google"
import "./globals.css"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/components/cart-provider"
import { AuthProvider } from "@/components/auth-provider"
import { VercelAnalytics } from "@/components/analytics"
import { Suspense } from "react"

const fontSans = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const fontDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
})

export const metadata: Metadata = {
  title: "REEFA SEWING HUB - Your One-Stop Sewing Shop",
  description:
    "Beads, stones, trimming, threads, accessories & sewing tools that bring your designs to life. Wholesale & retail in Ghana.",
  generator: "v0.dev",
  icons: {
    icon: "/Reefa-LOGO.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontDisplay.variable} font-sans`}>
        <AuthProvider>
          <CartProvider>
            <Suspense fallback={<div>Loading...</div>}>
              <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1">{children}</main>
                <Footer />
                <Toaster />
              </div>
            </Suspense>
          </CartProvider>
        </AuthProvider>
        <VercelAnalytics />
      </body>
    </html>
  )
}
