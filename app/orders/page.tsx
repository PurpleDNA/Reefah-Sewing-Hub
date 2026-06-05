"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { CreditCard, Loader2, Package, Pencil, ShoppingBag, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { getOrderStatusMeta } from "@/lib/order-status"

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
            const productIds = items.map((item: any) => item.product_id)
            const { data: products } = await supabase
              .from("products")
              .select("id, name, image_url")
              .in("id", productIds)

            // Map products to items
            const itemsWithProducts = items.map((item: any) => {
              const product = products.find((p: any) => p.id === item.product_id)
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
      } catch (err: any) {
        console.error("Error fetching orders:", err)
        setError(err.message || "Failed to load orders")
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  // Apply an in-place edit to local state so the card updates without a refetch.
  const handleOrderUpdated = (orderId: string, patch: Record<string, any>) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)))
  }

  const handleOrderDeleted = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
  }

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
          <OrderCard
            key={order.id}
            order={order}
            onUpdated={handleOrderUpdated}
            onDeleted={handleOrderDeleted}
          />
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Single order card. Owns its own edit-dialog / delete-confirm / pay state.
// ---------------------------------------------------------------------------
function OrderCard({
  order,
  onUpdated,
  onDeleted,
}: {
  order: any
  onUpdated: (orderId: string, patch: Record<string, any>) => void
  onDeleted: (orderId: string) => void
}) {
  const router = useRouter()
  const isPendingPayment = order.payment_status === "pending_payment"

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [paying, setPaying] = useState(false)

  const [form, setForm] = useState({
    firstName: order.first_name || "",
    lastName: order.last_name || "",
    email: order.email || "",
    phone: order.phone || "",
    address: order.address || "",
    city: order.city || "",
    state: order.state || "",
    postalCode: order.postal_code || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      // Re-initiate to mint a fresh virtual account (the previous one may have
      // expired), then hand off to the existing pay page which polls status.
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      })
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}))
        throw new Error(detail?.error || "Could not start the payment. Please try again.")
      }
      router.push(`/checkout/${order.id}/pay`)
    } catch (err: any) {
      console.error("Pay error:", err)
      toast({
        title: "Couldn't start payment",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
      setPaying(false)
    }
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.rpc("update_pending_order", {
        p_order_id: order.id,
        p_first_name: form.firstName,
        p_last_name: form.lastName,
        p_email: form.email,
        p_phone: form.phone,
        p_address: form.address,
        p_city: form.city,
        p_state: form.state,
        p_postal_code: form.postalCode,
      })
      if (error) throw error
      if (data === false) throw new Error("Order can no longer be edited.")

      onUpdated(order.id, {
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postalCode,
      })
      setEditOpen(false)
      toast({ title: "Order updated", description: "Your delivery details were saved." })
    } catch (err: any) {
      console.error("Edit order error:", err)
      toast({
        title: "Couldn't update order",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.rpc("delete_pending_order", {
        p_order_id: order.id,
      })
      if (error) throw error
      if (data === false) throw new Error("Order can no longer be deleted.")

      setDeleteOpen(false)
      onDeleted(order.id)
      toast({ title: "Order deleted", description: "Your pending order was removed." })
    } catch (err: any) {
      console.error("Delete order error:", err)
      toast({
        title: "Couldn't delete order",
        description: err.message || "Please try again.",
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Order #{order.id.substring(0, 8)}</p>
            <CardTitle className="text-lg mt-1">
              Placed {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </CardTitle>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className={getOrderStatusMeta(order.status).className}>
              {getOrderStatusMeta(order.status).label}
            </Badge>
            <p className="font-medium">GH₵{order.total.toLocaleString()}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 border-b">
          <h3 className="font-medium mb-2">Items</h3>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
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

      {isPendingPayment && (
        <CardFooter className="flex flex-wrap gap-3 border-t bg-muted/30 py-4">
          <Button onClick={handlePay} disabled={paying}>
            {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Pay now
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)} disabled={paying}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setDeleteOpen(true)} disabled={paying}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit delivery details</DialogTitle>
            <DialogDescription>
              You can update these while the order is awaiting payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`firstName-${order.id}`}>First Name</Label>
                <Input id={`firstName-${order.id}`} name="firstName" value={form.firstName} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`lastName-${order.id}`}>Last Name</Label>
                <Input id={`lastName-${order.id}`} name="lastName" value={form.lastName} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`email-${order.id}`}>Email</Label>
              <Input id={`email-${order.id}`} name="email" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`phone-${order.id}`}>Phone</Label>
              <Input id={`phone-${order.id}`} name="phone" type="tel" value={form.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`address-${order.id}`}>Address</Label>
              <Input id={`address-${order.id}`} name="address" value={form.address} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`city-${order.id}`}>City</Label>
                <Input id={`city-${order.id}`} name="city" value={form.city} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`state-${order.id}`}>State</Label>
                <Input id={`state-${order.id}`} name="state" value={form.state} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`postalCode-${order.id}`}>Postal Code</Label>
                <Input id={`postalCode-${order.id}`} name="postalCode" value={form.postalCode} onChange={handleChange} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes order #{order.id.substring(0, 8)} and its items. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep order</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
