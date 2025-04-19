"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Package, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  products?: {
    name: string
    image_url?: string
  }
}

interface Order {
  id: string
  user_id: string
  total: number
  status: string
  created_at: string
  first_name: string
  last_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  items?: OrderItem[]
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

      if (error) throw error

      // Fetch order items for each order
      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from("order_items")
            .select("*, products(name, image_url)")
            .eq("order_id", order.id)

          return {
            ...order,
            items: itemsData || [],
          }
        }),
      )

      setOrders(ordersWithItems)
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "Failed to load orders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const supabase = createClient()

      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

      if (error) throw error

      setOrders(orders.map((order) => (order.id === orderId ? { ...order, status } : order)))

      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder({ ...currentOrder, status })
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      })
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const openViewDialog = (order: Order) => {
    setCurrentOrder(order)
    setIsViewDialogOpen(true)
  }

  const filteredOrders = statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Orders</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No orders found</h3>
          <p className="text-muted-foreground mb-4">
            {statusFilter === "all" ? "There are no orders yet." : `There are no orders with status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id.substring(0, 8)}</TableCell>
                  <TableCell>
                    {order.first_name} {order.last_name}
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`
                        ${
                          order.status === "delivered"
                            ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : order.status === "cancelled"
                              ? "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : order.status === "shipped"
                                ? "bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                                : "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                        }
                      `}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>₦{order.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openViewDialog(order)}>
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{currentOrder?.id.substring(0, 8)} - Placed{" "}
              {currentOrder?.created_at && formatDistanceToNow(new Date(currentOrder.created_at), { addSuffix: true })}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <p>
                {currentOrder?.first_name} {currentOrder?.last_name}
              </p>
              <p>{currentOrder?.email}</p>
              <p>{currentOrder?.phone}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <p>{currentOrder?.address}</p>
              <p>
                {currentOrder?.city}, {currentOrder?.state} {currentOrder?.postal_code}
              </p>
            </div>
          </div>

          <div className="py-2">
            <h3 className="font-medium mb-2">Order Status</h3>
            <Select
              value={currentOrder?.status}
              onValueChange={(value) => currentOrder && updateOrderStatus(currentOrder.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="py-2">
            <h3 className="font-medium mb-2">Order Items</h3>
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentOrder?.items?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.products?.name || "Product"}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₦{item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-right">₦{(item.price * item.quantity).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4">
              <div className="text-right">
                <div className="flex justify-between gap-8">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">₦{currentOrder?.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
