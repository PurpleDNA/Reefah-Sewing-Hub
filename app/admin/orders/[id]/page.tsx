import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OrderStatusForm } from "@/components/admin/order-status-form"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getOrderStatusMeta } from "@/lib/order-status"

export default async function OrderDetails({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Fetch order data
  const { data: order } = await supabase
    .from("orders")
    .select("*, profiles:user_id(full_name, email)")
    .eq("id", params.id)
    .single()

  if (!order) {
    notFound()
  }

  // Fetch order items
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("*, products(name, image_url)")
    .eq("order_id", order.id)

  // Latest payment attempt — drives the payment summary + over/under-payment flags.
  const { data: payment } = await supabase
    .from("payments")
    .select("status, amount, amount_paid, overpaid_amount, currency")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const cur = payment?.currency || order.currency || "GH₵"
  const overpaid = Number(payment?.overpaid_amount) || 0
  const isUnderpaid = payment?.status === "underpaid" || order.payment_status === "underpaid"

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Order Details</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderItems &&
                    orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-md overflow-hidden relative">
                              {item.products?.image_url && (
                                <img
                                  src={item.products.image_url || "/placeholder.svg"}
                                  alt={item.products.name}
                                  className="object-cover w-full h-full"
                                />
                              )}
                            </div>
                            <span>{item.products?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>GH₵{item.price.toLocaleString()}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">GH₵{(item.price * item.quantity).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <p>{order.profiles?.full_name || `${order.first_name} ${order.last_name}`}</p>
                  <p>{order.profiles?.email || order.email}</p>
                  <p>{order.phone}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Shipping Address</h3>
                  <p>{order.address}</p>
                  <p>
                    {order.city}, {order.state} {order.postal_code}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono">{order.id.substring(0, 12)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getOrderStatusMeta(order.status).className}>
                    {getOrderStatusMeta(order.status).label}
                  </Badge>
                </div>
                <div className="border-t my-4"></div>
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>GH₵{order.total.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment status</span>
                  <Badge
                    variant="outline"
                    className={
                      order.payment_status === "paid"
                        ? "bg-green-50 text-green-700"
                        : isUnderpaid
                          ? "bg-amber-50 text-amber-700"
                          : order.payment_status === "failed" || order.payment_status === "expired"
                            ? "bg-red-50 text-red-700"
                            : "bg-muted text-muted-foreground"
                    }
                  >
                    {isUnderpaid ? "Underpaid" : order.payment_status || "—"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected</span>
                  <span>
                    {cur} {Number(payment?.amount ?? order.total).toLocaleString()}
                  </span>
                </div>
                {payment?.amount_paid != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Received</span>
                    <span>
                      {cur} {Number(payment.amount_paid).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {overpaid > 0 && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Customer overpaid by{" "}
                  <span className="font-semibold">
                    {cur} {overpaid.toLocaleString()}
                  </span>
                  . Refund the difference.
                </div>
              )}

              {isUnderpaid && (
                <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Customer paid less than the order total. This order is not fulfilled — collect the balance
                  or refund what was received.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderStatusForm orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
