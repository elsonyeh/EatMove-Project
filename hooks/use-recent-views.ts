"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Restaurant } from "@/lib/data"

// 最大記錄數量
const MAX_RECENT_ITEMS = 10

export function useRecentViews() {
  const [recentViews, setRecentViews] = useLocalStorage<Restaurant[]>("eatmove-recent-views", [])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 等待 localStorage 初始化完成
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // 添加店家到近期瀏覽
  const addRecentView = (restaurant: Restaurant) => {
    if (!isLoaded) return

    setRecentViews((prevViews) => {
      // 移除已存在的相同店家（如果有）
      const filteredViews = prevViews.filter((view) => view.id !== restaurant.id)

      // 將新店家添加到列表開頭
      const newViews = [restaurant, ...filteredViews]

      // 如果超過最大數量，則截取前MAX_RECENT_ITEMS個
      return newViews.slice(0, MAX_RECENT_ITEMS)
    })
  }

  // 清除所有近期瀏覽
  const clearRecentViews = () => {
    if (!isLoaded) return
    setRecentViews([])
  }

  return {
    recentViews,
    addRecentView,
    clearRecentViews,
    isLoaded,
  }
}
