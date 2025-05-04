"use client"

import { useState, useEffect } from "react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Utensils, Coffee, Pizza, Beef, Soup, Salad, Cake, Sandwich, Drumstick } from "lucide-react"

export interface CategoryFilterProps {
  activeCategory?: string
  onCategoryChange?: (category: string, categoryName: string) => void
}

export function CategoryFilter({ activeCategory = "all", onCategoryChange }: CategoryFilterProps) {
  const [active, setActive] = useState(activeCategory)

  useEffect(() => {
    setActive(activeCategory)
  }, [activeCategory])

  const handleCategoryChange = (categoryId: string, categoryName: string) => {
    setActive(categoryId)
    if (onCategoryChange) {
      onCategoryChange(categoryId, categoryName)
    }
  }

  const categories = [
    { id: "all", name: "全部", icon: Utensils },
    { id: "chinese", name: "中式料理", icon: Soup },
    { id: "japanese", name: "日式料理", icon: Beef },
    { id: "korean", name: "韓式料理", icon: Drumstick },
    { id: "italian", name: "義式料理", icon: Pizza },
    { id: "american", name: "美式料理", icon: Sandwich },
    { id: "thai", name: "泰式料理", icon: Salad },
    { id: "vegetarian", name: "素食", icon: Salad },
    { id: "dessert", name: "甜點", icon: Cake },
    { id: "beverage", name: "飲料", icon: Coffee },
  ]

  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex w-max space-x-3 p-1">
        {categories.map((category) => {
          const isActive = active === category.id
          const Icon = category.icon

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id, category.name)}
              className={`
                category-tag flex items-center gap-2 card-hover
                ${isActive ? "active" : ""}
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
              <span>{category.name}</span>
            </button>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}
