"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import type { CartItem as CartItemType } from "@/types"
import { Minus, Plus, Trash2 } from "lucide-react"

interface CartItemProps {
  item: CartItemType
}

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity, removeItem } = useCart()
  const [isRemoving, setIsRemoving] = useState(false)

  const handleIncrement = () => {
    updateItemQuantity(item.id, item.quantity + 1)
  }

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateItemQuantity(item.id, item.quantity - 1)
    }
  }

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      removeItem(item.id)
    }, 300)
  }

  return (
    <div
      className={`flex border rounded-lg overflow-hidden transition-opacity duration-300 ${isRemoving ? "opacity-50" : "opacity-100"}`}
    >
      <div className="w-24 h-24 relative flex-shrink-0">
        <Image
          src={item.image || "/placeholder.svg?height=100&width=100"}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 justify-between p-4">
        <div>
          <Link href={`/products/${item.id}`} className="font-medium hover:text-green-600 transition-colors">
            {item.name}
          </Link>
          <p className="text-sm text-muted-foreground mt-1">₦{item.price.toFixed(2)}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleIncrement}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-right">
            <p className="font-medium">₦{(item.price * item.quantity).toFixed(2)}</p>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="text-xs">Remove</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
