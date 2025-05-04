"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

// 模擬訂單數據
const orderHistory = [
  {
    id: "ORD-001",
    date: "2023-05-01",
    restaurant: "京華樓",
    items: ["北京烤鴨", "宮保雞丁", "蔥油餅"],
    total: 580,
    status: "completed",
  },
  {
    id: "ORD-002",
    date: "2023-04-25",
    restaurant: "藤井壽司",
    items: ["特上握壽司", "茶碗蒸"],
    total: 680,
    status: "completed",
  },
  {
    id: "ORD-003",
    date: "2023-04-20",
    restaurant: "美味漢堡",
    items: ["經典牛肉漢堡", "薯條", "可樂"],
    total: 220,
    status: "completed",
  },
  {
    id: "ORD-004",
    date: "2023-05-02",
    restaurant: "滿江紅川菜館",
    items: ["麻婆豆腐", "水煮魚", "回鍋肉"],
    total: 720,
    status: "processing",
  },
  {
    id: "ORD-005",
    date: "2023-05-03",
    restaurant: "泰饗樂",
    items: ["泰式酸辣湯", "綠咖哩雞", "泰式炒河粉"],
    total: 580,
    status: "processing",
  },
  {
    id: "ORD-006",
    date: "2023-04-15",
    restaurant: "米蘭披薩屋",
    items: ["瑪格麗特披薩", "夏威夷披薩"],
    total: 580,
    status: "cancelled",
  },
]

export default function OrderHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const router = useRouter()

  // 過濾訂單
  const filteredOrders = orderHistory.filter((order) => {
    // 根據標籤過濾
    if (activeTab === "processing" && order.status !== "processing") return false
    if (activeTab === "completed" && order.status !== "completed") return false
    if (activeTab === "cancelled" && order.status !== "cancelled") return false

    // 根據搜尋詞過濾
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.id.toLowerCase().includes(query) ||
        order.restaurant.toLowerCase().includes(query) ||
        order.items.some((item) => item.toLowerCase().includes(query))
      )
    }

    return true
  })

  // 獲取狀態標籤
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processing":
        return (
          <Badge variant="secondary" className="bg-brand-secondary/20 text-brand-secondary">
            <Clock className="mr-1 h-3 w-3" />
            處理中
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <CheckCircle className="mr-1 h-3 w-3" />
            已完成
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            <XCircle className="mr-1 h-3 w-3" />
            已取消
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertTriangle className="mr-1 h-3 w-3" />
            未知
          </Badge>
        )
    }
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
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 py-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center">
                        訂單 #{order.id}
                        <span className="mx-2 text-muted-foreground">|</span>
                        <span className="text-base font-normal">{order.date}</span>
                      </CardTitle>
                      {getStatusBadge(order.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="font-medium text-lg mb-1">{order.restaurant}</h3>
                        <p className="text-muted-foreground">
                          {order.items.join(", ")}
                          {order.items.length > 3 ? "..." : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-medium text-lg">${order.total}</div>
                          <div className="text-sm text-muted-foreground">{order.items.length} 件商品</div>
                        </div>
                        <Link href={`/user/orders/${order.id}`}>
                          <Button variant="outline" size="sm" className="whitespace-nowrap">
                            查看詳情
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
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
    </div>
  )
}
