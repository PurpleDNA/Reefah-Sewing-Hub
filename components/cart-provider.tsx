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
  const supabaseRef = useRef<any>(null)

  // Initialize Supabase client
  useEffect(() => {
    try {
      if (!supabaseRef.current) {
        supabaseRef.current = createClient()
      }
    } catch (error) {
      console.error("Failed to initialize Supabase client:", error)
    }
  }, [])

  // Load cart from localStorage or Supabase on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        // Always try to load from localStorage first for quick display
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

        // If user is logged in, try to load cart from Supabase
        if (user) {
          try {
            if (!supabaseRef.current) {
              supabaseRef.current = createClient()
            }

            // Fix: Use select("*") instead of select("items")
            const { data, error } = await supabaseRef.current
              .from("carts")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle()

            console.log("Loading cart from Supabase:", { data, error, userId: user.id })

            if (data?.items && isMountedRef.current && Array.isArray(data.items)) {
              setItems(data.items)
            }
          } catch (error) {
            console.error("Failed to load cart from Supabase:", error)
          }
        }

        if (isMountedRef.current) {
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

    // Use a ref to track if we're currently updating to prevent loops
    const updateCart = async () => {
      // Always save to localStorage for quick access
      try {
        localStorage.setItem("cart", JSON.stringify(items))
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error)
      }

      // If user is logged in, also save to Supabase
      if (user) {
        try {
          if (!supabaseRef.current) {
            supabaseRef.current = createClient()
          }

          // First check if cart exists
          const { data, error } = await supabaseRef.current
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (data) {
            // Update existing cart
            await supabaseRef.current
              .from("carts")
              .update({
                items,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id)
          } else if (!error) {
            // Create new cart
            await supabaseRef.current.from("carts").insert({
              user_id: user.id,
              items,
            })
          }
        } catch (error) {
          console.error("Failed to save cart to Supabase:", error)
        }
      }
    }

    // Debounce the update to prevent rapid consecutive updates
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        updateCart()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [items, user, isInitialized])

  // Reset the mounted ref when the component unmounts
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const addItem = async (newItem: CartItem) => {
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

  const updateItemQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }

    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }

  const removeItem = async (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))

    toast({
      description: "Item removed from cart",
    })
  }

  const clearCart = async () => {
    setItems([])
    localStorage.removeItem("cart")

    if (user) {
      try {
        if (!supabaseRef.current) {
          supabaseRef.current = createClient()
        }

        await supabaseRef.current.from("carts").update({ items: [] }).eq("user_id", user.id)
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
