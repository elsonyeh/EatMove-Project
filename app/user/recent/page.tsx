"use client"

import { useState, useEffect } from "react"
import { RestaurantCard } from "@/components/restaurant-card"
import { useRecentViews } from "@/hooks/use-recent-views"
import { useFavorites } from "@/hooks/use-favorites"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function UserRecentPage() {
  const router = useRouter()
  const { recentViews, isLoaded: recentViewsLoaded } = useRecentViews()
  const { favorites, isLoaded: favoritesLoaded } = useFavorites()
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // 確保只在客戶端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient && recentViewsLoaded && favoritesLoaded) {
      // 模擬加載數據
      const timer = setTimeout(() => {
        setLoading(false)
      }, 600)

      return () => clearTimeout(timer)
    }
  }, [isClient, recentViewsLoaded, favoritesLoaded])

  // 過濾近期瀏覽的餐廳
  const filteredRecentViews = searchQuery
    ? recentViews.filter(
      (restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    : recentViews

  // 在客戶端渲染之前顯示載入狀態
  if (!isClient) {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Clock className="h-6 w-6 text-brand-primary mr-2" />
            <h1 className="text-3xl font-bold tracking-tight">近期瀏覽</h1>
          </div>
          <p className="text-muted-foreground">您最近瀏覽過的店家</p>
        </div>
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
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Clock className="h-6 w-6 text-brand-primary mr-2" />
          <h1 className="text-3xl font-bold tracking-tight">近期瀏覽</h1>
        </div>
        <p className="text-muted-foreground">您最近瀏覽過的店家</p>
      </div>

      {recentViews.length > 0 && (
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="搜尋近期瀏覽..."
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-brand-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

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
      ) : filteredRecentViews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredRecentViews.map((restaurant, index) => (
            <RestaurantCard
              key={`recent-${restaurant.id}-${index}`}
              restaurant={restaurant}
              isFavorite={favorites.some((fav) => fav.id === restaurant.id)}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">您還沒有瀏覽過任何店家</h2>
          <p className="text-muted-foreground mb-4">開始探索附近的美食吧！</p>
          <Button onClick={() => router.push("/user/home")} className="bg-brand-primary hover:bg-brand-primary/90">
            探索餐廳
          </Button>
        </div>
      )}
    </div>
  )
}
