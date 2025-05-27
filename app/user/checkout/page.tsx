"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useCartDB } from "@/hooks/use-cart-db"
import { MapPin, CreditCard, Clock } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { cart, clearCart, loading } = useCartDB()
  const [orderNotes, setOrderNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    address: "",
    phone: ""
  })
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  })

  // 獲取選中的餐廳ID
  const selectedRestaurantId = searchParams.get('restaurant')

  // 過濾選中餐廳的商品
  const filteredItems = useMemo(() => {
    if (!selectedRestaurantId) {
      // 如果沒有指定餐廳，返回所有項目（適用於單一餐廳情況）
      return cart.items
    }
    return cart.items.filter(item => item.rid === parseInt(selectedRestaurantId))
  }, [cart.items, selectedRestaurantId])

  // 計算過濾後的總價
  const filteredSubtotal = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryFee = 60
  const total = filteredSubtotal + deliveryFee

  // 獲取餐廳名稱
  const restaurantName = filteredItems.length > 0 ? filteredItems[0].restaurantName : ""

  // 獲取用戶資料
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const uid = localStorage.getItem("userId")
        if (!uid) {
          toast({
            title: "錯誤",
            description: "請先登入",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        const response = await fetch(`/api/user/profile?mid=${uid}`)
        const data = await response.json()

        if (data.success) {
          setUserData(data.data)
          // 設定表單初始值
          setFormData({
            name: data.data.name || "",
            phone: data.data.phonenumber || "",
            address: data.data.address || ""
          })
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error)
      }
    }

    fetchUserData()
  }, [toast, router])

  // 檢查購物車是否為空或無效選擇
  useEffect(() => {
    if (!loading) {
      if (cart.items.length === 0) {
        toast({
          title: "購物車為空",
          description: "請先添加商品到購物車",
          variant: "destructive",
        })
        router.push("/user/home")
        return
      }

      if (selectedRestaurantId && filteredItems.length === 0) {
        toast({
          title: "無效的餐廳選擇",
          description: "所選餐廳沒有商品，請返回購物車重新選擇",
          variant: "destructive",
        })
        router.push("/user/cart")
        return
      }
    }
  }, [loading, cart.items.length, filteredItems.length, selectedRestaurantId, toast, router])

  const handleSubmitOrder = async () => {
    if (!formData.address.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入外送地址",
        variant: "destructive"
      })
      return
    }

    if (!formData.name.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入收件人姓名",
        variant: "destructive"
      })
      return
    }

    if (!formData.phone.trim()) {
      toast({
        title: "錯誤",
        description: "請輸入聯絡電話",
        variant: "destructive"
      })
      return
    }

    const uid = localStorage.getItem('userId')
    if (!uid) {
      toast({
        title: "錯誤",
        description: "請先登入",
        variant: "destructive"
      })
      return
    }

    // 檢查過濾後的項目
    if (!filteredItems.length || !filteredItems[0].rid) {
      toast({
        title: "錯誤",
        description: "購物車資料異常，請重新添加商品",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const orderData = {
        uid: uid,
        rid: filteredItems[0].rid, // 使用過濾後項目的餐廳ID
        items: filteredItems.map(item => ({
          dishId: item.dishId,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
          specialInstructions: item.specialInstructions || ""
        })),
        deliveryAddress: formData.address,
        totalAmount: total,
        deliveryFee,
        notes: orderNotes
      }

      console.log(`📦 準備提交訂單:`, orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "訂單提交成功",
          description: "您的訂單已成功提交！"
        })
        await clearCart()
        router.push(`/user/orders/${result.orderId}`)
      } else {
        toast({
          title: "訂單提交失敗",
          description: result.message || "訂單提交失敗",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("提交訂單失敗:", error)
      toast({
        title: "訂單提交失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">結帳</h1>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  if (filteredItems.length === 0) {
    return null // 會被 useEffect 重導向
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">結帳</h1>
        <p className="text-muted-foreground">確認您的訂單並完成結帳</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* 外送資訊 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                外送資訊
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">收件人姓名</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="請輸入姓名"
                />
              </div>
              <div>
                <Label htmlFor="phone">聯絡電話</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="請輸入電話號碼"
                />
              </div>
              <div>
                <Label htmlFor="address">外送地址 *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="請輸入詳細地址"
                />
              </div>
              <div>
                <Label htmlFor="notes">訂單備註</Label>
                <Textarea
                  id="notes"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="其他要求（選填）"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 訂單商品 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單商品</CardTitle>
              <p className="text-sm text-muted-foreground">來自 {restaurantName}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <div key={item.cart_item_id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">{item.dishName}</h3>
                      <p className="text-sm text-muted-foreground">
                        ${item.price} x {item.quantity}
                      </p>
                    </div>
                    <div className="font-medium text-lg">
                      ${item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 訂單摘要 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                訂單摘要
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>小計</span>
                <span>${filteredSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>外送費</span>
                <span>${deliveryFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>總計</span>
                <span>${total}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                <span>預計 30-45 分鐘送達</span>
              </div>
              <Button
                className="w-full"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? "提交中..." : `確認訂單 $${total}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
