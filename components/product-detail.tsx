"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ChevronRight, Minus, Plus, ShoppingCart, Star } from "lucide-react"

interface ProductDetailProps {
  product: Product
}

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, product.stock))
  }

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1))
  }

  const handleAddToCart = () => {
    if (product.stock <= 0) return
    setIsAdding(true)

    setTimeout(() => {
      // The cart provider persists to user_carts on state change; we just
      // update local cart state here.
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity,
      })

      toast({
        title: "Added to cart",
        description: `${quantity} x ${product.name} has been added to your cart.`,
      })

      setIsAdding(false)
    }, 500)
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
          <p className="text-2xl font-bold text-green-600">GH₵{product.price.toFixed(2)}</p>
          {product.sale_price && (
            <p className="text-sm text-muted-foreground line-through">GH₵{product.sale_price.toFixed(2)}</p>
          )}
          {product.stock > 0 ? (
            <p className="text-sm font-medium text-green-600 mt-2">{product.stock} in stock</p>
          ) : (
            <p className="text-sm font-medium text-red-600 mt-2">Out of stock</p>
          )}
        </div>

        <div className="mb-6">
          <p className="text-gray-700">{product.description}</p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Quantity</p>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || product.stock <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              disabled={quantity >= product.stock || product.stock <= 0}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
            onClick={handleAddToCart}
            disabled={isAdding || product.stock <= 0}
          >
            {isAdding ? (
              "Adding to Cart..."
            ) : product.stock <= 0 ? (
              "Out of Stock"
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
