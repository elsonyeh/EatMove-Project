"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from '../../../components/ui/switch'
import { Label } from "@/components/ui/label"
import { DeliveryOrderCard } from "@/components/delivery-order-card"
import { useToast } from "@/components/ui/use-toast"
import { deliveryOrders } from "@/lib/data"

export default function DeliveryDashboardPage() {
  const { toast } = useToast()
  const [isOnline, setIsOnline] = useState(true)

  // 根據訂單狀態分類
  const availableOrders = deliveryOrders.filter((order) => order.status === "available")
  const acceptedOrders = deliveryOrders.filter((order) => order.status === "accepted")
  const completedOrders = deliveryOrders.filter((order) => order.status === "completed")

  const handleStatusChange = (checked: boolean) => {
    setIsOnline(checked)

    toast({
      title: checked ? "您已上線" : "您已下線",
      description: checked ? "您現在可以接收訂單" : "您將不會收到新訂單",
    })
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">外送員中心</h1>
        <p className="text-muted-foreground">管理您的訂單和狀態</p>
      </div>

      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">工作狀態</h2>
                <p className="text-muted-foreground">設定您的上線狀態以接收訂單</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="online-status" checked={isOnline} onCheckedChange={handleStatusChange} />
                <Label htmlFor="online-status">{isOnline ? "上線中" : "下線中"}</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日訂單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedOrders.length + completedOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              較昨日 <span className="text-green-500">+2</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$320</div>
            <p className="text-xs text-muted-foreground">
              較昨日 <span className="text-green-500">+$40</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均評分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              較上週 <span className="text-green-500">+0.1</span>
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="available">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">
            可接訂單
            {availableOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {availableOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            進行中
            {acceptedOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {acceptedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">已完成</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {isOnline ? (
            availableOrders.length > 0 ? (
              <div className="grid gap-4">
                {availableOrders.map((order) => (
                  <DeliveryOrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium mb-2">目前沒有可接的訂單</h2>
                <p className="text-muted-foreground mb-4">新訂單將會顯示在這裡</p>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">您目前處於下線狀態</h2>
              <p className="text-muted-foreground mb-4">請切換為上線狀態以接收訂單</p>
              <Button onClick={() => setIsOnline(true)}>上線接單</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {acceptedOrders.length > 0 ? (
            <div className="grid gap-4">
              {acceptedOrders.map((order) => (
                <DeliveryOrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">目前沒有進行中的訂單</h2>
              <p className="text-muted-foreground mb-4">接受的訂單將會顯示在這裡</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedOrders.length > 0 ? (
            <div className="grid gap-4">
              {completedOrders.map((order) => (
                <DeliveryOrderCard key={order.id} order={order} />
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
