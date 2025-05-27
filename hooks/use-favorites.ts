"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import type { Restaurant } from "@/lib/data"

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<Restaurant[]>("eatmove-favorites", [])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 等待 localStorage 初始化完成
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const addFavorite = (restaurant: Restaurant) => {
    if (!isLoaded) return

    // 檢查是否已經在收藏中
    if (!favorites.some((fav) => fav.id === restaurant.id)) {
      setFavorites([...favorites, restaurant])
    }
  }

  const removeFavorite = (restaurantId: string) => {
    if (!isLoaded) return

    setFavorites(favorites.filter((fav) => fav.id !== restaurantId))
  }

  const isFavorite = (restaurantId: string) => {
    return favorites.some((fav) => fav.id === restaurantId)
  }

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    isLoaded,
  }
}
