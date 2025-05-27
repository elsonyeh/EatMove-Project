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
  viewedAt: string
}

// 最大記錄數量
const MAX_RECENT_ITEMS = 10

export function useRecentViews() {
  const [recentViews, setRecentViews] = useState<RecentViewRestaurant[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [userId, setUserId] = useState<string>("")

  // 獲取用戶ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId') || 'M000010'
      setUserId(id)
    }
  }, [])

  // 從數據庫載入近期瀏覽
  useEffect(() => {
    if (userId) {
      loadRecentViewsFromDB()
    }
  }, [userId])

  const loadRecentViewsFromDB = async () => {
    try {
      console.log("📚 從數據庫載入近期瀏覽，用戶ID:", userId)
      const response = await fetch(`/api/recent-views?mid=${userId}`)
      const result = await response.json()

      if (result.success) {
        setRecentViews(result.recentViews || [])
        console.log("✅ 近期瀏覽載入成功，數量:", result.recentViews?.length || 0)
      } else {
        console.error("❌ 載入近期瀏覽失敗:", result.message)
        setRecentViews([])
      }
    } catch (error) {
      console.error("❌ 載入近期瀏覽發生錯誤:", error)
      setRecentViews([])
    } finally {
      setIsLoaded(true)
    }
  }

  // 添加店家到近期瀏覽
  const addRecentView = async (restaurant: Omit<RecentViewRestaurant, 'viewedAt'>) => {
    if (!isLoaded || !userId) {
      console.log("⚠️ 用戶未登入或數據未載入，跳過添加近期瀏覽")
      return
    }

    console.log("➕ 添加到近期瀏覽:", restaurant.name, restaurant.id)

    try {
      // 同時更新本地狀態和數據庫
      const newView: RecentViewRestaurant = {
        ...restaurant,
        viewedAt: new Date().toISOString()
      }

      // 更新本地狀態
      setRecentViews((prevViews) => {
        const filteredViews = prevViews.filter((view) => view.id !== restaurant.id)
        const newViews = [newView, ...filteredViews]
        return newViews.slice(0, MAX_RECENT_ITEMS)
      })

      // 同步到數據庫
      const response = await fetch('/api/recent-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mid: userId,
          rid: parseInt(restaurant.id),
          name: restaurant.name,
          description: restaurant.description,
          coverImage: restaurant.coverImage,
          rating: restaurant.rating,
          deliveryTime: restaurant.deliveryTime,
          deliveryFee: restaurant.deliveryFee,
          minimumOrder: restaurant.minimumOrder,
          address: restaurant.address,
          phone: restaurant.phone,
          cuisine: restaurant.cuisine,
          distance: restaurant.distance
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log("✅ 近期瀏覽已同步到數據庫")
      } else {
        console.error("❌ 同步近期瀏覽到數據庫失敗:", result.message)
      }
    } catch (error) {
      console.error("❌ 添加近期瀏覽失敗:", error)
    }
  }

  // 清除所有近期瀏覽
  const clearRecentViews = async () => {
    if (!isLoaded || !userId) return

    console.log("🗑️ 清除所有近期瀏覽")

    try {
      // 清除本地狀態
      setRecentViews([])

      // 清除數據庫記錄
      const response = await fetch(`/api/recent-views?mid=${userId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        console.log("✅ 近期瀏覽已從數據庫清除")
      } else {
        console.error("❌ 清除數據庫近期瀏覽失敗:", result.message)
      }
    } catch (error) {
      console.error("❌ 清除近期瀏覽失敗:", error)
    }
  }

  // 移除特定項目
  const removeRecentView = async (restaurantId: string) => {
    if (!isLoaded || !userId) return

    console.log("🗑️ 移除近期瀏覽項目:", restaurantId)

    try {
      // 更新本地狀態
      setRecentViews((prevViews) => prevViews.filter((view) => view.id !== restaurantId))

      // 這裡可以添加單個項目刪除的API調用
      // 暫時使用重新載入的方式
      await loadRecentViewsFromDB()
    } catch (error) {
      console.error("❌ 移除近期瀏覽項目失敗:", error)
    }
  }

  return {
    recentViews,
    addRecentView,
    clearRecentViews,
    removeRecentView,
    isLoaded,
    refreshRecentViews: loadRecentViewsFromDB
  }
}
