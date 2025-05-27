"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export interface RecentViewRestaurant {
  id: string
  name: string
  description: string
  coverImage: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  address: string
  phone: string
  cuisine: string
  isNew: boolean
  distance?: string
  viewedAt: string // 添加查看時間
}

// 最大記錄數量
const MAX_RECENT_ITEMS = 10

export function useRecentViews() {
  const [recentViews, setRecentViews] = useLocalStorage<RecentViewRestaurant[]>("eatmove-recent-views", [])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 等待 localStorage 初始化完成
    const timer = setTimeout(() => {
      setIsLoaded(true)
      console.log("📚 近期瀏覽初始化完成，當前項目數量:", recentViews.length)
    }, 100)
    return () => clearTimeout(timer)
  }, [recentViews.length])

  // 添加店家到近期瀏覽
  const addRecentView = (restaurant: Omit<RecentViewRestaurant, 'viewedAt'>) => {
    if (!isLoaded) {
      console.log("⚠️ localStorage 尚未初始化，跳過添加近期瀏覽")
      return
    }

    console.log("➕ 添加到近期瀏覽:", restaurant.name, restaurant.id)

    setRecentViews((prevViews) => {
      // 移除已存在的相同店家（如果有）
      const filteredViews = prevViews.filter((view) => view.id !== restaurant.id)

      // 創建新的瀏覽記錄，添加查看時間
      const newView: RecentViewRestaurant = {
        ...restaurant,
        viewedAt: new Date().toISOString()
      }

      // 將新店家添加到列表開頭
      const newViews = [newView, ...filteredViews]

      // 如果超過最大數量，則截取前MAX_RECENT_ITEMS個
      const trimmedViews = newViews.slice(0, MAX_RECENT_ITEMS)
      
      console.log("✅ 近期瀏覽已更新，新數量:", trimmedViews.length)
      return trimmedViews
    })
  }

  // 清除所有近期瀏覽
  const clearRecentViews = () => {
    if (!isLoaded) return
    console.log("🗑️ 清除所有近期瀏覽")
    setRecentViews([])
  }

  // 移除特定項目
  const removeRecentView = (restaurantId: string) => {
    if (!isLoaded) return
    console.log("🗑️ 移除近期瀏覽項目:", restaurantId)
    setRecentViews((prevViews) => prevViews.filter((view) => view.id !== restaurantId))
  }

  return {
    recentViews,
    addRecentView,
    clearRecentViews,
    removeRecentView,
    isLoaded,
  }
}
