"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, MapPin, Sparkles, TrendingUp, Award, ArrowRight } from "lucide-react"
import { SearchBar } from "@/components/search-bar"
import { CategoryFilter } from "@/components/category-filter"
import { RestaurantCard } from "@/components/restaurant-card"
import { useFavorites } from "@/hooks/use-favorites"
import { categoryMap } from "@/config/categories"
import { useToast } from "@/components/ui/use-toast"

// 使用與lib/data.ts相同的Restaurant interface
interface Restaurant {
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
  // 額外屬性用於內部使用
  originalId?: number
  menuPreview?: any[]
}

export default function UserHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const initialQuery = searchParams?.get("q") || ""
  const initialCategory = searchParams?.get("category") || "all"

  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeCategoryName, setActiveCategoryName] = useState(categoryMap[initialCategory] || "全部")
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [searchLocation, setSearchLocation] = useState("")
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { favorites } = useFavorites()
  const [userData, setUserData] = useState({
    name: "",
    address: "",
    wallet: 0
  })
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)

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
          setSearchLocation(data.data.address || "高雄市")
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
            setUserLocation({ lat: latitude, lng: longitude })

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

  // 從API獲取餐廳資料
  const fetchRestaurants = async (query: string = "", category: string = "all") => {
    try {
      setIsSearching(true)

      const params = new URLSearchParams()
      if (query) params.set("search", query)
      if (category !== "all") params.set("category", category)
      if (userLocation) {
        params.set("lat", userLocation.lat.toString())
        params.set("lng", userLocation.lng.toString())
      }
      if (searchLocation) params.set("address", searchLocation)

      const response = await fetch(`/api/restaurants?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        // 轉換餐廳資料格式以兼容RestaurantCard組件
        const transformedRestaurants = data.restaurants.map((restaurant: any) => ({
          id: restaurant.id.toString(),
          name: restaurant.name,
          description: restaurant.description,
          coverImage: restaurant.image,
          rating: restaurant.rating,
          deliveryTime: "點擊查看", // 移除預計送達時間，改為提示文字
          deliveryFee: restaurant.deliveryFee,
          minimumOrder: restaurant.minOrder,
          address: restaurant.address,
          phone: restaurant.phone,
          cuisine: restaurant.cuisine,
          isNew: false,
          distance: restaurant.distance,
          originalId: restaurant.id,
          menuPreview: restaurant.menuPreview
        }))

        setAllRestaurants(transformedRestaurants)
        setFilteredRestaurants(transformedRestaurants)
      } else {
        toast({
          title: "錯誤",
          description: data.message || "獲取餐廳資料失敗",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("獲取餐廳資料失敗:", error)
      toast({
        title: "錯誤",
        description: "網路連線錯誤",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  // 過濾餐廳的函數
  const filterRestaurants = (query: string, category: string) => {
    fetchRestaurants(query, category)

    // 更新URL參數
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (query) params.set("q", query)
    else params.delete("q")
    if (category !== "all") params.set("category", category)
    else params.delete("category")
    router.replace(`/user/home${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false })
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
      fetchRestaurants(searchQuery, activeCategory)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  // 當用戶位置改變時重新獲取餐廳資料
  useEffect(() => {
    if (userLocation && !loading) {
      fetchRestaurants(searchQuery, activeCategory)
    }
  }, [userLocation])

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-brand-primary/10 rounded-xl p-4 flex items-center">
            <div className="bg-brand-primary/20 p-3 rounded-full mr-4">
              <MapPin className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h3 className="font-medium">您的位置</h3>
              <p className="text-sm text-muted-foreground">{searchLocation}</p>
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

        {/* 載入狀態 */}
        {(loading || isSearching) && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            <span className="ml-2">載入中...</span>
          </div>
        )}

        {/* 餐廳列表 */}
        {!loading && !isSearching && (
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
            {filteredRestaurants.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavorite={favorites.some((fav) => fav.id === restaurant.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">找不到符合條件的餐廳</h3>
                <p className="text-gray-500">請嘗試調整搜尋條件或類別篩選</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
