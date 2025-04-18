"use client"

import { useCart } from "@/hooks/use-cart"
import { CartItem } from "@/components/cart-item"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"

export default function CartPage() {
  const { items, total, isEmpty } = useCart()
  const router = useRouter()

  if (isEmpty) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>
        </div>
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                <span>Total</span>
                <span>₦{total.toFixed(2)}</span>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={() => router.push("/checkout")}>
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
