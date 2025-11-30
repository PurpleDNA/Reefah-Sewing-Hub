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
  const isUpdatingRef = useRef(false)
  const pendingUpdateRef = useRef<CartItem[] | null>(null)

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

  // Load cart from localStorage or Supabase on mount or user change
  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log("Loading cart, user:", user?.id)

        // Always try to load from localStorage first for quick display
        const storedCart = localStorage.getItem("cart")
        let localItems: CartItem[] = []

        if (storedCart) {
          try {
            localItems = JSON.parse(storedCart)
            console.log("Loaded cart from localStorage:", localItems.length, "items")

            // Only set items from localStorage if we don't have a user
            // or if we haven't loaded from Supabase yet
            if (!user) {
              setItems(localItems)
            }
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

            console.log("Fetching cart from Supabase for user:", user.id)
            const { data, error } = await supabaseRef.current
              .from("user_carts")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle()

            console.log("Supabase cart response:", { data, error })

            if (data?.items && isMountedRef.current && Array.isArray(data.items)) {
              console.log("Setting cart from Supabase:", data.items.length, "items")
              setItems(data.items)
            } else if (isMountedRef.current && localItems.length > 0) {
              // If no Supabase cart but we have local items, use those
              console.log("No Supabase cart found, using localStorage items")
              setItems(localItems)
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

    // Reset initialization when user changes
    if (isInitialized) {
      setIsInitialized(false)
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
      console.log("Saved cart to localStorage:", items.length, "items")
    } catch (error) {
      console.error("Failed to save cart to localStorage:", error)
    }

    // If user is logged in, also save to Supabase with debounce
    if (user) {
      const updateSupabaseCart = async () => {
        // If already updating, store this update for later
        if (isUpdatingRef.current) {
          console.log("Already updating cart, storing pending update")
          pendingUpdateRef.current = [...items]
          return
        }

        isUpdatingRef.current = true

        try {
          if (!supabaseRef.current) {
            supabaseRef.current = createClient()
          }

          console.log("Checking if cart exists for user:", user.id)
          // First check if cart exists
          const { data, error } = await supabaseRef.current
            .from("user_carts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (data) {
            // Update existing cart
            console.log("Updating existing cart for user:", user.id)
            const { error: updateError } = await supabaseRef.current
              .from("user_carts")
              .update({
                items,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id)

            if (updateError) {
              console.error("Failed to update cart in Supabase:", updateError)
            } else {
              console.log("Cart updated successfully in Supabase")
            }
          } else if (!error) {
            // Create new cart
            console.log("Creating new cart for user:", user.id)
            const { error: insertError } = await supabaseRef.current.from("user_carts").insert({
              user_id: user.id,
              items,
            })

            if (insertError) {
              console.error("Failed to create cart in Supabase:", insertError)
            } else {
              console.log("New cart created successfully in Supabase")
            }
          }
        } catch (error) {
          console.error("Failed to save cart to Supabase:", error)
        } finally {
          isUpdatingRef.current = false

          // If there's a pending update, process it
          if (pendingUpdateRef.current) {
            console.log("Processing pending cart update")
            const pendingItems = pendingUpdateRef.current
            pendingUpdateRef.current = null

            // Small delay to prevent potential race conditions
            setTimeout(() => {
              if (isMountedRef.current) {
                updateSupabaseCart()
              }
            }, 100)
          }
        }
      }

      // Debounce the update to prevent rapid consecutive updates
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          updateSupabaseCart()
        }
      }, 500)

      return () => clearTimeout(timeoutId)
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

        await supabaseRef.current.from("user_carts").update({ items: [] }).eq("user_id", user.id)
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
