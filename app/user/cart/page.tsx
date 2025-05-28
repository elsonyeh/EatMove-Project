"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useCartDB } from "@/hooks/use-cart-db"
import { useToast } from "@/components/ui/use-toast"
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight, AlertTriangle, Store, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

interface RestaurantGroup {
  rid: number
  restaurantName: string
  items: Array<{
    cart_item_id: number
    cart_id: number
    rid: number
    dishId: number
    dishName: string
    price: number
    quantity: number
    specialInstructions: string
    image: string
    restaurantName: string
    addedAt: string
  }>
  totalPrice: number
  totalItems: number
}

export default function CartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart } = useCartDB()
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set())
  const [selectedRestaurants, setSelectedRestaurants] = useState<Set<number>>(new Set())

  // 按餐廳分組購物車項目
  const restaurantGroups = useMemo((): RestaurantGroup[] => {
    const groups: { [key: number]: RestaurantGroup } = {}

    cart.items.forEach(item => {
      if (!groups[item.rid]) {
        groups[item.rid] = {
          rid: item.rid,
          restaurantName: item.restaurantName,
          items: [],
          totalPrice: 0,
          totalItems: 0
        }
      }

      groups[item.rid].items.push(item)
      groups[item.rid].totalPrice += item.price * item.quantity
      groups[item.rid].totalItems += item.quantity
    })

    return Object.values(groups)
  }, [cart.items])

  // 檢查是否有多個餐廳
  const hasMultipleRestaurants = restaurantGroups.length > 1

  // 獲取選中餐廳的項目
  const selectedItems = useMemo(() => {
    if (selectedRestaurants.size === 0) return []
    return cart.items.filter(item => selectedRestaurants.has(item.rid))
  }, [cart.items, selectedRestaurants])

  // 計算選中項目的總價
  const selectedTotalPrice = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0)

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 0) return

    setUpdatingItems(prev => new Set(prev).add(cartItemId))

    try {
      const success = await updateCartItem(cartItemId, newQuantity)
      if (success) {
        toast({
          title: newQuantity === 0 ? "商品已移除" : "數量已更新",
          description: newQuantity === 0 ? "商品已從購物車中移除" : `數量已更新為 ${newQuantity}`,
        })
      }
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const handleRemoveItem = async (cartItemId: number) => {
    setUpdatingItems(prev => new Set(prev).add(cartItemId))

    try {
      const success = await removeFromCart(cartItemId)
      if (success) {
        toast({
          title: "商品已移除",
          description: "商品已從購物車中移除",
        })
      }
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(cartItemId)
        return newSet
      })
    }
  }

  const handleClearCart = async () => {
    const success = await clearCart()
    if (success) {
      toast({
        title: "購物車已清空",
        description: "所有商品已從購物車中移除",
      })
      setSelectedRestaurants(new Set())
    }
    setShowClearDialog(false)
  }

  const handleRestaurantSelect = (rid: number, checked: boolean) => {
    setSelectedRestaurants(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(rid)
      } else {
        newSet.delete(rid)
      }
      return newSet
    })
  }

  const handleSelectAllFromRestaurant = (rid: number) => {
    setSelectedRestaurants(new Set([rid]))
    toast({
      title: "已選擇餐廳",
      description: `已選擇來自 ${restaurantGroups.find(g => g.rid === rid)?.restaurantName} 的所有商品`,
    })
  }

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast({
        title: "購物車是空的",
        description: "請先添加商品到購物車",
        variant: "destructive",
      })
      return
    }

    if (hasMultipleRestaurants && selectedRestaurants.size === 0) {
      toast({
        title: "請選擇餐廳",
        description: "您的購物車包含多家餐廳的商品，請選擇要結帳的餐廳",
        variant: "destructive",
      })
      return
    }

    if (hasMultipleRestaurants && selectedRestaurants.size > 1) {
    toast({
        title: "一次只能選擇一家餐廳",
        description: "請只選擇一家餐廳進行結帳",
        variant: "destructive",
      })
      return
    }

    // 如果只有一家餐廳，自動選擇
    if (!hasMultipleRestaurants && restaurantGroups.length === 1) {
      const selectedRestaurantId = restaurantGroups[0].rid
      // 將選擇的餐廳資訊傳遞到checkout頁面
      router.push(`/user/checkout?restaurant=${selectedRestaurantId}`)
    } else if (selectedRestaurants.size === 1) {
      const selectedRestaurantId = Array.from(selectedRestaurants)[0]
      router.push(`/user/checkout?restaurant=${selectedRestaurantId}`)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <span className="ml-2">載入中...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2 text-red-600">載入失敗</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingCart className="h-6 w-6 text-brand-primary mr-2" />
            <h1 className="text-3xl font-bold tracking-tight">購物車</h1>
            {cart.totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {cart.totalItems} 件商品
              </Badge>
            )}
            {hasMultipleRestaurants && (
              <Badge variant="outline" className="ml-2 text-orange-600 border-orange-200">
                {restaurantGroups.length} 家餐廳
              </Badge>
            )}
        </div>
        {cart.items.length > 0 && (
          <Button
            variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="text-red-600 hover:text-red-700"
          >
              <Trash2 className="h-4 w-4 mr-2" />
            清空購物車
          </Button>
        )}
      </div>
      </div>

      {/* 多餐廳警告 */}
      {hasMultipleRestaurants && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">注意：您的購物車包含多家餐廳的商品</AlertTitle>
          <AlertDescription className="text-orange-700">
            一次訂單只能選擇一家餐廳的商品。請選擇您要結帳的餐廳，或使用下方的一鍵選取功能。
          </AlertDescription>
        </Alert>
      )}

      {cart.items.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">購物車是空的</h2>
          <p className="text-muted-foreground mb-4">開始添加一些美味的餐點吧！</p>
          <Button onClick={() => router.push("/user/home")} className="bg-brand-primary hover:bg-brand-primary/90">
            開始購物
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {restaurantGroups.map((group) => (
              <Card key={group.rid} className={`${selectedRestaurants.has(group.rid) ? 'ring-2 ring-brand-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {hasMultipleRestaurants && (
                        <Checkbox
                          checked={selectedRestaurants.has(group.rid)}
                          onCheckedChange={(checked) => handleRestaurantSelect(group.rid, checked as boolean)}
                        />
                      )}
                      <Store className="h-5 w-5 text-brand-primary" />
                      <div>
                        <CardTitle className="text-lg">{group.restaurantName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {group.totalItems} 件商品 • NT$ {group.totalPrice}
                        </p>
                    </div>
                    </div>
                    {hasMultipleRestaurants && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllFromRestaurant(group.rid)}
                        className="text-brand-primary border-brand-primary hover:bg-brand-primary hover:text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        選擇此餐廳
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.items.map((item) => (
                    <div key={item.cart_item_id} className="flex gap-4 p-3 rounded-lg border border-gray-100">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={item.image || "/images/menu/default.jpg"}
                          alt={item.dishName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{item.dishName}</h4>
                            {item.specialInstructions && (
                              <p className="text-sm text-muted-foreground">
                                備註：{item.specialInstructions}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(item.cart_item_id)}
                            disabled={updatingItems.has(item.cart_item_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.cart_item_id, item.quantity - 1)}
                              disabled={updatingItems.has(item.cart_item_id)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.cart_item_id, item.quantity + 1)}
                              disabled={updatingItems.has(item.cart_item_id)}
                            >
                              <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                          <div className="text-right">
                            <p className="font-medium">NT$ {item.price * item.quantity}</p>
                            <p className="text-sm text-muted-foreground">NT$ {item.price} / 份</p>
                          </div>
                        </div>
                      </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            ))}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>訂單摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasMultipleRestaurants && selectedRestaurants.size > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      已選擇：{selectedRestaurants.size === 1 ?
                        restaurantGroups.find(g => selectedRestaurants.has(g.rid))?.restaurantName :
                        `${selectedRestaurants.size} 家餐廳`}
                    </p>
                    <div className="flex justify-between">
                      <span>小計</span>
                      <span>NT$ {selectedTotalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>外送費</span>
                      <span>NT$ 60</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium text-lg">
                      <span>總計</span>
                      <span>NT$ {selectedTotalPrice + 60}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                <div className="flex justify-between">
                  <span>小計</span>
                      <span>NT$ {cart.totalPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>外送費</span>
                      <span>NT$ 60</span>
                </div>
                <Separator />
                    <div className="flex justify-between font-medium text-lg">
                  <span>總計</span>
                      <span>NT$ {cart.totalPrice + 60}</span>
                    </div>
                </div>
                )}

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-brand-primary hover:bg-brand-primary/90"
                  size="lg"
                  disabled={hasMultipleRestaurants && selectedRestaurants.size !== 1}
                >
                  {hasMultipleRestaurants && selectedRestaurants.size === 0 ?
                    "請選擇餐廳" :
                    hasMultipleRestaurants && selectedRestaurants.size > 1 ?
                      "請只選擇一家餐廳" :
                      "前往結帳"
                  }
                  {(!hasMultipleRestaurants || selectedRestaurants.size === 1) &&
                    <ArrowRight className="h-4 w-4 ml-2" />
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showClearDialog && (
        <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>確認清空購物車</AlertDialogTitle>
              <AlertDialogDescription>
                您確定要清空購物車嗎？所有商品將從購物車中移除。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowClearDialog(false)}>取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearCart}>確認</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
