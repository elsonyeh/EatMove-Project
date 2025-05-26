"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, Clock, Sparkles, TrendingUp, Award, ArrowRight } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { CategoryFilter } from "@/components/category-filter"
import { RestaurantCard } from "@/components/restaurant-card"
import { useFavorites } from "@/hooks/use-favorites"
import { categoryMap } from "@/config/categories"
import { restaurants } from "@/config/restaurants"
import { useToast } from "@/components/ui/use-toast"

export default function UserHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialQuery = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || "all"

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeCategoryName, setActiveCategoryName] = useState(categoryMap[initialCategory] || "全部")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchLocation, setSearchLocation] = useState("")
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants)
  const [isSearching, setIsSearching] = useState(false)
  const { favorites } = useFavorites()
  const [userData, setUserData] = useState({
    name: "",
    address: "",
    wallet: 0
  })
  const [estimatedTime, setEstimatedTime] = useState("20-35")

  // 從 localStorage 獲取用戶 ID 並讀取用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mid = localStorage.getItem("userId")
        if (!mid) {
          toast({
            title: "錯誤",
            description: "請先登入",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`/api/user/profile?mid=${mid}`)
        const data = await response.json()

        if (data.success) {
          setUserData(data.data)
          setSearchLocation(data.data.address || "台北市信義區")
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error)
      }
    }

    fetchUserData()
  }, [toast])

  // 獲取用戶當前位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            // 使用 Geocoding API 將座標轉換為地址
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=zh-TW`
            )
            const data = await response.json()
            if (data.results[0]) {
              setSearchLocation(data.results[0].formatted_address)
            }
          } catch (error) {
            console.error("獲取地址失敗:", error)
          }
        },
        (error) => {
          console.error("獲取位置失敗:", error)
        }
      )
    }
  }, [])

  // 計算預估送達時間
  const calculateEstimatedTime = (location: string) => {
    // 這裡可以根據不同地區設定不同的預估時間
    const timeMap: { [key: string]: string } = {
      "信義區": "20-35",
      "大安區": "25-40",
      "中山區": "30-45",
      "松山區": "25-40",
      "內湖區": "35-50",
      // 可以添加更多地區
    }

    // 檢查地址中是否包含特定區域
    for (const [district, time] of Object.entries(timeMap)) {
      if (location.includes(district)) {
        return time
      }
    }

    return "30-45" // 預設時間
  }

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
    const params = new URLSearchParams(searchParams.toString())
    if (query) params.set("q", query)
    else params.delete("q")
    if (category !== "all") params.set("category", category)
    else params.delete("category")
    router.replace(`/user/home${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })

    setTimeout(() => setIsSearching(false), 300)
  }

  // 處理搜尋
  const handleSearch = (query: string, location: string) => {
    setSearchQuery(query)
    setSearchLocation(location)
    setEstimatedTime(calculateEstimatedTime(location))
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
              <span>{userData.name || "訪客"}</span>
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
              <p className="text-sm text-muted-foreground">{estimatedTime} 分鐘</p>
            </div>
          </div>

          <div className="bg-brand-accent/10 rounded-xl p-4 flex items-center">
            <div className="bg-brand-accent/20 p-3 rounded-full mr-4">
              <Sparkles className="h-6 w-6 text-brand-accent" />
            </div>
            <div>
              <h3 className="font-medium">EatMove 點數</h3>
              <p className="text-sm text-muted-foreground">{userData.wallet || 0} 點</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                isFavorite={favorites.some((fav) => fav.id === restaurant.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
