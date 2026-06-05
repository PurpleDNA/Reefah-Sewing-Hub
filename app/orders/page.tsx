"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Loader2, Package, ShoppingBag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const supabase = await createClient()

        // Simple query to get orders without joins
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) throw error

        // Fetch items separately for each order to avoid complex joins
        const ordersWithItems = []
        for (const order of data || []) {
          try {
            const { data: items } = await supabase.from("order_items").select("*, product_id").eq("order_id", order.id)

            // Get product details separately
            const productIds = items.map((item) => item.product_id)
            const { data: products } = await supabase
              .from("products")
              .select("id, name, image_url")
              .in("id", productIds)

            // Map products to items
            const itemsWithProducts = items.map((item) => {
              const product = products.find((p) => p.id === item.product_id)
              return {
                ...item,
                products: product,
              }
            })

            ordersWithItems.push({
              ...order,
              items: itemsWithProducts,
            })
          } catch (itemError) {
            console.error("Error fetching items for order:", order.id, itemError)
            // Still add the order even if items fetch fails
            ordersWithItems.push({
              ...order,
              items: [],
            })
          }
        }

        setOrders(ordersWithItems)
      } catch (err) {
        console.error("Error fetching orders:", err)
        setError(err.message || "Failed to load orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Please log in to view your orders</h2>
        <p className="text-muted-foreground mb-8">You need to be logged in to view your order history.</p>
        <Button asChild>
          <Link href="/auth/login?redirect=/orders">Login</Link>
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="mx-auto h-16 w-16 text-muted-foreground mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Loading your orders...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-2">Error loading orders</h2>
        <p className="text-red-500 mb-8">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
        <p className="text-muted-foreground mb-8">You haven't placed any orders yet.</p>
        <Button asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-8">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden">
            <CardHeader className="bg-muted/50">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order #{order.id.substring(0, 8)}</p>
                  <CardTitle className="text-lg mt-1">
                    Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant="outline"
                    className={`
                      ${
                        order.status === "delivered"
                          ? "bg-green-50 text-green-700"
                          : order.status === "cancelled"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                      }
                    `}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <p className="font-medium">GH₵{order.total.toLocaleString()}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 border-b">
                <h3 className="font-medium mb-2">Items</h3>
                <div className="space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {item.products?.image_url ? (
                            <img
                              src={item.products.image_url || "/placeholder.svg"}
                              alt={item.products.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.products?.name || "Product"}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x GH₵{item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <p className="font-medium">GH₵{(item.quantity * item.price).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-medium mb-2">Shipping Address</h3>
                <p>
                  {order.first_name} {order.last_name}
                </p>
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.state} {order.postal_code}
                </p>
                <p>{order.phone}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
