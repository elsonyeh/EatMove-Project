"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Heart, Clock, ShoppingCart, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { BrandLogo } from "@/components/brand-logo"
import { Badge } from "@/components/ui/badge"

export function MobileNav() {
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
      badge: 0, // 可以動態更新
    },
    {
      href: "/user/recent",
      label: "近期瀏覽",
      icon: Clock,
      active: pathname === "/user/recent",
    },
    {
      href: "/user/cart",
      label: "購物車",
      icon: ShoppingCart,
      active: pathname === "/user/cart",
      badge: 3, // 可以動態更新
    },
  ]

  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-brand-dark hover:text-brand-primary">
            <Menu className="h-6 w-6" />
            <span className="sr-only">開啟選單</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="border-r-brand-primary/20">
          <SheetHeader className="mb-6">
            <SheetTitle>
              <BrandLogo size="lg" />
            </SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-4">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center py-3 px-4 text-base font-medium transition-colors rounded-lg",
                  route.active
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <route.icon className="mr-3 h-5 w-5" />
                {route.label}
                {route.badge !== undefined && route.badge > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-auto h-5 min-w-5 flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs"
                  >
                    {route.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
