"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Heart, Clock } from "lucide-react"
import { CartIcon } from "@/components/cart-icon"

export function MainNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/user/home",
      label: "首頁",
      icon: Home,
      active: pathname === "/user/home",
    },
    {
      href: "/user/favorites",
      label: "我的最愛",
      icon: Heart,
      active: pathname === "/user/favorites",
    },
    {
      href: "/user/recent",
      label: "近期瀏覽",
      icon: Clock,
      active: pathname === "/user/recent",
    },
  ]

  return (
    <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-brand-primary relative group",
            route.active ? "text-brand-primary" : "text-muted-foreground",
          )}
        >
          <route.icon
            className={cn(
              "mr-2 h-5 w-5 transition-all",
              route.active ? "text-brand-primary" : "text-muted-foreground group-hover:text-brand-primary",
            )}
          />
          <span>{route.label}</span>
          {route.active && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />}
        </Link>
      ))}
      <Link
        href="/user/cart"
        className={cn(
          "flex items-center text-sm font-medium transition-colors hover:text-brand-primary relative group",
          pathname === "/user/cart" ? "text-brand-primary" : "text-muted-foreground",
        )}
      >
        <CartIcon className={cn(
          "mr-2 transition-all",
          pathname === "/user/cart" ? "text-brand-primary" : "text-muted-foreground group-hover:text-brand-primary",
        )} />
        <span>購物車</span>
        {pathname === "/user/cart" && (
          <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-brand-primary rounded-full" />
        )}
      </Link>
    </nav>
  )
}
