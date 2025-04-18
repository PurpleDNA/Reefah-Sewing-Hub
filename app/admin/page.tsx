import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ShoppingBag, Users, Package, CreditCard } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
  const supabase = createClient()

  // Fetch dashboard stats
  const [{ count: productCount }, { count: orderCount }, { count: userCount }, { data: recentOrders }] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*, profiles:user_id(full_name)")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-full">
                <ShoppingBag className="h-6 w-6 text-green-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                <h3 className="text-2xl font-bold">{productCount || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full">
                <Package className="h-6 w-6 text-blue-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <h3 className="text-2xl font-bold">{orderCount || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-full">
                <Users className="h-6 w-6 text-purple-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <h3 className="text-2xl font-bold">{userCount || 0}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-amber-100 p-2 rounded-full">
                <CreditCard className="h-6 w-6 text-amber-700" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <h3 className="text-2xl font-bold">₦0.00</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest 5 orders placed on your store</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{order.profiles?.full_name || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="font-medium">₦{order.total.toLocaleString()}</p>
                      <p
                        className={`text-xs ${
                          order.status === "delivered"
                            ? "text-green-600"
                            : order.status === "cancelled"
                              ? "text-red-600"
                              : "text-amber-600"
                        } uppercase`}
                      >
                        {order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No orders yet</p>
            )}

            <div className="mt-4">
              <Link href="/admin/orders" className="text-sm text-green-600 hover:underline">
                View all orders →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for store management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/products/new">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-medium">Add New Product</h3>
                    <p className="text-sm text-muted-foreground">Create a new product listing</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/products">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-medium">Manage Products</h3>
                    <p className="text-sm text-muted-foreground">Update inventory and details</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/orders">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-medium">Process Orders</h3>
                    <p className="text-sm text-muted-foreground">Update order status</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/categories">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-medium">Manage Categories</h3>
                    <p className="text-sm text-muted-foreground">Add or edit product categories</p>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
