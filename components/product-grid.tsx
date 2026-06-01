"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { ShoppingCart } from "lucide-react"

interface ProductGridProps {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const { addItem } = useCart()
  const [addingToCart, setAddingToCart] = useState<string | null>(null)

  const handleAddToCart = (product: Product) => {
    setAddingToCart(product.id)

    setTimeout(() => {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        quantity: 1,
      })

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      })

      setAddingToCart(null)
    }, 500)
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground">Try changing your filters or check back later.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
                GH₵{product.price.toLocaleString()}
              </Badge>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleAddToCart(product)}
              disabled={addingToCart === product.id || product.stock <= 0}
            >
              {addingToCart === product.id ? (
                "Adding..."
              ) : product.stock <= 0 ? (
                "Out of Stock"
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
  )
}
