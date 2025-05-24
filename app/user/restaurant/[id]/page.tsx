'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { useFavorites } from '@/hooks/use-favorites'
import { useRecentViews } from '@/hooks/use-recent-views'
import { MenuItemCard } from '@/components/menu-item-card'
import { DishRecommender } from '@/components/dish-recommender'
import { getRestaurantCover, getMenuItemImage } from '@/utils/image-utils'
import { useCart } from '@/hooks/use-cart'

export default function RestaurantPage() {
  const { id } = useParams()
  const { toast } = useToast()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { addRecentView } = useRecentViews()
  const [restaurant, setRestaurant] = useState<any>(null)
  const [menu, setMenu] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const { addItem, getTotalItems } = useCart()

  useEffect(() => {
    async function fetchData() {
      try {
        // 模擬：如果沒有 /api/restaurants，可以直接在這裡填假資料
        const restaurantRes = await fetch(`/api/restaurants/${id}`)
        const restaurantData = await restaurantRes.json()

        const menuRes = await fetch(`/api/products?rid=${id}`)
        const menuData = await menuRes.json()

        if (restaurantData.success) {
          setRestaurant(restaurantData.restaurant)
          addRecentView(restaurantData.restaurant)
        }

        if (menuData.success) {
          setMenu(menuData.items)
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
  }, [id, addRecentView])

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

  const addToCart = (itemId: string) => {
    const item = menu.find((item) => item.dishid === itemId)
    if (!item) return

    addItem({
      id: item.dishid,
      name: item.name,
      price: item.price,
      image: item.image || getMenuItemImage(item.name),
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
    })
  }

  const filteredMenu =
    activeCategory === 'all'
      ? menu
      : menu.filter((item) => item.category === activeCategory)

  const categories =
    menu.length > 0 ? ['all', ...new Set(menu.map((item) => item.category))] : ['all']

  if (loading) {
    return <div className="p-4">載入中...</div>
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
          src={getRestaurantCover(restaurant.name) || '/placeholder.svg'}
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
                <Heart className={isFavorite(restaurant.id) ? 'fill-white' : ''} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        <Tabs
          value={activeCategory === 'all' ? 'menu' : activeCategory}
          onValueChange={(value) => {
            if (value === 'menu') {
              setActiveCategory('all')
            } else {
              setActiveCategory(value)
            }
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white rounded-lg overflow-hidden">
            <TabsTrigger value="menu" className="py-4 rounded-none">
              菜單
            </TabsTrigger>
            <TabsTrigger value="info" className="py-4 rounded-none">
              餐廳資訊
            </TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-0">
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">熱門餐點</h2>
              <div className="space-y-4">
                {filteredMenu
                  .filter((item) => item.ispopular)
                  .map((item, index) => (
                    <MenuItemCard
                      key={item.dishid}
                      item={item}
                      cuisine={restaurant.cuisine}
                      index={index}
                      onAddToCart={() => addToCart(item.dishid)}
                    />
                  ))}
              </div>

              {filteredMenu.filter((item) => !item.ispopular).length > 0 && (
                <>
                  <h2 className="text-xl font-bold mb-6 mt-8">其他餐點</h2>
                  <div className="space-y-4">
                    {filteredMenu
                      .filter((item) => !item.ispopular)
                      .map((item, index) => (
                        <MenuItemCard
                          key={item.dishid}
                          item={item}
                          cuisine={restaurant.cuisine}
                          index={index}
                          onAddToCart={() => addToCart(item.dishid)}
                        />
                      ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

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
