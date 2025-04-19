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
        if (user) {
          // If user is logged in, try to load cart from Supabase
          try {
            if (!supabaseRef.current) {
              supabaseRef.current = createClient()
            }

            // Fix: Use maybeSingle() instead of single() to handle case where cart doesn't exist
            const { data, error } = await supabaseRef.current
              .from("carts")
              .select("*") // Fix: Select all columns first
              .eq("user_id", user.id)
              .maybeSingle()

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
          if (!supabaseRef.current) {
            supabaseRef.current = createClient()
          }

          // First check if cart exists
          const { data, error } = await supabaseRef.current
            .from("carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          console.log("Checking if cart exists:", { data, error, userId: user.id })

          if (data) {
            // Update existing cart
            const { error: updateError } = await supabaseRef.current
              .from("carts")
              .update({
                items,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id)

            console.log("Updated cart in Supabase:", { updateError, items })

            if (updateError) {
              console.error("Failed to update cart in Supabase:", updateError)
            }
          } else {
            // Create new cart
            const { error: insertError } = await supabaseRef.current.from("carts").insert({
              user_id: user.id,
              items,
            })

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

    // If user is logged in, update cart in backend directly
    if (user) {
      try {
        if (!supabaseRef.current) {
          supabaseRef.current = createClient()
        }

        // Get current cart
        const { data: existingCart } = await supabaseRef.current
          .from("carts")
          .select("*") // Fix: Select all columns first
          .eq("user_id", user.id)
          .maybeSingle()

        let updatedItems: CartItem[] = []

        if (existingCart?.items) {
          // Cart exists, update items
          const existingItems = existingCart.items
          const existingItemIndex = existingItems.findIndex((item: CartItem) => item.id === newItem.id)

          if (existingItemIndex > -1) {
            // Item exists, update quantity
            updatedItems = [...existingItems]
            updatedItems[existingItemIndex].quantity += newItem.quantity
          } else {
            // Item doesn't exist, add it
            updatedItems = [...existingItems, newItem]
          }

          // Update cart in database
          await supabaseRef.current
            .from("carts")
            .update({
              items: updatedItems,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        } else {
          // Cart doesn't exist, create it
          await supabaseRef.current.from("carts").insert({
            user_id: user.id,
            items: [newItem],
          })
        }
      } catch (error) {
        console.error("Error updating cart in backend:", error)
      }
    }

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

    // If user is logged in, update cart in backend
    if (user) {
      try {
        if (!supabaseRef.current) {
          supabaseRef.current = createClient()
        }

        // Get current cart
        const { data: existingCart } = await supabaseRef.current
          .from("carts")
          .select("*") // Fix: Select all columns first
          .eq("user_id", user.id)
          .maybeSingle()

        if (existingCart?.items) {
          // Update the item quantity
          const updatedItems = existingCart.items.map((item: CartItem) =>
            item.id === id ? { ...item, quantity } : item,
          )

          // Update cart in database
          await supabaseRef.current
            .from("carts")
            .update({
              items: updatedItems,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        }
      } catch (error) {
        console.error("Error updating item quantity in backend:", error)
      }
    }
  }

  const removeItem = async (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))

    // If user is logged in, update cart in backend
    if (user) {
      try {
        if (!supabaseRef.current) {
          supabaseRef.current = createClient()
        }

        // Get current cart
        const { data: existingCart } = await supabaseRef.current
          .from("carts")
          .select("*") // Fix: Select all columns first
          .eq("user_id", user.id)
          .maybeSingle()

        if (existingCart?.items) {
          // Remove the item
          const updatedItems = existingCart.items.filter((item: CartItem) => item.id !== id)

          // Update cart in database
          await supabaseRef.current
            .from("carts")
            .update({
              items: updatedItems,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", user.id)
        }
      } catch (error) {
        console.error("Error removing item from backend cart:", error)
      }
    }

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
