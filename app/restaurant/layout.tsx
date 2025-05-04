import type React from "react"
import { RestaurantAuthProvider } from "@/components/restaurant-auth-provider"
import { RestaurantNav } from "@/components/restaurant-nav"
import { RestaurantUserNav } from "@/components/restaurant-user-nav"

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RestaurantAuthProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center">
            <RestaurantNav />
            <div className="ml-auto flex items-center space-x-4">
              <RestaurantUserNav />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </RestaurantAuthProvider>
  )
}
