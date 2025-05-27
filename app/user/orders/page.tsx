"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight, Star, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"

interface Order {
  oid: number
  rid: number
  did?: number
  restaurant_name: string
  restaurant_image: string
  delivery_address: string
  total_amount: number
  delivery_fee: number
  status: string
  notes: string
  created_at: string
  estimated_delivery_time: string
  actual_delivery_time: string
  restaurant_rating: number
  delivery_rating: number
  items: Array<{
    mid: number
    menu_name: string
    quantity: number
    unit_price: number
    subtotal: number
    special_instructions: string
  }>
}

const statusMap = {
  pending: { label: "待確認", color: "bg-yellow-500" },
  accepted: { label: "已接受", color: "bg-blue-500" },
  preparing: { label: "準備中", color: "bg-orange-500" },
  ready: { label: "已完成", color: "bg-green-500" },
  delivering: { label: "外送中", color: "bg-purple-500" },
  completed: { label: "已送達", color: "bg-gray-500" },
  cancelled: { label: "已取消", color: "bg-red-500" }
}

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [restaurantRating, setRestaurantRating] = useState(5)
  const [deliveryRating, setDeliveryRating] = useState(5)
  const [restaurantComment, setRestaurantComment] = useState("")
  const [deliveryComment, setDeliveryComment] = useState("")
  const [submittingRating, setSubmittingRating] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [userId, setUserId] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  // 獲取用戶ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId') || '1'
      setUserId(id)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      fetchOrders()
    }
  }, [userId])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`/api/orders?uid=${userId}`)
      const result = await response.json()

      if (result.success) {
        setOrders(result.orders)
      } else {
        console.error("獲取訂單失敗:", result.message)
      }
    } catch (error) {
      console.error("獲取訂單失敗:", error)
    } finally {
      setLoading(false)
    }
  }

  const submitRating = async () => {
    if (!selectedOrder) return

    setSubmittingRating(true)

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oid: selectedOrder.oid,
          uid: parseInt(userId),
          rid: selectedOrder.rid,
          did: selectedOrder.did || null,
          restaurantRating,
          deliveryRating,
          restaurantComment,
          deliveryComment
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "評分提交成功",
          description: "感謝您的評分！"
        })
        setSelectedOrder(null)
        setRestaurantRating(5)
        setDeliveryRating(5)
        setRestaurantComment("")
        setDeliveryComment("")
        fetchOrders() // 重新獲取訂單
      } else {
        toast({
          title: "評分提交失敗",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("提交評分失敗:", error)
      toast({
        title: "評分提交失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setSubmittingRating(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-TW')
  }

  const StarRating = ({ rating, onRatingChange }: { rating: number, onRatingChange: (rating: number) => void }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRatingChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
            />
          </button>
        ))}
      </div>
    )
  }

  // 過濾訂單
  const filteredOrders = orders.filter((order) => {
    // 根據標籤過濾
    if (activeTab === "processing") {
      // 處理中包含：待確認、已接受、準備中、已完成（等待取餐）、外送中
      const processingStatuses = ["pending", "accepted", "preparing", "ready", "delivering"]
      if (!processingStatuses.includes(order.status)) return false
    }
    if (activeTab === "completed" && order.status !== "completed") return false
    if (activeTab === "cancelled" && order.status !== "cancelled") return false

    // 根據搜尋詞過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.restaurant_name.toLowerCase().includes(query) ||
        order.items.some((item) => item.menu_name.toLowerCase().includes(query))
      )
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        <span className="ml-2">載入中...</span>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">訂單記錄</h1>
        <p className="text-muted-foreground">查看您的所有訂單記錄和狀態</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜尋訂單..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">全部訂單</TabsTrigger>
          <TabsTrigger value="processing">處理中</TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
          <TabsTrigger value="cancelled">已取消</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <Card key={order.oid} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        訂單 #{order.oid}
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-base font-normal">{formatTime(order.created_at)}</span>
                      </CardTitle>
                      <Badge className={`${statusMap[order.status as keyof typeof statusMap]?.color} text-white`}>
                        {statusMap[order.status as keyof typeof statusMap]?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-lg mb-1">{order.restaurant_name}</h3>
                        <p className="text-muted-foreground">
                          {order.items.map((item) => item.menu_name).join(", ")}
                          {order.items.length > 3 ? "..." : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-lg">${order.total_amount - order.delivery_fee}</div>
                          <div className="text-sm text-muted-foreground">{order.items.length} 件商品</div>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/user/orders/${order.oid}`}>
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                              查看詳情
                              <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                          </Link>
                          {order.status === "completed" && !order.restaurant_rating && (
                            <Button
                              size="sm"
                              className="whitespace-nowrap bg-brand-primary hover:bg-brand-primary/90"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Star className="mr-1 h-4 w-4" />
                              評分
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <div className="bg-brand-primary/10 p-4 rounded-full inline-flex mb-4">
                <AlertTriangle className="h-12 w-12 text-brand-primary" />
              </div>
              <h2 className="text-xl font-medium mb-2">沒有找到訂單</h2>
              <p className="text-muted-foreground mb-6">
                {searchQuery ? "請嘗試其他搜尋條件" : "您目前沒有任何訂單記錄"}
              </p>
              <Button onClick={() => router.push("/user/home")} className="bg-brand-primary hover:bg-brand-primary/90">
                開始點餐
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 評分彈窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>評分訂單 #{selectedOrder.oid}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">餐廳評分</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-16">評分:</span>
                    <StarRating
                      rating={restaurantRating}
                      onRatingChange={setRestaurantRating}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">評論 (選填)</label>
                    <Textarea
                      value={restaurantComment}
                      onChange={(e) => setRestaurantComment(e.target.value)}
                      placeholder="分享您對餐廳的評價..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">外送評分</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm w-16">評分:</span>
                    <StarRating
                      rating={deliveryRating}
                      onRatingChange={setDeliveryRating}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">評論 (選填)</label>
                    <Textarea
                      value={deliveryComment}
                      onChange={(e) => setDeliveryComment(e.target.value)}
                      placeholder="分享您對外送服務的評價..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedOrder(null)
                    setRestaurantRating(5)
                    setDeliveryRating(5)
                    setRestaurantComment("")
                    setDeliveryComment("")
                  }}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  onClick={submitRating}
                  disabled={submittingRating}
                  className="flex-1"
                >
                  {submittingRating ? "提交中..." : "提交評分"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
