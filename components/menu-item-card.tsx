"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getMenuItemImage } from "@/utils/image-utils"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
}

interface MenuItemCardProps {
  item: MenuItem
  cuisine: string
  index: number
  onAddToCart: (id: string) => void
}

export function MenuItemCard({ item, cuisine, index, onAddToCart }: MenuItemCardProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="w-24 h-24 relative rounded-md overflow-hidden bg-gray-100 shrink-0">
        <Image
          src={getMenuItemImage(item.name) || "/placeholder.svg"}
          alt={item.name}
          fill
          className="object-cover"
          loading={index < 2 ? "eager" : "lazy"}
          sizes="96px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-lg">{item.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
        <div className="text-lg font-bold">${item.price}</div>
      </div>
      <Button onClick={() => onAddToCart(item.id)} className="shrink-0 bg-orange-500 hover:bg-orange-600">
        加入購物車
      </Button>
    </div>
  )
}
