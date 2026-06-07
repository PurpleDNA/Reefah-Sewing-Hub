"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  ShoppingBasket,
  Package,
  Users,
  Settings,
  ChevronRight,
  AlertTriangle,
  FolderTree,
  Mail,
  Menu,
} from "lucide-react"

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
    name: "Categories",
    href: "/admin/categories",
    icon: <FolderTree className="h-5 w-5" />,
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
    name: "Messages",
    href: "/admin/messages",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

function SidebarNav({
  pathname,
  unread,
  onNavigate,
}: {
  pathname: string
  unread: number
  onNavigate?: () => void
}) {
  return (
    <nav className="px-3 py-2">
      <ul className="space-y-1">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.href === "/admin/messages" && unread > 0 ? (
                <span className="ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-green-600 px-1.5 text-xs font-semibold text-white">
                  {unread}
                </span>
              ) : (
                pathname === item.href && <ChevronRight className="ml-auto h-4 w-4" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function Branding() {
  return (
    <div className="p-6">
      <Link href="/" className="flex items-center">
        <span className="text-xl font-bold text-green-600 dark:text-green-400">
          REEFA <span className="text-orange-500">SEWING HUB</span>
        </span>
      </Link>
      <p className="text-sm text-muted-foreground mt-1">Admin Dashboard</p>
    </div>
  )
}

export default function AdminSidebar({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname()
  const [unread, setUnread] = useState(unreadMessages)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Keep the badge fresh as the admin moves between pages (e.g. after marking
  // messages read). The server-provided count seeds the initial render.
  useEffect(() => {
    let active = true
    const supabase = createClient()
    supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)
      .then((res: { count: number | null }) => {
        if (active && typeof res.count === "number") setUnread(res.count)
      })
    return () => {
      active = false
    }
  }, [pathname])

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 bg-background border-r h-screen sticky top-0 overflow-y-auto">
        <Branding />
        <SidebarNav pathname={pathname} unread={unread} />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b bg-background px-4 py-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Open admin menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 overflow-y-auto">
            <Branding />
            <SidebarNav pathname={pathname} unread={unread} onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href="/" className="font-bold text-green-600 dark:text-green-400">
          REEFA <span className="text-orange-500">SEWING HUB</span>
        </Link>
      </header>
    </>
  )
}
