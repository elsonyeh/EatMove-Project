"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Settings } from "lucide-react"

export function DeliveryNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/delivery/dashboard",
      label: "儀表板",
      icon: LayoutDashboard,
      active: pathname === "/delivery/dashboard",
    },
    {
      href: "/delivery/settings",
      label: "個人設定",
      icon: Settings,
      active: pathname === "/delivery/settings",
    },
  ]

  return (
    <nav className="flex items-center space-x-6 lg:space-x-8">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            route.active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
