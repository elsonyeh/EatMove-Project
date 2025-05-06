"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { RatingDialog } from "@/components/rating-dialog"
import { ChatBox } from "@/components/chat-box"
import { DeliveryMap } from "@/components/delivery-map"
import { Clock, CheckCircle, Truck, MapPin, ArrowLeft, Phone, MessageSquare, Star, Navigation } from "lucide-react"

export default function OrderDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [orderStatus, setOrderStatus] = useState("pending") // 訂單狀態：pending, preparing, delivering, delivered
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("status")
  const [orderItems] = useState([
    {
      id: "item-1",
      name: "北京烤鴨",
      price: 580,
      quantity: 1,
      image: "/placeholder.svg?height=64&width=64&text=北京烤鴨",
    },
    {
      id: "item-2",
      name: "宮保雞丁",
      price: 220,
      quantity: 1,
      image: "/placeholder.svg?height=64&width=64&text=宮保雞丁",
    },
  ])

  // 外送員資訊
  const [deliveryPerson, setDeliveryPerson] = useState({
    name: "李小明",
    avatar: "/placeholder.svg?height=128&width=128&text=李小明",
    rating: 4.8,
    vehicle: "機車",
    licensePlate: "ABC-1234",
    phone: "0912-345-678",
    estimatedArrival: "12:45 - 13:00",
    isVisible: false,
  })

  // 計算訂單金額
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 60
  const total = subtotal + deliveryFee

  useEffect(() => {
    // 模擬訂單狀態變化
    const timer1 = setTimeout(() => {
      setOrderStatus("preparing")
      toast({
        title: "訂單狀態更新",
        description: "餐廳已接受您的訂單，正在準備中",
      })
    }, 5000) // 5秒後變為準備中

    const timer2 = setTimeout(() => {
      setOrderStatus("delivering")
      toast({
        title: "訂單狀態更新",
        description: "外送員已取餐，正在前往您的位置",
      })
      // 顯示外送員資訊
      setDeliveryPerson((prev) => ({ ...prev, isVisible: true }))
      // 切換到地圖標籤
      setActiveTab("map")
    }, 10000) // 10秒後變為外送中

    const timer3 = setTimeout(() => {
      setOrderStatus("delivered")
      toast({
        title: "訂單已送達",
        description: "感謝您的訂購，請為本次服務評分",
      })
      setShowRatingDialog(true)
    }, 15000) // 15秒後變為已送達

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [toast])

  // 根據訂單狀態獲取進度
  const getOrderProgress = () => {
    switch (orderStatus) {
      case "pending":
        return 25
      case "preparing":
        return 50
      case "delivering":
        return 75
      case "delivered":
        return 100
      default:
        return 0
    }
  }

  // 根據訂單狀態獲取狀態標籤
  const getStatusBadge = () => {
    switch (orderStatus) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-brand-primary/20 text-brand-primary">
            <Clock className="mr-1 h-3 w-3" />
            訂單處理中
          </Badge>
        )
      case "preparing":
        return (
          <Badge variant="secondary" className="bg-brand-secondary/20 text-brand-secondary">
            <Clock className="mr-1 h-3 w-3" />
            餐點準備中
          </Badge>
        )
      case "delivering":
        return (
          <Badge variant="secondary" className="bg-brand-accent/20 text-brand-accent">
            <Truck className="mr-1 h-3 w-3" />
            外送中
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            已送達
          </Badge>
        )
      default:
        return <Badge>未知狀態</Badge>
    }
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push("/user/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回訂單列表
        </Button>
        <h1 className="text-3xl font-bold tracking-tight mb-2">訂單詳情</h1>
        <div className="flex items-center">
          <p className="text-muted-foreground mr-2">訂單編號: #{id}</p>
          {getStatusBadge()}
        </div>
      </div>

      {/* 外送員資訊卡片 - 僅在外送中或已送達時顯示 */}
      {deliveryPerson.isVisible && (
        <Card className="mb-6 border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-brand-primary/20">
                  <AvatarImage src={deliveryPerson.avatar || "/placeholder.svg"} alt={deliveryPerson.name} />
                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xl">
                    {deliveryPerson.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{deliveryPerson.name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span>{deliveryPerson.rating}</span>
                    <span className="mx-2">•</span>
                    <span>{deliveryPerson.vehicle}</span>
                    <span className="mx-2">•</span>
                    <span>{deliveryPerson.licensePlate}</span>
                  </div>
                  {orderStatus === "delivering" && (
                    <p className="text-sm mt-1 text-brand-primary font-medium">
                      預計 {deliveryPerson.estimatedArrival} 送達
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                  <Phone className="h-5 w-5 text-brand-primary" />
                  <span className="sr-only">撥打電話</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => setActiveTab("chat")}
                >
                  <MessageSquare className="h-5 w-5 text-brand-primary" />
                  <span className="sr-only">傳送訊息</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="status">訂單狀態</TabsTrigger>
              <TabsTrigger value="map">即時追蹤</TabsTrigger>
              <TabsTrigger value="chat">聯絡外送員</TabsTrigger>
            </TabsList>

            <TabsContent value="status" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>訂單狀態</CardTitle>
                  <CardDescription>即時追蹤您的訂單</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* 進度條 */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-brand-primary h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${getOrderProgress()}%` }}
                      ></div>
                    </div>

                    {/* 狀態步驟 */}
                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            orderStatus ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          <Clock className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">訂單處理中</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            orderStatus === "preparing" || orderStatus === "delivering" || orderStatus === "delivered"
                              ? "bg-brand-primary text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">餐點準備中</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            orderStatus === "delivering" || orderStatus === "delivered"
                              ? "bg-brand-primary text-white"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          <Truck className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">外送中</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            orderStatus === "delivered" ? "bg-brand-primary text-white" : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">已送達</p>
                      </div>
                    </div>

                    {/* 預計送達時間 */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">預計送達時間</h3>
                      <p className="text-2xl font-bold">{orderStatus === "delivered" ? "已送達" : "12:45 - 13:00"}</p>
                    </div>

                    {/* 配送地址 */}
                    <div>
                      <h3 className="font-medium mb-2">配送地址</h3>
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                        <p>台北市信義區信義路五段7號</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>即時位置追蹤</CardTitle>
                  <CardDescription>
                    {orderStatus === "delivering"
                      ? "外送員正在前往您的位置"
                      : orderStatus === "delivered"
                        ? "訂單已送達"
                        : "訂單準備中"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryMap status={orderStatus} />

                  {orderStatus === "delivering" && (
                    <div className="mt-4 p-4 bg-brand-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">預計送達時間</h3>
                          <p className="text-xl font-bold">{deliveryPerson.estimatedArrival}</p>
                        </div>
                        <Button className="bg-brand-primary hover:bg-brand-primary/90">
                          <Navigation className="mr-2 h-4 w-4" />
                          開啟導航
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>與外送員聊天</CardTitle>
                  <CardDescription>
                    {deliveryPerson.isVisible ? `與 ${deliveryPerson.name} 聯絡` : "外送員尚未指派"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {deliveryPerson.isVisible ? (
                    <ChatBox />
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">外送員尚未指派，請稍候...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>訂單內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">京華樓</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${item.price} x {item.quantity}
                    </div>
                    <div className="text-muted-foreground">${item.price * item.quantity}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>小計</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>外送費</span>
                <span>${deliveryFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>總計</span>
                <span>${total}</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {orderStatus === "delivered" ? (
                <Button className="w-full" onClick={() => setShowRatingDialog(true)}>
                  評分訂單
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => router.push("/user/home")}>
                  繼續購物
                </Button>
              )}

              {deliveryPerson.isVisible && (
                <div className="w-full grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    撥打電話
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab("chat")}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    傳送訊息
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>

      <RatingDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} />
    </div>
  )
}
