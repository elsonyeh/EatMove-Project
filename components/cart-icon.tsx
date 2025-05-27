"use client"

import { ShoppingCart } from "lucide-react"
import { useCartDB } from "@/hooks/use-cart-db"
import { cn } from "@/lib/utils"

interface CartIconProps {
  className?: string
}

export function CartIcon({ className }: CartIconProps) {
  const { cart, loading } = useCartDB()
  const itemCount = loading ? 0 : cart.totalItems

  return (
    <div className={cn("relative", className)}>
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </div>
  )
}
