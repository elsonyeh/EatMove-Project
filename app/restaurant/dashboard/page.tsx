"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { OrderCard } from "@/components/order-card"
import { useRestaurantAuth } from "@/components/restaurant-auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface RestaurantData {
  rid: number
  name: string
  rating: number
  minOrder: number
  image: string
  businessHours: string
  isOpen: boolean
  deliveryArea: string
  cuisine: string
}

interface StatsData {
  todayOrders: number
  todayRevenue: number
  currentRating: number
  pendingOrders: number
  preparingOrders: number
  completedOrders: number
  cancelledOrders: number
  orderChangePercent: number
  revenueChangePercent: number
  ratingChange: number
}

interface OrderData {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  items: any[]
  total: number
  deliveryFee: number
  status: string
  orderTime: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  notes?: string
  paymentMethod: string
}

interface DashboardData {
  restaurant: RestaurantData
  stats: StatsData
  orders: OrderData[]
}

export default function RestaurantDashboardPage() {
  const { account } = useRestaurantAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)

  useEffect(() => {
    if (account?.restaurantId) {
      fetchDashboardData()
    }
  }, [account])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/restaurant/dashboard?rid=${account?.restaurantId}`)
      const result = await response.json()

      if (result.success) {
        setDashboardData(result.data)
      } else {
        toast({
          title: "錯誤",
          description: result.message || "獲取儀表板資料失敗",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("獲取儀表板資料失敗:", error)
      toast({
        title: "錯誤",
        description: "獲取儀表板資料失敗",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 根據訂單狀態分類
  const pendingOrders = dashboardData?.orders.filter((order) => order.status === "pending") || []
  const preparingOrders = dashboardData?.orders.filter((order) => order.status === "preparing") || []
  const completedOrders = dashboardData?.orders.filter((order) => order.status === "completed") || []

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatPercentChange = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    const color = percent >= 0 ? 'text-green-500' : 'text-red-500'
    return <span className={color}>{sign}{percent}%</span>
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {dashboardData?.restaurant.name || account?.restaurantName || "餐廳"} 管理中心
        </h1>
        <p className="text-muted-foreground">管理您的訂單和商品</p>
        {dashboardData?.restaurant && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>評分: {dashboardData.restaurant.rating.toFixed(1)} ⭐</span>
            <span>•</span>
            <span>最低訂購: {formatCurrency(dashboardData.restaurant.minOrder)}</span>
            <span>•</span>
            <span>營業時間: {dashboardData.restaurant.businessHours}</span>
            <span>•</span>
            <span className={dashboardData.restaurant.isOpen ? "text-green-600" : "text-red-600"}>
              {dashboardData.restaurant.isOpen ? "營業中" : "休息中"}
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border-brand-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-primary">今日訂單</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-primary">
                {dashboardData?.stats.todayOrders || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                較昨日 {formatPercentChange(dashboardData?.stats.orderChangePercent || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/5 border-brand-secondary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-secondary">今日營收</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-secondary">
                {formatCurrency(dashboardData?.stats.todayRevenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                較昨日 {formatPercentChange(dashboardData?.stats.revenueChangePercent || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 border-brand-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-accent">平均評分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-accent">
                {dashboardData?.stats.currentRating.toFixed(1) || "4.5"}
              </div>
              <p className="text-xs text-muted-foreground">
                較上週 {formatPercentChange(dashboardData?.stats.ratingChange || 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            待處理訂單
            {pendingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preparing">
            準備中
            {preparingOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {preparingOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pendingOrders.length > 0 ? (
            <div className="grid gap-4">
              {pendingOrders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={fetchDashboardData} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">目前沒有待處理訂單</h2>
              <p className="text-muted-foreground mb-4">新訂單將會顯示在這裡</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preparing" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : preparingOrders.length > 0 ? (
            <div className="grid gap-4">
              {preparingOrders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={fetchDashboardData} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">目前沒有準備中的訂單</h2>
              <p className="text-muted-foreground mb-4">接受的訂單將會顯示在這裡</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : completedOrders.length > 0 ? (
            <div className="grid gap-4">
              {completedOrders.map((order) => (
                <OrderCard key={order.id} order={order} onStatusChange={fetchDashboardData} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">目前沒有已完成訂單</h2>
              <p className="text-muted-foreground mb-4">完成的訂單將會顯示在這裡</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
