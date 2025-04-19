"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"

export function Hero() {
  const isMobile = useMobile()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="relative overflow-hidden bg-green-50 dark:bg-green-950">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Fresh Groceries Delivered to Your Doorstep
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Shop from our wide selection of fresh produce, pantry staples, and household essentials.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button asChild size="lg" className="bg-green-600 hover:bg-green-700">
                <Link href="/products">
                  Shop Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </div>
          <div
            className={`relative h-[300px] md:h-[400px] w-full transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <Image
              src="/placeholder.svg?height=400&width=600"
              alt="Fresh groceries"
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}
