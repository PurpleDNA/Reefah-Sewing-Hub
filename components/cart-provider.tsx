"use client"

import { createContext, useState, useEffect, type ReactNode, useRef } from "react"
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
  const isMountedRef = useRef(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load cart from localStorage or Supabase on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (user) {
          // If user is logged in, try to load cart from Supabase
          try {
            const supabase = createClient()
            const { data, error } = await supabase.from("carts").select("items").eq("user_id", user.id).single()

            console.log("Loading cart from Supabase:", { data, error, userId: user.id })

            if (data?.items && isMountedRef.current) {
              setItems(data.items)
              setIsInitialized(true)
              return
            }
          } catch (error) {
            console.error("Failed to load cart from Supabase:", error)
          }
        }

        // Fall back to localStorage if no user or no Supabase cart
        if (isMountedRef.current) {
          const storedCart = localStorage.getItem("cart")
          if (storedCart) {
            try {
              const parsedCart = JSON.parse(storedCart)
              console.log("Loading cart from localStorage:", parsedCart)
              setItems(parsedCart)
            } catch (error) {
              console.error("Failed to parse cart from localStorage:", error)
            }
          }
          setIsInitialized(true)
        }
      } catch (error) {
        console.error("Error in loadCart:", error)
        setIsInitialized(true)
      }
    }

    loadCart()

    return () => {
      isMountedRef.current = false
    }
  }, [user])

  // Save cart to localStorage and Supabase whenever it changes
  useEffect(() => {
    if (!isInitialized) return

    // Always save to localStorage for quick access
    try {
      localStorage.setItem("cart", JSON.stringify(items))
      console.log("Saved cart to localStorage:", items)
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }

    // If user is logged in, also save to Supabase
    if (user) {
      const saveToSupabase = async () => {
        try {
          const supabase = createClient()

          // Check if cart exists
          const { data, error } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

          console.log("Checking if cart exists:", { data, error, userId: user.id })

          if (data) {
            // Update existing cart
            const { error: updateError } = await supabase
              .from("carts")
              .update({ items, updated_at: new Date().toISOString() })
              .eq("user_id", user.id)

            console.log("Updated cart in Supabase:", { updateError, items })

            if (updateError) {
              console.error("Failed to update cart in Supabase:", updateError)
            }
          } else {
            // Create new cart
            const { error: insertError } = await supabase.from("carts").insert({ user_id: user.id, items })

            console.log("Created new cart in Supabase:", { insertError, items })

            if (insertError) {
              console.error("Failed to create cart in Supabase:", insertError)
            }
          }
        } catch (error) {
          console.error("Failed to save cart to Supabase:", error)
        }
      }

      // Only save to Supabase if the component is still mounted
      if (isMountedRef.current) {
        saveToSupabase()
      }
    }
  }, [items, user, isInitialized])

  // Reset the mounted ref when the component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

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

    toast({
      description: `${newItem.name} added to cart`,
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
    localStorage.removeItem("cart")

    if (user) {
      try {
        const supabase = createClient()
        supabase.from("carts").update({ items: [] }).eq("user_id", user.id)
      } catch (error) {
        console.error("Failed to clear cart in Supabase:", error)
      }
    }
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
