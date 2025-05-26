"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { DeliveryOrderCard } from "@/components/delivery-order-card"
import { useToast } from "@/components/ui/use-toast"
import { deliveryOrders } from "@/lib/data"

export default function DeliveryDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [deliverymanData, setDeliverymanData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)

  // 根據訂單狀態分類
  const availableOrders = deliveryOrders.filter((order) => order.status === "available")
  const acceptedOrders = deliveryOrders.filter((order) => order.status === "accepted")
  const completedOrders = deliveryOrders.filter((order) => order.status === "completed")

  useEffect(() => {
    const fetchDeliverymanData = async () => {
      try {
        const did = localStorage.getItem("userId")
        if (!did) {
          toast({
            title: "請先登入",
            description: "您需要登入才能訪問此頁面",
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        const response = await fetch(`/api/delivery/profile?did=${did}`)
        const data = await response.json()

        if (data.success) {
          setDeliverymanData(data.data)
        } else {
          throw new Error(data.message)
        }
      } catch (error) {
        console.error("獲取外送員資料失敗:", error)
        toast({
          title: "錯誤",
          description: "獲取外送員資料失敗",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeliverymanData()
  }, [router, toast])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    router.push("/login")
    toast({
      title: "已登出",
      description: "您已成功登出系統",
    })
  }

  const handleStatusChange = (checked: boolean) => {
    setIsOnline(checked)

    toast({
      title: checked ? "您已上線" : "您已下線",
      description: checked ? "您現在可以接收訂單" : "您將不會收到新訂單",
    })
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">外送員儀表板</h1>
        <Button onClick={handleLogout} variant="outline">
          登出
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>個人資料</CardTitle>
            <CardDescription>您的基本資訊</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">姓名：</span>
                {deliverymanData?.dname}
              </div>
              <div>
                <span className="font-semibold">電子郵件：</span>
                {deliverymanData?.demail}
              </div>
              <div>
                <span className="font-semibold">電話：</span>
                {deliverymanData?.dphonenumber}
              </div>
              <div>
                <span className="font-semibold">狀態：</span>
                {deliverymanData?.status === 'online' ? '線上' : '離線'}
              </div>
            </div>
          </CardContent>
        </Card>

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
