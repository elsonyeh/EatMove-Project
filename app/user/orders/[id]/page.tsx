"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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

interface OrderItem {
  item_id: number
  dishid: number
  menu_name: string
  quantity: number
  unit_price: number
  subtotal: number
  special_instructions?: string
}

interface Order {
  oid: number
  mid: string
  rid: number
  did?: number
  delivery_address: string
  total_amount: number
  delivery_fee: number
  status: string
  order_time: string
  estimated_delivery_time: string
  actual_delivery_time?: string
  notes?: string
  payment_method: string
  restaurant_name: string
  restaurant_image?: string
  restaurant_phone?: string
  restaurant_address?: string
  member_name: string
  member_phone?: string
  delivery_name?: string
  delivery_phone?: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("status")

  useEffect(() => {
    if (id) {
      fetchOrderDetails()
    }
  }, [id])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${id}`)
      const result = await response.json()

      if (result.success) {
        setOrder(result.order)
      } else {
        toast({
          title: "錯誤",
          description: result.message || "獲取訂單詳情失敗",
          variant: "destructive",
        })
        router.push("/user/orders")
      }
    } catch (error) {
      console.error("獲取訂單詳情失敗:", error)
      toast({
        title: "錯誤",
        description: "網路錯誤，請稍後再試",
        variant: "destructive",
      })
      router.push("/user/orders")
    } finally {
      setLoading(false)
    }
  }

  // 根據訂單狀態獲取進度
  const getOrderProgress = () => {
    if (!order) return 0
    switch (order.status) {
      case "pending":
        return 25
      case "accepted":
      case "preparing":
        return 50
      case "ready":
      case "delivering":
        return 75
      case "completed":
        return 100
      default:
        return 0
    }
  }

  // 根據訂單狀態獲取狀態標籤
  const getStatusBadge = () => {
    if (!order) return <Badge>載入中...</Badge>

    switch (order.status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-brand-primary/20 text-brand-primary">
            <Clock className="mr-1 h-3 w-3" />
            訂單處理中
          </Badge>
        )
      case "accepted":
      case "preparing":
        return (
          <Badge variant="secondary" className="bg-brand-secondary/20 text-brand-secondary">
            <Clock className="mr-1 h-3 w-3" />
            餐點準備中
          </Badge>
        )
      case "ready":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            餐點已準備完成
          </Badge>
        )
      case "delivering":
        return (
          <Badge variant="secondary" className="bg-brand-accent/20 text-brand-accent">
            <Truck className="mr-1 h-3 w-3" />
            外送中
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            已送達
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            已取消
          </Badge>
        )
      default:
        return <Badge>未知狀態</Badge>
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-TW')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <span className="ml-2">載入中...</span>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">訂單不存在</h2>
          <p className="text-muted-foreground mb-4">找不到指定的訂單</p>
          <Button onClick={() => router.push("/user/orders")}>返回訂單列表</Button>
        </div>
      </div>
    )
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
          <p className="text-muted-foreground mr-2">訂單編號: #{order.oid}</p>
          {getStatusBadge()}
        </div>
      </div>

      {/* 外送員資訊卡片 - 僅在有外送員時顯示 */}
      {order.delivery_name && (order.status === "delivering" || order.status === "completed") && (
        <Card className="mb-6 border-brand-primary/20 bg-gradient-to-r from-brand-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-brand-primary/20">
                  <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xl">
                    {order.delivery_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{order.delivery_name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>外送員</span>
                    {order.delivery_phone && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{order.delivery_phone}</span>
                      </>
                    )}
                  </div>
                  {order.status === "delivering" && (
                    <p className="text-sm mt-1 text-brand-primary font-medium">
                      預計 {formatTime(order.estimated_delivery_time)} 送達
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {order.delivery_phone && (
                  <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                    <Phone className="h-5 w-5 text-brand-primary" />
                    <span className="sr-only">撥打電話</span>
                  </Button>
                )}
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
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${["pending", "accepted", "preparing", "ready", "delivering", "completed"].includes(order.status)
                            ? "bg-brand-primary text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          <Clock className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">訂單處理中</p>
                      </div>
                      <div className="text-center">
                        <div
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${["accepted", "preparing", "ready", "delivering", "completed"].includes(order.status)
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
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${["delivering", "completed"].includes(order.status)
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
                          className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 ${order.status === "completed"
                            ? "bg-brand-primary text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-medium">已送達</p>
                      </div>
                    </div>

                    {/* 預計送達時間 */}
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">
                        {order.status === "completed" ? "實際送達時間" : "預計送達時間"}
                      </h3>
                      <p className="text-2xl font-bold">
                        {order.status === "completed" && order.actual_delivery_time
                          ? formatTime(order.actual_delivery_time)
                          : order.status === "completed"
                            ? "已送達"
                            : formatTime(order.estimated_delivery_time)
                        }
                      </p>
                    </div>

                    {/* 配送地址 */}
                    <div>
                      <h3 className="font-medium mb-2">配送地址</h3>
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 mt-0.5 text-muted-foreground" />
                        <p>{order.delivery_address}</p>
                      </div>
                    </div>

                    {/* 餐廳資訊 */}
                    <div>
                      <h3 className="font-medium mb-2">餐廳資訊</h3>
                      <div className="space-y-2">
                        <p className="font-medium">{order.restaurant_name}</p>
                        {order.restaurant_address && (
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{order.restaurant_address}</p>
                          </div>
                        )}
                        {order.restaurant_phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{order.restaurant_phone}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 訂單時間 */}
                    <div>
                      <h3 className="font-medium mb-2">訂單時間</h3>
                      <p className="text-sm text-muted-foreground">{formatTime(order.order_time)}</p>
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
                    {order.status === "delivering"
                      ? "外送員正在前往您的位置"
                      : order.status === "completed"
                        ? "訂單已送達"
                        : "訂單準備中"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DeliveryMap
                    status={order.status}
                    restaurantAddress={order.restaurant_address}
                    deliveryAddress={order.delivery_address}
                    deliverymanName={order.delivery_name}
                    deliverymanPhone={order.delivery_phone}
                    estimatedTime={order.status === "delivering" ? formatTime(order.estimated_delivery_time) : undefined}
                  />

                  {order.status === "delivering" && (
                    <div className="mt-4 p-4 bg-brand-primary/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">預計送達時間</h3>
                          <p className="text-xl font-bold">{formatTime(order.estimated_delivery_time)}</p>
                        </div>
                        <Button
                          className="bg-brand-primary hover:bg-brand-primary/90"
                          onClick={() => {
                            const restaurantAddr = order.restaurant_address || "餐廳地址"
                            const deliveryAddr = order.delivery_address || "配送地址"
                            window.open(`https://www.google.com/maps/dir/${encodeURIComponent(restaurantAddr)}/${encodeURIComponent(deliveryAddr)}`, '_blank')
                          }}
                        >
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
                    {order.delivery_name ? `與 ${order.delivery_name} 聯絡` : "外送員尚未指派"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {order.delivery_name ? (
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
              {order.items.map((item) => (
                <div key={item.item_id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.menu_name}</h3>
                    <p className="text-sm text-muted-foreground">{order.restaurant_name}</p>
                    {item.special_instructions && (
                      <p className="text-sm text-muted-foreground">備註：{item.special_instructions}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(item.unit_price)} x {item.quantity}
                    </div>
                    <div className="text-muted-foreground">{formatCurrency(item.subtotal)}</div>
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
                <span>{formatCurrency(order.total_amount - order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between">
                <span>外送費</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>總計</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                付款方式：{order.payment_method === 'cash' ? '現金付款' : order.payment_method}
              </div>
              {order.notes && (
                <div className="text-sm">
                  <span className="font-medium">備註：</span>
                  <span className="text-muted-foreground">{order.notes}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              {order.status === "completed" ? (
                <Button className="w-full" onClick={() => setShowRatingDialog(true)}>
                  評分訂單
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={() => router.push("/user/home")}>
                  繼續購物
                </Button>
              )}

              {order.delivery_name && order.delivery_phone && (
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

      <RatingDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        order={order ? { oid: order.oid, rid: order.rid, did: order.did } : undefined}
        userId={typeof window !== 'undefined' ? localStorage.getItem('userId') || '1' : '1'}
      />
    </div>
  )
}
