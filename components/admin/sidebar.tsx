"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingBasket, Package, Users, Settings, ChevronRight, AlertTriangle } from "lucide-react"

export default function AdminSidebar() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: <ShoppingBasket className="h-5 w-5" />,
    },
    {
      name: "Inventory",
      href: "/admin/inventory",
      icon: <AlertTriangle className="h-5 w-5" />,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: <Package className="h-5 w-5" />,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  return (
    <div className="w-64 bg-background border-r h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-green-600 dark:text-green-400">
            Betza<span className="text-orange-500">Store</span>
          </span>
        </Link>
        <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
      </div>

      <nav className="px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {item.icon}
                <span>{item.name}</span>
                {pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
