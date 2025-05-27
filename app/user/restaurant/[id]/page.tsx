'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Heart, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useFavorites } from '@/hooks/use-favorites'
import { useRecentViews } from '@/hooks/use-recent-views'
import { useCart } from '@/hooks/use-cart'
import { MenuItemCard } from '@/components/menu-item-card'
import { useCartDB } from '@/hooks/use-cart-db'

export default function RestaurantPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { toast } = useToast()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { addRecentView } = useRecentViews()
  const { addToCart } = useCartDB()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any>({})
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [userAddress, setUserAddress] = useState("高雄市")

  // 獲取用戶位置
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
              setUserAddress(data.results[0].formatted_address)
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

  useEffect(() => {
    async function fetchData() {
      try {
        // 構建查詢參數
        const params = new URLSearchParams()
        if (userLocation) {
          params.set("lat", userLocation.lat.toString())
          params.set("lng", userLocation.lng.toString())
        }
        params.set("address", userAddress)

        // 獲取餐廳資訊
        const restaurantRes = await fetch(`/api/restaurants/${id}?${params.toString()}`)
        const restaurantData = await restaurantRes.json()

        // 獲取菜單資訊
        const menuRes = await fetch(`/api/restaurants/${id}/menu`)
        const menuData = await menuRes.json()

        if (restaurantData.success) {
          setRestaurant(restaurantData.restaurant)
          // 只在成功載入時添加到最近瀏覽，轉換為正確的格式
          const recentViewData = {
            id: restaurantData.restaurant.id.toString(),
            name: restaurantData.restaurant.name,
            description: restaurantData.restaurant.description || '',
            coverImage: restaurantData.restaurant.image || '/images/restaurants/default.jpg',
            rating: restaurantData.restaurant.rating,
            deliveryTime: restaurantData.restaurant.deliveryTime || '30-45 分鐘',
            deliveryFee: restaurantData.restaurant.deliveryFee || 60,
            minimumOrder: restaurantData.restaurant.minimumOrder || 300,
            address: restaurantData.restaurant.address || '',
            phone: restaurantData.restaurant.phone || '',
            cuisine: restaurantData.restaurant.cuisine || '綜合料理',
            isNew: false,
            distance: restaurantData.restaurant.distance
          }
          addRecentView(recentViewData)
        } else {
          console.error('❌ 餐廳資料載入失敗:', restaurantData.message)
        }

        if (menuData.success) {
          setMenu(menuData.menu)
          setCategories(menuData.categories)
        } else {
          console.error('❌ 菜單資料載入失敗:', menuData.message)
        }

      } catch (error) {
        console.error('❌ 資料載入失敗:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id, userLocation, userAddress])

  const handleToggleFavorite = () => {
    if (!restaurant) return

    if (isFavorite(restaurant.id)) {
      removeFavorite(restaurant.id)
      toast({
        title: '已從最愛移除',
        description: `${restaurant.name} 已從您的最愛清單中移除`,
      })
    } else {
      addFavorite(restaurant)
      toast({
        title: '已加入最愛',
        description: `${restaurant.name} 已加入您的最愛清單`,
      })
    }
  }

  const addToCartHandler = async (dishId: number) => {
    console.log(`🛒 添加商品到購物車，菜品ID: ${dishId}`)

    // 查找菜品資訊
    let item = null
    for (const category of categories) {
      const categoryItems = menu[category] || []
      item = categoryItems.find((menuItem: any) => menuItem.dishId === dishId)
      if (item) {
        console.log(`✅ 找到菜品:`, item)
        break
      }
    }

    if (!item) {
      console.error(`❌ 找不到菜品 ID: ${dishId}`)
      console.log(`📋 可用分類:`, categories)
      console.log(`📋 菜單資料:`, menu)
      toast({
        title: "添加失敗",
        description: "找不到該商品",
        variant: "destructive",
      })
      return
    }

    if (!restaurant) {
      console.error(`❌ 餐廳資訊不存在`)
      toast({
        title: "添加失敗",
        description: "餐廳資訊不存在",
        variant: "destructive",
      })
      return
    }

    console.log(`🛒 準備添加到購物車:`, { rid: restaurant.id, dishId, quantity: 1 })

    const success = await addToCart(restaurant.id, dishId, 1)

    if (success) {
      toast({
        title: "已加入購物車",
        description: `${item.name} 已加入購物車`,
      })
    } else {
      toast({
        title: "添加失敗",
        description: "無法添加到購物車，請重試",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <span className="ml-2">載入中...</span>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">餐廳不存在</h2>
          <Button asChild>
            <Link href="/user/home">返回首頁</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 bg-gray-100 min-h-screen">
      <div className="container py-4">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/user/home">
            <ChevronLeft className="h-4 w-4" />
            <span>返回</span>
          </Link>
        </Button>
      </div>

      <div className="relative h-64 w-full bg-gray-300 mb-4">
        <Image
          src={restaurant.image || '/images/restaurants/default.jpg'}
          alt={restaurant.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="container">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span>{restaurant.rating}</span>
                  </div>
                  <span>•</span>
                  <span>{restaurant.distance}</span>
                  <span>•</span>
                  <span>{restaurant.deliveryTime}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFavorite}
                className="text-white hover:bg-white/20"
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite(restaurant.id) ? 'fill-red-500 text-red-500' : ''
                    }`}
                />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">最低訂購</span>
              <p className="font-medium">${restaurant.minOrder}</p>
            </div>
            <div>
              <span className="text-muted-foreground">外送費</span>
              <p className="font-medium">${restaurant.deliveryFee}</p>
            </div>
          </div>
          {restaurant.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">{restaurant.description}</p>
            </div>
          )}
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
            <TabsList className="w-full h-auto p-1 bg-gray-50 rounded-lg flex-wrap justify-start gap-1">
              <TabsTrigger
                value="all"
                className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                全部菜單
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="flex-shrink-0 px-4 py-2 text-sm font-medium rounded-md data-[state=active]:bg-brand-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all duration-200"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeCategory} className="mt-0">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {activeCategory === 'all' ? (
                <div className="divide-y divide-gray-100">
                  {categories.map((category, categoryIndex) => (
                    <div key={category} className="py-6">
                      <div className="px-6 mb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                          <span className="w-1 h-6 bg-brand-primary rounded-full mr-3"></span>
                          {category}
                          <span className="ml-2 text-sm font-normal text-gray-500">
                            ({(menu[category] || []).length} 道菜)
                          </span>
                        </h3>
                      </div>
                      <div className="space-y-3 px-6">
                        {(menu[category] || []).map((item: any, index: number) => (
                          <MenuItemCard
                            key={`${category}-${item.dishId}`}
                            item={item}
                            cuisine={restaurant.cuisine}
                            index={index}
                            onAddToCart={() => addToCartHandler(item.dishId)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6">
                  <div className="px-6 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <span className="w-1 h-6 bg-brand-primary rounded-full mr-3"></span>
                      {activeCategory}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({(menu[activeCategory] || []).length} 道菜)
                      </span>
                    </h3>
                  </div>
                  <div className="space-y-3 px-6">
                    {(menu[activeCategory] || []).map((item: any, index: number) => (
                      <MenuItemCard
                        key={`${activeCategory}-${item.dishId}`}
                        item={item}
                        cuisine={restaurant.cuisine}
                        index={index}
                        onAddToCart={() => addToCartHandler(item.dishId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
