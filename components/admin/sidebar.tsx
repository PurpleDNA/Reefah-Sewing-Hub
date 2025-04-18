"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut, Layers } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

export default function AdminSidebar() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  const navItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Products",
      href: "/admin/products",
      icon: ShoppingBag,
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: Package,
    },
    {
      name: "Categories",
      href: "/admin/categories",
      icon: Layers,
    },
    {
      name: "Customers",
      href: "/admin/customers",
      icon: Users,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 bg-gray-50 border-r min-h-screen p-4">
      <div className="mb-8">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-bold text-green-600">
            Betza<span className="text-orange-500">Store</span>
          </span>
          <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">Admin</span>
        </Link>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-md",
              pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
                ? "bg-green-100 text-green-700"
                : "text-gray-700 hover:bg-gray-100",
            )}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.name}
          </Link>
        ))}

        <button
          onClick={() => signOut()}
          className="flex items-center px-4 py-3 text-sm font-medium rounded-md w-full text-left text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Link
          href="/"
          className="flex items-center justify-center px-4 py-2 text-sm text-center text-gray-700 hover:bg-gray-100 rounded-md"
        >
          Return to Store
        </Link>
      </div>
    </div>
  )
}
