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

interface Order {
  oid: number
  rid: number
  restaurant_name: string
  delivery_address: string
  total_amount: number
  delivery_fee: number
  status: string
  created_at: string
  estimated_delivery_time: string
  items: Array<{
    mid: number
    menu_name: string
    quantity: number
    unit_price: number
  }>
}

interface DeliveryStats {
  todayOrders: number
  todayEarnings: number
  averageRating: number
  completedOrders: number
}

export default function DeliveryDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [deliverymanData, setDeliverymanData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [completedOrders, setCompletedOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<DeliveryStats>({
    todayOrders: 0,
    todayEarnings: 0,
    averageRating: 0,
    completedOrders: 0
  })
  const [deliverymanId, setDeliverymanId] = useState<string>("")

  // 獲取外送員ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const id = localStorage.getItem('userId')
      console.log('🔍 從localStorage獲取userId:', id)

      if (id) {
        setDeliverymanId(id)
      } else {
        console.error('❌ localStorage中沒有userId，請先登入')
        toast({
          title: "未登入",
          description: "請先登入外送員帳號",
          variant: "destructive",
        })
        router.push("/login")
      }
    }
  }, [])

  useEffect(() => {
    if (deliverymanId) {
      fetchDeliverymanData()
      fetchOrders()
      fetchStats()
      // 每30秒刷新一次訂單
      const interval = setInterval(() => {
        fetchOrders()
        fetchStats()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [deliverymanId])

  const fetchDeliverymanData = async () => {
    try {
      console.log('🔍 開始獲取外送員資料，deliverymanId:', deliverymanId)
      const url = `/api/delivery/profile?did=${deliverymanId}`
      console.log('📡 API URL:', url)

      const response = await fetch(url)
      console.log('📥 API Response status:', response.status)
      console.log('📥 API Response ok:', response.ok)

      const data = await response.json()
      console.log('📦 API Response data:', data)

      if (data.success) {
        console.log('✅ 外送員資料獲取成功:', data.data)
        setDeliverymanData(data.data)
        setIsOnline(data.data.status === 'online')
      } else {
        console.error('❌ API返回失敗:', data.message)
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

  const fetchOrders = async () => {
    try {
      // 獲取可接單的訂單（狀態為ready且沒有外送員）
      const availableResponse = await fetch('/api/orders?status=ready&available=true')
      const availableResult = await availableResponse.json()

      // 獲取我的訂單（已分配給我的訂單）
      const myResponse = await fetch(`/api/orders?did=${deliverymanId}`)
      const myResult = await myResponse.json()

      if (availableResult.success) {
        setAvailableOrders(availableResult.orders || [])
      }

      if (myResult.success) {
        const orders = myResult.orders || []
        setMyOrders(orders.filter((order: Order) => order.status === 'delivering'))
        setCompletedOrders(orders.filter((order: Order) => order.status === 'completed'))
      }
    } catch (error) {
      console.error("獲取訂單失敗:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/delivery/stats?did=${deliverymanId}`)
      const result = await response.json()

      if (result.success) {
        setStats(result.stats)
      }
    } catch (error) {
      console.error("獲取統計資料失敗:", error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("userId")
    router.push("/login")
    toast({
      title: "已登出",
      description: "您已成功登出系統",
    })
  }

  const handleStatusChange = async (checked: boolean) => {
    try {
      const response = await fetch('/api/delivery/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          did: deliverymanId,
          status: checked ? 'online' : 'offline'
        })
      })

      const result = await response.json()

      if (result.success) {
        setIsOnline(checked)
        toast({
          title: checked ? "您已上線" : "您已下線",
          description: checked ? "您現在可以接收訂單" : "您將不會收到新訂單",
        })
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.error("更新狀態失敗:", error)
      toast({
        title: "錯誤",
        description: "更新狀態失敗",
        variant: "destructive",
      })
    }
  }

  const acceptOrder = async (oid: number) => {
    try {
      const response = await fetch('/api/deliverymen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          did: parseInt(deliverymanId),
          oid
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "接單成功",
          description: `訂單 #${oid} 已接單，請前往餐廳取餐`
        })
        fetchOrders() // 重新獲取訂單
      } else {
        toast({
          title: "接單失敗",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("接單失敗:", error)
      toast({
        title: "接單失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">載入中...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">外送員儀表板</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="online-status"
              checked={isOnline}
              onCheckedChange={handleStatusChange}
            />
            <Label htmlFor="online-status">
              {isOnline ? "線上" : "離線"}
            </Label>
          </div>
          <Button onClick={handleLogout} variant="outline">
            登出
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
                <Badge variant={isOnline ? "default" : "secondary"}>
                  {isOnline ? '線上' : '離線'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日訂單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              已完成訂單數量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.todayEarnings)}</div>
            <p className="text-xs text-muted-foreground">
              今日配送費收入
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">平均評分</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              基於 {stats.completedOrders} 個評分
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
            {myOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {myOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            已完成
            {completedOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedOrders.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-6">
          {isOnline ? (
            availableOrders.length > 0 ? (
              <div className="grid gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.oid} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg">訂單 #{order.oid}</h3>
                          <p className="text-muted-foreground">{order.restaurant_name}</p>
                          <p className="text-sm text-muted-foreground">{formatTime(order.created_at)}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{formatCurrency(order.delivery_fee)}</div>
                          <div className="text-sm text-muted-foreground">配送費</div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div>
                          <span className="font-medium">送達地址：</span>
                          <span className="text-sm">{order.delivery_address}</span>
                        </div>
                        <div>
                          <span className="font-medium">預計送達：</span>
                          <span className="text-sm">{formatTime(order.estimated_delivery_time)}</span>
                        </div>
                        <div>
                          <span className="font-medium">訂單內容：</span>
                          <span className="text-sm">
                            {order.items.map(item => `${item.menu_name} x${item.quantity}`).join(', ')}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => acceptOrder(order.oid)}
                        className="w-full"
                      >
                        接受訂單
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-medium mb-2">目前沒有可接的訂單</h2>
                <p className="text-muted-foreground mb-4">新訂單將會顯示在這裡</p>
                <Button onClick={fetchOrders} variant="outline">刷新訂單</Button>
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium mb-2">您目前處於下線狀態</h2>
              <p className="text-muted-foreground mb-4">請切換為上線狀態以接收訂單</p>
              <Button onClick={() => handleStatusChange(true)}>上線接單</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {myOrders.length > 0 ? (
            <div className="grid gap-4">
              {myOrders.map((order) => (
                <Card key={order.oid} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">訂單 #{order.oid}</h3>
                        <p className="text-muted-foreground">{order.restaurant_name}</p>
                        <Badge variant="secondary">配送中</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(order.delivery_fee)}</div>
                        <div className="text-sm text-muted-foreground">配送費</div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div>
                        <span className="font-medium">送達地址：</span>
                        <span className="text-sm">{order.delivery_address}</span>
                      </div>
                      <div>
                        <span className="font-medium">訂單內容：</span>
                        <span className="text-sm">
                          {order.items.map(item => `${item.menu_name} x${item.quantity}`).join(', ')}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={() => router.push(`/delivery/orders/${order.oid}`)}
                      className="w-full"
                      variant="outline"
                    >
                      查看詳情
                    </Button>
                  </CardContent>
                </Card>
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
                <Card key={order.oid} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg">訂單 #{order.oid}</h3>
                        <p className="text-muted-foreground">{order.restaurant_name}</p>
                        <Badge variant="outline">已完成</Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(order.delivery_fee)}</div>
                        <div className="text-sm text-muted-foreground">配送費</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="font-medium">送達地址：</span>
                        <span className="text-sm">{order.delivery_address}</span>
                      </div>
                      <div>
                        <span className="font-medium">完成時間：</span>
                        <span className="text-sm">{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
