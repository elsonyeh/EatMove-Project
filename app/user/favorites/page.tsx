"use client"

import { useState, useEffect } from "react"
import { RestaurantCard } from "@/components/restaurant-card"
import { useFavorites } from "@/hooks/use-favorites"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UserFavoritesPage() {
  const router = useRouter()
  const { favorites, isLoaded } = useFavorites()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (isLoaded) {
      // 模擬加載數據
      const timer = setTimeout(() => {
        setLoading(false)
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [isLoaded])

  // 過濾收藏的餐廳
  const filteredFavorites = favorites.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Heart className="h-6 w-6 text-brand-primary mr-2 fill-brand-primary" />
          <h1 className="text-3xl font-bold tracking-tight">我的最愛</h1>
        </div>
        <p className="text-muted-foreground">您收藏的店家都在這裡</p>
      </div>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="搜尋我的最愛..."
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-brand-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : filteredFavorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFavorites.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              isFavorite={true}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-muted/30 rounded-xl">
          <div className="bg-brand-primary/10 p-4 rounded-full inline-flex mb-4">
            <Heart className="h-12 w-12 text-brand-primary" />
          </div>
          <h2 className="text-xl font-medium mb-2">您還沒有收藏任何店家</h2>
          <p className="text-muted-foreground mb-6">瀏覽店家並點擊愛心圖示來收藏您喜愛的店家</p>
          <Button onClick={() => router.push("/user/home")} className="bg-brand-primary hover:bg-brand-primary/90">
            探索餐廳
          </Button>
        </div>
      )}
    </div>
  )
}
