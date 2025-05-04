"use client"

import { useState, useEffect } from "react"
import { RestaurantCard } from "@/components/restaurant-card"
import { restaurants } from "@/lib/data"
import { SearchBar } from "@/components/search-bar"
import { CategoryFilter } from "@/components/category-filter"
import { useFavorites } from "@/hooks/use-favorites"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, TrendingUp, Award, Zap, MapPin, Sparkles, Clock, Search } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"

// 類別ID到名稱的映射
const categoryMap: Record<string, string> = {
  all: "全部",
  chinese: "中式料理",
  japanese: "日式料理",
  korean: "韓式料理",
  italian: "義式料理",
  american: "美式料理",
  thai: "泰式料理",
  vegetarian: "素食",
  dessert: "甜點",
  beverage: "飲料",
}

export default function UserHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || "all"

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeCategoryName, setActiveCategoryName] = useState(categoryMap[initialCategory] || "全部")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchLocation, setSearchLocation] = useState("台北市信義區")
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants)
  const [isSearching, setIsSearching] = useState(false)
  const { favorites } = useFavorites()

  // 過濾餐廳的函數
  const filterRestaurants = (query: string, category: string) => {
    setIsSearching(true)
    let results = restaurants

    // 根據類別過濾
    if (category !== "all") {
      results = results.filter((restaurant) => restaurant.cuisine === categoryMap[category])
    }

    // 根據搜尋詞過濾
    if (query) {
      const lowerQuery = query.toLowerCase()
      results = results.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(lowerQuery) ||
          restaurant.cuisine.toLowerCase().includes(lowerQuery) ||
          restaurant.description.toLowerCase().includes(lowerQuery),
      )
    }

    setFilteredRestaurants(results)

    // 更新URL參數
    const params = new URLSearchParams()
    if (query) params.set("q", query)
    if (category !== "all") params.set("category", category)
    router.replace(params.toString() ? `?${params.toString()}` : "/user/home")

    setTimeout(() => setIsSearching(false), 300)
  }

  // 處理搜尋
  const handleSearch = (query: string, location: string) => {
    setSearchQuery(query)
    setSearchLocation(location)
    filterRestaurants(query, activeCategory)
  }

  // 處理類別變更
  const handleCategoryChange = (categoryId: string, categoryName: string) => {
    setActiveCategory(categoryId)
    setActiveCategoryName(categoryName)
    filterRestaurants(searchQuery, categoryId)
  }

  // 初始加載
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      filterRestaurants(searchQuery, activeCategory)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen">
      {/* 頂部橫幅 */}
      <div className="bg-gradient-to-r from-brand-primary to-brand-accent text-white py-12 px-4">
        <div className="container">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span>User001</span>
              <span className="mx-2">，</span>
              <span>歡迎回來！</span>
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">探索附近的美食，立即訂購</p>
            <SearchBar onSearch={handleSearch} initialQuery={searchQuery} initialLocation={searchLocation} />
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* 類別過濾器 */}
        <div className="mb-8">
          <CategoryFilter activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
        </div>

        {/* 快速資訊卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-primary/10 rounded-xl p-4 flex items-center">
            <div className="bg-brand-primary/20 p-3 rounded-full mr-4">
              <MapPin className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-medium">您的位置</h3>
              <p className="text-sm text-muted-foreground">{searchLocation}</p>
            </div>
          </div>

          <div className="bg-brand-secondary/10 rounded-xl p-4 flex items-center">
            <div className="bg-brand-secondary/20 p-3 rounded-full mr-4">
              <Clock className="h-6 w-6 text-brand-secondary" />
            </div>
            <div>
              <h3 className="font-medium">預計送達時間</h3>
              <p className="text-sm text-muted-foreground">20-35 分鐘</p>
            </div>
          </div>

          <div className="bg-brand-accent/10 rounded-xl p-4 flex items-center">
            <div className="bg-brand-accent/20 p-3 rounded-full mr-4">
              <Sparkles className="h-6 w-6 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-medium">EatMove 點數</h3>
              <p className="text-sm text-muted-foreground">320 點</p>
            </div>
          </div>
        </div>

        {/* 搜尋結果提示 */}
        {searchQuery && (
          <div className="mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2 text-brand-primary" />
            <p>
              搜尋 <span className="font-medium">"{searchQuery}"</span> 的結果 ({filteredRestaurants.length} 家餐廳)
            </p>
          </div>
        )}

        {/* 餐廳列表 */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              {searchQuery ? (
                <>
                  <Search className="mr-2 h-6 w-6 text-brand-primary" />
                  <span>搜尋結果</span>
                </>
              ) : activeCategory === "all" ? (
                <>
                  <TrendingUp className="mr-2 h-6 w-6 text-brand-primary" />
                  <span>熱門推薦</span>
                </>
              ) : (
                <>
                  <Award className="mr-2 h-6 w-6 text-brand-primary" />
                  <span>{activeCategoryName}精選</span>
                </>
              )}
            </h2>
            {filteredRestaurants.length > 8 && (
              <button className="text-brand-primary font-medium flex items-center hover:underline">
                <span>查看更多</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            )}
          </div>

          {/* 餐廳列表渲染 */}
          {loading || isSearching ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array(8)
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
          ) : filteredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="h-full">
                  <RestaurantCard
                    restaurant={restaurant}
                    isFavorite={favorites.some((fav) => fav.id === restaurant.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">
                {searchQuery ? `找不到與 "${searchQuery}" 相關的餐廳` : `暫無${activeCategoryName}店家`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "請嘗試其他搜尋關鍵字" : "請嘗試選擇其他類別"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
