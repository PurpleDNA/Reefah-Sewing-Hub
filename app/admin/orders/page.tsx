import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; query?: string } }) {
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from("orders")
    .select("*, profiles:user_id(full_name, email)")
    .order("created_at", { ascending: false })

  // Apply status filter if provided
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status)
  }

  // Apply search filter if provided
  if (searchParams.query) {
    query = query.or(
      `first_name.ilike.%${searchParams.query}%,last_name.ilike.%${searchParams.query}%,email.ilike.%${searchParams.query}%`,
    )
  }

  const { data: orders, error } = await query

  if (error) {
    console.error("Error fetching orders:", error)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Orders</h1>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="query"
                placeholder="Search by name or email..."
                className="pl-10"
                defaultValue={searchParams.query || ""}
              />
            </div>
            <Select name="status" defaultValue={searchParams.status || "all"}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Filter</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <div>
                        <p>{order.profiles?.full_name || `${order.first_name} ${order.last_name}`}</p>
                        <p className="text-sm text-muted-foreground">{order.profiles?.email || order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>₦{order.total.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`
                          ${
                            order.status === "delivered"
                              ? "bg-green-50 text-green-700"
                              : order.status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : order.status === "shipped"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-amber-50 text-amber-700"
                          }
                        `}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {error ? "Error loading orders" : "No orders found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
