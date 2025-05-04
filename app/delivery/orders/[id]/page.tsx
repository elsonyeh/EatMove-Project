"use client"

import { useState } from "react"
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
import { deliveryOrders } from "@/lib/data"

export default function DeliveryOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [orderStatus, setOrderStatus] = useState("accepted") // accepted, picked, delivered
  const [activeTab, setActiveTab] = useState("details")

  // 找到對應的訂單
  const order = deliveryOrders.find((o) => o.id === params.id) || deliveryOrders[0]

  const handlePickupOrder = () => {
    setOrderStatus("picked")

    toast({
      title: "已取餐",
      description: "您已成功取餐，請前往送達地點",
    })
  }

  const handleDeliverOrder = () => {
    setOrderStatus("delivered")

    toast({
      title: "訂單已送達",
      description: "感謝您的配送服務",
    })

    // 延遲後返回儀表板
    setTimeout(() => {
      router.push("/delivery/dashboard")
    }, 2000)
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">訂單 #{params.id}</h1>
        <div className="flex items-center">
          <p className="text-muted-foreground">訂單狀態：</p>
          <Badge
            variant={orderStatus === "accepted" ? "default" : orderStatus === "picked" ? "secondary" : "success"}
            className="ml-2"
          >
            {orderStatus === "accepted" ? "已接單" : orderStatus === "picked" ? "已取餐" : "已送達"}
          </Badge>
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
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>{orderStatus === "accepted" ? "前往餐廳路線" : "前往客戶路線"}</CardTitle>
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
                  <Image src="/placeholder.svg?height=48&width=48" alt="餐廳標誌" fill className="object-cover" />
                </div>
                <div>
                  <h3 className="font-medium">{order.restaurant}</h3>
                  <p className="text-sm text-muted-foreground">{order.restaurantAddress}</p>
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
                  <AvatarFallback>客戶</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{order.customer}</h3>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">配送地址</h3>
                <div className="flex items-start">
                  <MapPin className="mr-2 h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span>{order.deliveryAddress}</span>
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
            {orderStatus === "accepted" && (
              <Button className="w-full" onClick={handlePickupOrder}>
                <CheckCircle className="mr-2 h-4 w-4" />
                確認取餐
              </Button>
            )}

            {orderStatus === "picked" && (
              <Button className="w-full" onClick={handleDeliverOrder}>
                <CheckCircle className="mr-2 h-4 w-4" />
                確認送達
              </Button>
            )}

            {orderStatus === "delivered" && (
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
