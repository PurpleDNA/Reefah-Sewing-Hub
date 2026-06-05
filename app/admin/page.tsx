"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Package, ShoppingBag, Users, AlertTriangle, type LucideIcon } from "lucide-react"
import ProductsTab from "@/components/admin/products-tab"
import OrdersTab from "@/components/admin/orders-tab"
import UsersTab from "@/components/admin/users-tab"

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("products")
  const [stats, setStats] = useState<{
    products: number
    productsNew: number
    orders: number
    ordersNew: number
    users: number
    usersNew: number
  } | null>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        router.push("/auth/login?redirect=/admin")
        return
      }

      try {
        const supabase = await createClient()

        // Try to use the RPC function first
        try {
          const { data, error } = await supabase.rpc("check_if_admin", { user_id: user.id })

          if (error) {
            console.error("Error checking admin status via RPC:", error)
            throw error
          }

          if (data === true) {
            setIsAdmin(true)
            setLoading(false)
            return
          }
        } catch (rpcError) {
          console.error("RPC method failed, falling back to direct query:", rpcError)
        }

        // Fallback to direct query
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single()

        if (profileError) {
          console.error("Error with fallback admin check:", profileError)
          setError("Failed to verify admin status. Please try again later.")
          setIsAdmin(false)
        } else {
          setIsAdmin(!!profileData?.is_admin)
        }
      } catch (error) {
        console.error("Failed to check admin status:", error)
        setError("An unexpected error occurred. Please try again later.")
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, router])

  // Load the real dashboard counts once admin access is confirmed. Uses
  // head:true count queries (no rows transferred) and real created_at windows
  // for the "new this week/month" figures — no mock data.
  useEffect(() => {
    if (!isAdmin) return

    const loadStats = async () => {
      try {
        const supabase = await createClient()
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const countRows = { count: "exact" as const, head: true }

        const [products, productsNew, orders, ordersNew, users, usersNew] = await Promise.all([
          supabase.from("products").select("*", countRows),
          supabase.from("products").select("*", countRows).gte("created_at", monthAgo),
          supabase.from("orders").select("*", countRows),
          supabase.from("orders").select("*", countRows).gte("created_at", weekAgo),
          supabase.from("profiles").select("*", countRows),
          supabase.from("profiles").select("*", countRows).gte("created_at", weekAgo),
        ])

        setStats({
          products: products.count ?? 0,
          productsNew: productsNew.count ?? 0,
          orders: orders.count ?? 0,
          ordersNew: ordersNew.count ?? 0,
          users: users.count ?? 0,
          usersNew: usersNew.count ?? 0,
        })
      } catch (err) {
        console.error("Failed to load dashboard stats:", err)
      }
    }

    loadStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Loader2 className="mx-auto h-16 w-16 text-muted-foreground mb-4 animate-spin" />
        <h2 className="text-2xl font-bold mb-2">Verifying admin access...</h2>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-8">You do not have permission to access the admin dashboard.</p>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Products"
          icon={Package}
          value={stats?.products ?? null}
          sub={stats ? `+${stats.productsNew} in the last 30 days` : null}
        />
        <StatCard
          title="Total Orders"
          icon={ShoppingBag}
          value={stats?.orders ?? null}
          sub={stats ? `+${stats.ordersNew} in the last 7 days` : null}
        />
        <StatCard
          title="Total Users"
          icon={Users}
          value={stats?.users ?? null}
          sub={stats ? `+${stats.usersNew} new this week` : null}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-8">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <ProductsTab />
        </TabsContent>
        <TabsContent value="orders">
          <OrdersTab />
        </TabsContent>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dashboard stat card. `value`/`sub` are null while the real counts load.
// ---------------------------------------------------------------------------
function StatCard({
  title,
  icon: Icon,
  value,
  sub,
}: {
  title: string
  icon: LucideIcon
  value: number | null
  sub: string | null
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        )}
        <p className="text-xs text-muted-foreground">{sub ?? " "}</p>
      </CardContent>
    </Card>
  )
}
