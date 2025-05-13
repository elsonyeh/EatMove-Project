"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, Settings } from "lucide-react"
import { BrandLogo } from "@/components/brand-logo"
import { useRestaurantAuth } from "@/components/restaurant-auth-provider"

export function RestaurantNav() {
  const pathname = usePathname()
  const { account } = useRestaurantAuth()

  const routes = [
    {
      href: "/restaurant/dashboard",
      label: "儀表板",
      icon: LayoutDashboard,
      active: pathname === "/restaurant/dashboard",
    },
    {
      href: "/restaurant/products",
      label: "商品管理",
      icon: Package,
      active: pathname === "/restaurant/products",
    },
    {
      href: "/restaurant/settings",
      label: "餐廳設定",
      icon: Settings,
      active: pathname === "/restaurant/settings",
    },
  ]

  return (
    <div className="flex items-center gap-6 lg:gap-8">
      <Link href="/restaurant/dashboard" className="hidden md:block">
        <BrandLogo href={null} />
      </Link>
      {account && (
        <nav className="flex items-center space-x-6 lg:space-x-8">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center text-sm font-medium transition-colors hover:text-brand-primary",
                route.active ? "text-brand-primary" : "text-muted-foreground",
              )}
            >
              <route.icon className="mr-2 h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  )
}
