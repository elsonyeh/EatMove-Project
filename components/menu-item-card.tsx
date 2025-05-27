"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

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
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 bg-white">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-bold text-lg text-gray-900">{item.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {item.category}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed">
          {item.description}
        </p>
        <div className="text-xl font-bold text-brand-primary">
          ${item.price}
        </div>
      </div>
      <Button
        onClick={() => onAddToCart(item.id)}
        className="shrink-0 bg-brand-primary hover:bg-brand-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
      >
        加入購物車
      </Button>
    </div>
  )
}
