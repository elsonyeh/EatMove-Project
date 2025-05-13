"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { OrderCard } from "@/components/order-card"
import { restaurantOrders } from "@/lib/data"
import { useRestaurantAuth } from "@/components/restaurant-auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function RestaurantDashboardPage() {
  const { account } = useRestaurantAuth()
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (account) {
      // 模擬加載數據
      setTimeout(() => {
        // 根據餐廳ID過濾訂單
        const filteredOrders = restaurantOrders.map((order) => ({
          ...order,
          restaurant: account.restaurantName,
        }))
        setOrders(filteredOrders)
        setLoading(false)
      }, 800)
    }
  }, [account])

  // 根據訂單狀態分類
  const pendingOrders = orders.filter((order) => order.status === "pending")
  const preparingOrders = orders.filter((order) => order.status === "preparing")
  const completedOrders = orders.filter((order) => order.status === "completed")

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{account?.restaurantName || "餐廳"} 管理中心</h1>
        <p className="text-muted-foreground">管理您的訂單和商品</p>
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
                {pendingOrders.length + preparingOrders.length + completedOrders.length}
              </div>
              <p className="text-xs text-muted-foreground">
                較昨日 <span className="text-green-500">+12.5%</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-brand-secondary/10 to-brand-secondary/5 border-brand-secondary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-secondary">今日營收</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-secondary">$1,254</div>
              <p className="text-xs text-muted-foreground">
                較昨日 <span className="text-green-500">+8.2%</span>
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-brand-accent/10 to-brand-accent/5 border-brand-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-accent">平均評分</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-accent">4.8</div>
              <p className="text-xs text-muted-foreground">
                較上週 <span className="text-green-500">+0.2</span>
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
                <OrderCard key={order.id} order={order} />
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
                <OrderCard key={order.id} order={order} />
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
                <OrderCard key={order.id} order={order} />
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
