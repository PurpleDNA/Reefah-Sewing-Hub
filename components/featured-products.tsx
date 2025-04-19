"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ShoppingCart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface FeaturedProductsProps {
  products: Product[]
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id)

    try {
      // Create cart item
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: 1,
      }

      // If user is logged in, update cart in backend first
      if (user) {
        const supabase = createClient()

        // Check if cart exists
        const { data: existingCart } = await supabase.from("carts").select("items").eq("user_id", user.id).single()

        if (existingCart) {
          // Cart exists, update items
          const existingItems = existingCart.items || []
          const existingItemIndex = existingItems.findIndex((item: any) => item.id === product.id)

          let updatedItems
          if (existingItemIndex > -1) {
            // Item exists, update quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex].quantity += 1
          } else {
            // Item doesn't exist, add it
            updatedItems = [...existingItems, cartItem]
          }

          // Update cart in database
          await supabase
            .from("carts")
            .update({
              items: updatedItems,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        } else {
          // Cart doesn't exist, create it
          await supabase.from("carts").insert({
            user_id: user.id,
            items: [cartItem],
          })
        }
      }

      // Update local cart state
      addItem(cartItem)

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingToCart(null)
    }
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <Button asChild variant="outline">
            <Link href="/products">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden group">
              <Link href={`/products/${product.slug}`} className="block overflow-hidden">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={product.image_url || "/placeholder.svg?height=400&width=400"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              </Link>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/products/${product.slug}`} className="block">
                      <h3 className="font-medium text-lg hover:text-green-600 transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{product.categories?.name}</p>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-100">
                    ₦{product.price.toFixed(2)}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleAddToCart(product)}
                  disabled={addingToCart === product.id}
                >
                  {addingToCart === product.id ? (
                    "Adding..."
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" /> Add to Cart
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
