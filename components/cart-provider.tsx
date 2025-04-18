"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import type { CartItem } from "@/types"
import { toast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

interface CartContextType {
  items: CartItem[]
  addItem: (item: CartItem) => void
  updateItemQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
  total: number
  isEmpty: boolean
}

export const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const { user } = useAuth()

  // Load cart from localStorage or Supabase on mount
  useEffect(() => {
    const loadCart = async () => {
      if (user) {
        // If user is logged in, try to load cart from Supabase
        try {
          const supabase = createClient()
          const { data } = await supabase.from("carts").select("items").eq("user_id", user.id).single()

          if (data?.items) {
            setItems(data.items)
            return
          }
        } catch (error) {
          console.error("Failed to load cart from Supabase:", error)
        }
      }

      // Fall back to localStorage if no user or no Supabase cart
      const storedCart = localStorage.getItem("cart")
      if (storedCart) {
        try {
          setItems(JSON.parse(storedCart))
        } catch (error) {
          console.error("Failed to parse cart from localStorage:", error)
        }
      }
    }

    loadCart()
  }, [user])

  // Save cart to localStorage and Supabase whenever it changes
  useEffect(() => {
    // Always save to localStorage for quick access
    localStorage.setItem("cart", JSON.stringify(items))

    // If user is logged in, also save to Supabase
    if (user) {
      const saveToSupabase = async () => {
        try {
          const supabase = createClient()

          // Check if cart exists
          const { data } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

          if (data) {
            // Update existing cart
            await supabase.from("carts").update({ items, updated_at: new Date().toISOString() }).eq("user_id", user.id)
          } else {
            // Create new cart
            await supabase.from("carts").insert({ user_id: user.id, items })
          }
        } catch (error) {
          console.error("Failed to save cart to Supabase:", error)
        }
      }

      saveToSupabase()
    }
  }, [items, user])

  const addItem = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id)

      if (existingItemIndex > -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex].quantity += newItem.quantity
        return updatedItems
      } else {
        // Item doesn't exist, add it
        return [...prevItems, newItem]
      }
    })
  }

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
    toast({
      description: "Item removed from cart",
    })
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const isEmpty = items.length === 0

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        total,
        isEmpty,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
