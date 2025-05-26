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
import { MenuItemCard } from '@/components/menu-item-card'
import Cart, { CartRef } from '@/components/cart'

export default function RestaurantPage() {
  const params = useParams()
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id
  const { toast } = useToast()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { addRecentView } = useRecentViews()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any>({})
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [userAddress, setUserAddress] = useState("高雄市")
  const cartRef = useRef<CartRef>(null)

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
          addRecentView(restaurantData.restaurant)
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
  }, [id, addRecentView, userLocation, userAddress])

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

  const addToCart = (dishId: number) => {
    // 在所有分類中尋找該菜品
    let item = null
    for (const category of categories) {
      const categoryItems = menu[category] || []
      item = categoryItems.find((menuItem: any) => menuItem.dishId === dishId)
      if (item) break
    }

    if (!item || !cartRef) return

    cartRef.current?.addToCart({
      mid: item.dishId,
      name: item.name,
      price: item.price,
      image: item.image || '/images/menu/default.jpg'
    })
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
          <TabsList className="grid w-full grid-cols-auto bg-white rounded-lg p-1 mb-6">
            <TabsTrigger value="all" className="text-sm">
              全部
            </TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="text-sm">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="space-y-6">
                {activeCategory === 'all' ? (
                  categories.map((category) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-4 px-6 pt-6">{category}</h3>
                      <div className="space-y-4 px-6 pb-6">
                        {(menu[category] || []).map((item: any, index: number) => (
                          <MenuItemCard
                            key={`${category}-${item.dishId}`}
                            item={item}
                            cuisine={restaurant.cuisine}
                            index={index}
                            onAddToCart={() => addToCart(item.dishId)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-4 p-6">
                    {(menu[activeCategory] || []).map((item: any, index: number) => (
                      <MenuItemCard
                        key={`${activeCategory}-${item.dishId}`}
                        item={item}
                        cuisine={restaurant.cuisine}
                        index={index}
                        onAddToCart={() => addToCart(item.dishId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 購物車組件 */}
      {restaurant && (
        <Cart
          ref={cartRef}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          minOrder={restaurant.minOrder || 300}
          deliveryFee={restaurant.deliveryFee || 50}
          onOrderSuccess={() => {
            toast({
              title: "訂單提交成功",
              description: "您的訂單已成功提交，餐廳將盡快處理"
            })
          }}
        />
      )}
    </div>
  )
}
