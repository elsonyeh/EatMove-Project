"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Phone, MessageSquare, Star } from "lucide-react"
import { DeliveryMap } from "@/components/delivery-map"
import { ChatBox } from "@/components/chat-box"
import { RatingDialog } from "@/components/rating-dialog"
import { useToast } from "@/components/ui/use-toast"
import { cartItems } from "@/lib/data"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const { toast } = useToast()
  const [orderStatus, setOrderStatus] = useState("preparing") // preparing, delivering, delivered
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("order")

  // 模擬訂單狀態變化
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setOrderStatus("delivering")
      toast({
        title: "外送員已取餐",
        description: "外送員正在前往您的位置",
      })
    }, 10000)

    const timer2 = setTimeout(() => {
      setOrderStatus("delivered")
      toast({
        title: "訂單已送達",
        description: "感謝您的訂購，請為本次服務評分",
      })
      setShowRatingDialog(true)
    }, 20000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [toast])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = 60
  const total = subtotal + deliveryFee

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">訂單 #{params.id}</h1>
        <div className="flex items-center">
          <p className="text-muted-foreground">訂單狀態：</p>
          <Badge
            variant={orderStatus === "preparing" ? "default" : orderStatus === "delivering" ? "secondary" : "success"}
            className="ml-2"
          >
            {orderStatus === "preparing" ? "餐點準備中" : orderStatus === "delivering" ? "外送中" : "已送達"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="order">訂單詳情</TabsTrigger>
              <TabsTrigger value="map">即時追蹤</TabsTrigger>
              <TabsTrigger value="chat">聯絡外送員</TabsTrigger>
            </TabsList>

            <TabsContent value="order" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>訂單內容</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-md">
                        <Image
                          src={item.image || "/placeholder.svg?height=64&width=64"}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">{item.restaurant}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${item.price} x {item.quantity}
                        </div>
                        <div className="text-muted-foreground">${item.price * item.quantity}</div>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-2">
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>即時追蹤</CardTitle>
                </CardHeader>
                <CardContent>
                  <DeliveryMap status={orderStatus} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>聯絡外送員</CardTitle>
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
              <CardTitle>配送資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">配送地址</h3>
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>台北市信義區信義路五段7號</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">聯絡電話</h3>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>0912345678</span>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">備註</h3>
                <p className="text-sm text-muted-foreground">請放在門口，不用按門鈴</p>
              </div>
            </CardContent>
          </Card>

          {(orderStatus === "delivering" || orderStatus === "delivered") && (
            <Card>
              <CardHeader>
                <CardTitle>外送員資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src="/placeholder.svg?height=48&width=48" alt="外送員頭像" />
                    <AvatarFallback>外送</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">陳大明</h3>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Star className="mr-1 h-3 w-3 fill-primary text-primary" />
                      <span>4.8 · 已完成 328 筆訂單</span>
                    </div>
                  </div>
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
          )}

          {orderStatus === "delivered" && (
            <Button className="w-full" onClick={() => setShowRatingDialog(true)}>
              評分此訂單
            </Button>
          )}
        </div>
      </div>

      {showRatingDialog && <RatingDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} />}
    </div>
  )
}
