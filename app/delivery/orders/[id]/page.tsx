"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Phone, MessageSquare, Navigation, CheckCircle } from "lucide-react"
import { DeliveryMap } from "@/components/delivery-map"
import { ChatBox } from "@/components/chat-box"
import { useToast } from "@/components/ui/use-toast"
import React from "react"

export default function DeliveryOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [orderStatus, setOrderStatus] = useState<string>("delivering")
  const [activeTab, setActiveTab] = useState("details")
  const [orderId, setOrderId] = useState<string>("")
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deliverymanId, setDeliverymanId] = useState<string>("")

  // 解析 params 並獲取外送員ID
  React.useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id)
    })

    // 獲取外送員ID
    if (typeof window !== 'undefined') {
      const did = localStorage.getItem('deliverymanId') || localStorage.getItem('did') || '18'
      setDeliverymanId(did)
      console.log("🚚 外送員ID:", did)
    }
  }, [params])

  // 獲取訂單詳情
  useEffect(() => {
    if (orderId && deliverymanId) {
      fetchOrderDetail()
    }
  }, [orderId, deliverymanId])

  const fetchOrderDetail = async () => {
    try {
      console.log("📋 獲取訂單詳情，訂單ID:", orderId, "外送員ID:", deliverymanId)

      // 獲取外送員的所有訂單，然後找到指定的訂單
      const response = await fetch(`/api/orders?did=${deliverymanId}`)
      const result = await response.json()

      if (result.success) {
        const targetOrder = result.orders.find((o: any) => o.oid.toString() === orderId)
        if (targetOrder) {
          setOrder(targetOrder)
          setOrderStatus(targetOrder.status)
          console.log("✅ 訂單詳情獲取成功:", targetOrder)
        } else {
          console.error("❌ 找不到訂單:", orderId)
          toast({
            title: "訂單不存在",
            description: "找不到指定的訂單",
            variant: "destructive"
          })
          router.push("/delivery/dashboard")
        }
      } else {
        console.error("❌ 獲取訂單失敗:", result.message)
        toast({
          title: "獲取訂單失敗",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("❌ 獲取訂單詳情錯誤:", error)
      toast({
        title: "獲取訂單失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePickupOrder = async () => {
    try {
      console.log("🍽️ 確認取餐，訂單ID:", orderId)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'delivering'
        })
      })

      const result = await response.json()

      if (result.success) {
        setOrderStatus("picked")
        // 同時更新本地訂單狀態
        if (order) {
          setOrder({ ...order, status: 'delivering' })
        }
        toast({
          title: "已取餐",
          description: "您已成功取餐，請前往送達地點",
        })
        console.log("✅ 訂單狀態已更新為外送中")
      } else {
        toast({
          title: "取餐確認失敗",
          description: result.message,
          variant: "destructive"
        })
        console.error("❌ 更新訂單狀態失敗:", result.message)
      }
    } catch (error) {
      console.error("❌ 取餐確認錯誤:", error)
      toast({
        title: "取餐確認失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    }
  }

  const handleDeliverOrder = async () => {
    try {
      console.log("📦 確認送達，訂單ID:", orderId)

      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed'
        })
      })

      const result = await response.json()

      if (result.success) {
        setOrderStatus("delivered")
        // 同時更新本地訂單狀態
        if (order) {
          setOrder({ ...order, status: 'completed' })
        }
        toast({
          title: "訂單已送達",
          description: "感謝您的配送服務",
        })
        console.log("✅ 訂單狀態已更新為已完成")

        // 延遲後返回儀表板
        setTimeout(() => {
          router.push("/delivery/dashboard")
        }, 2000)
      } else {
        toast({
          title: "送達確認失敗",
          description: result.message,
          variant: "destructive"
        })
        console.error("❌ 更新訂單狀態失敗:", result.message)
      }
    } catch (error) {
      console.error("❌ 送達確認錯誤:", error)
      toast({
        title: "送達確認失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <div className="text-lg">載入訂單詳情中...</div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-6">
        <div className="text-center">
          <div className="text-lg">找不到訂單</div>
          <Button onClick={() => router.push("/delivery/dashboard")} className="mt-4">
            返回儀表板
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">訂單 #{order.oid}</h1>
        <div className="flex items-center">
          <p className="text-muted-foreground">訂單狀態：</p>
          <Badge
            variant={orderStatus === "delivering" ? "default" : orderStatus === "picked" ? "secondary" : "outline"}
            className="ml-2"
          >
            {orderStatus === "delivering" ? "外送中" : orderStatus === "picked" ? "已取餐" : orderStatus === "completed" ? "已送達" : "進行中"}
          </Badge>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          客戶：{order.member_name} | 總金額：${order.total_amount}
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">訂單詳情</TabsTrigger>
              <TabsTrigger value="map">導航地圖</TabsTrigger>
              <TabsTrigger value="chat">聯絡客戶</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>訂單內容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.items?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md">
                        <Image
                          src={item.menu_image || "/placeholder.svg?height=64&width=64"}
                          alt={item.menu_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.menu_name}</h3>
                        <p className="text-sm text-muted-foreground">{order.restaurant_name}</p>
                        {item.special_instructions && (
                          <p className="text-xs text-orange-600">備註：{item.special_instructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${item.unit_price} x {item.quantity}
                        </div>
                        <div className="text-muted-foreground">${item.subtotal}</div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-medium">
                      <span>配送費：</span>
                      <span>${order.delivery_fee}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>總計：</span>
                      <span>${order.total_amount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{orderStatus === "delivering" ? "前往客戶路線" : "導航地圖"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryMap status={orderStatus} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>聯絡客戶</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChatBox />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>餐廳資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 overflow-hidden rounded-md">
                  <Image src={order.restaurant_image || "/placeholder.svg?height=48&width=48"} alt="餐廳標誌" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">{order.restaurant_name}</h3>
                  <p className="text-sm text-muted-foreground">{order.restaurant_address}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" onClick={() => setActiveTab("map")}>
                  <Navigation className="mr-2 h-4 w-4" />
                  導航
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  撥打電話
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>客戶資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="/placeholder.svg?height=48&width=48" alt="客戶頭像" />
                  <AvatarFallback>{order.member_name?.charAt(0) || "客"}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{order.member_name}</h3>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">配送地址</h3>
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{order.delivery_address}</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">備註</h3>
                <p className="text-sm text-muted-foreground">{order.notes || "無備註"}</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" onClick={() => setActiveTab("chat")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  聊天
                </Button>
                <Button variant="outline" className="flex-1">
                  <Phone className="mr-2 h-4 w-4" />
                  撥打電話
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {orderStatus === "delivering" && (
              <Button className="w-full" onClick={handleDeliverOrder}>
                <CheckCircle className="mr-2 h-4 w-4" />
                確認送達
              </Button>
            )}

            {orderStatus === "completed" && (
              <Button className="w-full" onClick={() => router.push("/delivery/dashboard")}>
                返回儀表板
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
