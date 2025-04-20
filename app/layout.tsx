import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { Toaster } from "@/components/ui/toaster"
import { CartProvider } from "@/components/cart-provider"
import { AuthProvider } from "@/components/auth-provider"
import { VercelAnalytics } from "@/components/analytics"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Betza Store - Your Neighborhood Grocery Store",
  description: "Fresh groceries delivered to your doorstep",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
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
        </ThemeProvider>
      </body>
    </html>
  )
}
