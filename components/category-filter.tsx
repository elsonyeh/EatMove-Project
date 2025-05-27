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
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setActive(activeCategory)
  }, [activeCategory])

  // 獲取可用的料理類型
  useEffect(() => {
    const fetchAvailableCategories = async () => {
      try {
        const response = await fetch('/api/restaurants?getCategories=true')
        const data = await response.json()

        if (data.success) {
          setAvailableCategories(data.categories)
        }
      } catch (error) {
        console.error('獲取料理類型失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableCategories()
  }, [])

  const handleCategoryChange = (categoryId: string, categoryName: string) => {
    setActive(categoryId)
    if (onCategoryChange) {
      onCategoryChange(categoryId, categoryName)
    }
  }

  // 料理類型對應的圖標和ID映射
  const cuisineIconMap: { [key: string]: { icon: any, id: string } } = {
    "中式料理": { icon: Soup, id: "chinese" },
    "日式料理": { icon: Beef, id: "japanese" },
    "韓式料理": { icon: Drumstick, id: "korean" },
    "義式料理": { icon: Pizza, id: "italian" },
    "美式料理": { icon: Sandwich, id: "american" },
    "南洋料理": { icon: Salad, id: "thai" },
    "素食": { icon: Salad, id: "vegetarian" },
    "甜點": { icon: Cake, id: "dessert" },
    "飲料": { icon: Coffee, id: "beverage" },
  }

  // 構建動態類別列表
  const categories = [
    { id: "all", name: "全部", icon: Utensils },
    ...availableCategories.map(cuisine => ({
      id: cuisineIconMap[cuisine]?.id || cuisine.toLowerCase(),
      name: cuisine,
      icon: cuisineIconMap[cuisine]?.icon || Utensils
    }))
  ]

  if (loading) {
    return (
      <div className="w-full h-12 bg-gray-100 rounded-lg animate-pulse"></div>
    )
  }

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
