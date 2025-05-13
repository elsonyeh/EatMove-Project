"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface CartIconProps {
  className?: string
}

export function CartIcon({ className }: CartIconProps) {
  const { getTotalItems, mounted } = useCart()
  const itemCount = mounted ? getTotalItems() : 0

  return (
    <Link href="/user/cart">
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", className)}
        aria-label={`購物車，${itemCount} 件商品`}
      >
        <ShoppingCart className="h-5 w-5" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-primary text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
    </Link>
  )
}
