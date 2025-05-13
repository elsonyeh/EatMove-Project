"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getRestaurantById, getMenuItems } from "@/lib/data"
import { useToast } from "@/components/ui/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useRecentViews } from "@/hooks/use-recent-views" // 引入新的hook
import { MenuItemCard } from "@/components/menu-item-card"
import { DishRecommender } from "@/components/dish-recommender"
import { getRestaurantCover, getMenuItemImage } from "@/utils/image-utils"
import { useCart } from "@/hooks/use-cart"

export default function RestaurantPage() {
  const params = useParams()
  const { toast } = useToast()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { addRecentView } = useRecentViews() // 使用近期瀏覽hook
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const { addItem, getTotalItems } = useCart()
  const [cartItems, setCartItems] = useState<{ [itemId: string]: number }>({})

  useEffect(() => {
    // 模擬加載數據
    const timer = setTimeout(() => {
      const foundRestaurant = getRestaurantById(params.id as string)
      const restaurantMenu = getMenuItems(params.id as string)

      if (foundRestaurant) {
        setRestaurant(foundRestaurant)
        setMenu(restaurantMenu)

        // 將店家添加到近期瀏覽
        addRecentView(foundRestaurant)
      }

      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [params.id, addRecentView])

  // 其餘代碼保持不變...

  const handleToggleFavorite = () => {
    if (!restaurant) return

    if (isFavorite(restaurant.id)) {
      removeFavorite(restaurant.id)
      toast({
        title: "已從最愛移除",
        description: `${restaurant.name} 已從您的最愛清單中移除`,
        variant: "default",
      })
    } else {
      addFavorite(restaurant)
      toast({
        title: "已加入最愛",
        description: `${restaurant.name} 已加入您的最愛清單`,
        variant: "default",
      })
    }
  }

  const addToCart = (itemId: string) => {
    const item = menu.find((item) => item.id === itemId)
    if (!item) return

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image || getMenuItemImage(item.name),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    })
  }

  const removeFromCart = (itemId: string) => {
    setCartItems((prev) => {
      const newItems = { ...prev }
      if (newItems[itemId] > 1) {
        newItems[itemId] -= 1
      } else {
        delete newItems[itemId]
      }
      return newItems
    })
  }

  const getCartItemCount = (itemId: string) => {
    return cartItems[itemId] || 0
  }

  const getTotalCartItems = () => {
    return Object.values(cartItems).reduce((sum, count) => sum + count, 0)
  }

  // 根據類別過濾菜單
  const filteredMenu = activeCategory === "all" ? menu : menu.filter((item) => item.category === activeCategory)

  // 獲取所有類別
  const categories = menu.length > 0 ? ["all", ...new Set(menu.map((item) => item.category))] : ["all"]

  if (loading) {
    return (
      <div className="container py-8 animate-pulse">
        <div className="h-8 w-32 bg-muted rounded mb-4"></div>
        <div className="h-64 w-full bg-muted rounded-xl mb-6"></div>
        <div className="h-10 w-full bg-muted rounded mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-xl"></div>
            ))}
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">餐廳不存在</h2>
          <p className="mb-6 text-muted-foreground">找不到您要查看的餐廳</p>
          <Button asChild>
            <Link href="/user/home">返回首頁</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24 bg-gray-100 min-h-screen">
      {/* 返回按鈕 */}
      <div className="container py-4">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/user/home">
            <ChevronLeft className="h-4 w-4" />
            <span>返回</span>
          </Link>
        </Button>
      </div>

      {/* 餐廳封面 */}
      <div className="relative h-64 w-full bg-gray-300 mb-4">
        <Image
          src={getRestaurantCover(restaurant.name) || "/placeholder.svg"}
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
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {restaurant.cuisine}
                  </Badge>
                  <span>⭐ {restaurant.rating}</span>
                  <span>•</span>
                  <span>{restaurant.deliveryTime}</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                onClick={handleToggleFavorite}
              >
                <Heart className={isFavorite(restaurant.id) ? "fill-white" : ""} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="container py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側內容區域 */}
          <div className="w-full lg:w-8/12">
            {/* AI 推薦 */}
            <DishRecommender restaurantName={restaurant.name} cuisine={restaurant.cuisine} menu={menu} />

            {/* 標籤切換 */}
            <Tabs
              value={activeCategory === "all" ? "menu" : activeCategory}
              onValueChange={(value) => {
                if (value === "menu") {
                  setActiveCategory("all")
                } else {
                  setActiveCategory(value)
                }
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-white rounded-lg overflow-hidden">
                <TabsTrigger
                  value="menu"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-none py-4 rounded-none"
                >
                  菜單
                </TabsTrigger>
                <TabsTrigger
                  value="info"
                  className="data-[state=active]:bg-gray-100 data-[state=active]:shadow-none py-4 rounded-none"
                >
                  餐廳資訊
                </TabsTrigger>
              </TabsList>

              {/* 菜單內容 */}
              <TabsContent value="menu" className="mt-0">
                <div className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-6">熱門餐點</h2>
                  <div className="space-y-4">
                    {filteredMenu
                      .filter((item) => item.isPopular)
                      .map((item, index) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          cuisine={restaurant.cuisine}
                          index={index}
                          onAddToCart={() => addToCart(item.id)}
                        />
                      ))}
                  </div>

                  {filteredMenu.filter((item) => !item.isPopular).length > 0 && (
                    <>
                      <h2 className="text-xl font-bold mb-6 mt-8">其他餐點</h2>
                      <div className="space-y-4">
                        {filteredMenu
                          .filter((item) => !item.isPopular)
                          .map((item, index) => (
                            <MenuItemCard
                              key={item.id}
                              item={item}
                              cuisine={restaurant.cuisine}
                              index={index}
                              onAddToCart={() => addToCart(item.id)}
                            />
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* 餐廳資訊內容 */}
              <TabsContent value="info" className="mt-0">
                <div className="bg-white rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">餐廳資訊</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">最低消費</span>
                      <span className="font-medium">${restaurant.minimumOrder}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">外送費</span>
                      <span className="font-medium">${restaurant.deliveryFee}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">預計送達時間</span>
                      <span className="font-medium">{restaurant.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">地址</span>
                      <span className="font-medium">{restaurant.address}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">電話</span>
                      <span className="font-medium">{restaurant.phone}</span>
                    </div>
                    <div className="pt-2">
                      <Badge variant="outline" className="bg-gray-100">
                        {restaurant.cuisine}
                      </Badge>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 右側餐廳資訊 (桌面版) */}
          <div className="w-full lg:w-4/12 hidden lg:block">
            <div className="bg-white rounded-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">餐廳資訊</h2>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">最低消費</span>
                  <span className="font-medium">${restaurant.minimumOrder}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">外送費</span>
                  <span className="font-medium">${restaurant.deliveryFee}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">預計送達時間</span>
                  <span className="font-medium">{restaurant.deliveryTime}</span>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="bg-gray-100">
                    {restaurant.cuisine}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 購物車按鈕 */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-50">
          <div className="container">
            <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg" asChild>
              <Link href="/user/cart">查看購物車 ({getTotalItems()} 件商品)</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
