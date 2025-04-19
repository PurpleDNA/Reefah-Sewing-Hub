"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useAuth } from "@/hooks/use-auth"
import type { Product } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ChevronRight, Minus, Plus, ShoppingCart, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10))
  }

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1))
  }

  const handleAddToCart = async () => {
    setIsAdding(true)

    try {
      // Create cart item
      const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity,
      }

      // If user is logged in, update cart in backend first
      if (user) {
        const supabase = createClient()

        // Check if cart exists
        const { data: existingCart } = await supabase.from("carts").select("items").eq("user_id", user.id).maybeSingle()

        if (existingCart) {
          // Cart exists, update items
          const existingItems = existingCart.items || []
          const existingItemIndex = existingItems.findIndex((item: any) => item.id === product.id)

          let updatedItems
          if (existingItemIndex > -1) {
            // Item exists, update quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex].quantity += quantity
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
        description: `${quantity} x ${product.name} has been added to your cart.`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <div className="relative aspect-square">
        <Image
          src={product.image_url || "/placeholder.svg?height=600&width=600"}
          alt={product.name}
          fill
          className="object-cover rounded-lg"
          priority
        />
      </div>

      <div>
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Link href="/products" className="hover:text-green-600">
            Products
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link href={`/products?category=${product.categories?.slug}`} className="hover:text-green-600">
            {product.categories?.name}
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

        <div className="flex items-center mb-4">
          <div className="flex items-center text-amber-400">
            <Star className="fill-current h-5 w-5" />
            <Star className="fill-current h-5 w-5" />
            <Star className="fill-current h-5 w-5" />
            <Star className="fill-current h-5 w-5" />
            <Star className="h-5 w-5 text-gray-300" />
          </div>
          <span className="text-sm text-muted-foreground ml-2">(4.0) 12 reviews</span>
        </div>

        <div className="mb-6">
          <p className="text-2xl font-bold text-green-600">₦{product.price.toFixed(2)}</p>
          {product.sale_price && (
            <p className="text-sm text-muted-foreground line-through">₦{product.sale_price.toFixed(2)}</p>
          )}
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{product.description}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Quantity</p>
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center">{quantity}</span>
            <Button variant="outline" size="icon" onClick={incrementQuantity} disabled={quantity >= 10}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
            onClick={handleAddToCart}
            disabled={isAdding}
          >
            {isAdding ? (
              "Adding to Cart..."
            ) : (
              <>
                <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link href="/cart">View Cart</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
