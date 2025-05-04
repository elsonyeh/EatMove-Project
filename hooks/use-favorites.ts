"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage<any[]>("eatmove-favorites", [])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const addFavorite = (restaurant: any) => {
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
