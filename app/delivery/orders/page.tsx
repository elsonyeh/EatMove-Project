"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MapPin, Package } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Order {
    oid: number
    rid: number
    restaurant_name: string
    restaurant_address: string
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
        subtotal: number
    }>
}

const statusMap = {
    preparing: { label: "準備中", color: "bg-orange-500" },
    ready: { label: "待接單", color: "bg-green-500" },
    delivering: { label: "配送中", color: "bg-blue-500" },
    completed: { label: "已完成", color: "bg-gray-500" }
}

export default function DeliveryOrdersPage() {
    const [availableOrders, setAvailableOrders] = useState<Order[]>([])
    const [myOrders, setMyOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [deliverymanId, setDeliverymanId] = useState<string>("")
    const { toast } = useToast()
    const router = useRouter()

    // 獲取外送員ID
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const id = localStorage.getItem('userId') || '1'
            setDeliverymanId(id)
        }
    }, [])

    useEffect(() => {
        if (deliverymanId) {
            fetchOrders()
            // 每30秒刷新一次訂單
            const interval = setInterval(fetchOrders, 30000)
            return () => clearInterval(interval)
        }
    }, [deliverymanId])

    const fetchOrders = async () => {
        try {
            console.log("🔄 正在獲取外送員訂單，外送員ID:", deliverymanId)

            // 獲取可接單的訂單（狀態為preparing或ready且沒有外送員）
            const availableResponse = await fetch('/api/orders?available=true')
            const availableResult = await availableResponse.json()

            console.log("📋 可接單訂單查詢結果:", availableResult)

            // 獲取我的訂單（已分配給我的訂單）
            const myResponse = await fetch(`/api/orders?did=${deliverymanId}`)
            const myResult = await myResponse.json()

            console.log("📋 我的訂單查詢結果:", myResult)

            if (availableResult.success) {
                setAvailableOrders(availableResult.orders || [])
                console.log("✅ 設置可接單訂單數量:", availableResult.orders?.length || 0)
            } else {
                console.error("❌ 獲取可接單訂單失敗:", availableResult.message)
                setAvailableOrders([])
            }

            if (myResult.success) {
                setMyOrders(myResult.orders || [])
                console.log("✅ 設置我的訂單數量:", myResult.orders?.length || 0)
            } else {
                console.error("❌ 獲取我的訂單失敗:", myResult.message)
                setMyOrders([])
            }
        } catch (error) {
            console.error("❌ 獲取訂單失敗:", error)
            setAvailableOrders([])
            setMyOrders([])

            toast({
                title: "獲取訂單失敗",
                description: "無法連接到服務器，請檢查網絡連接",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
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

    const completeDelivery = async (oid: number) => {
        try {
            const response = await fetch(`/api/orders/${oid}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'completed'
                })
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "送達確認成功",
                    description: `訂單 #${oid} 已完成配送`
                })
                fetchOrders() // 重新獲取訂單
            } else {
                toast({
                    title: "確認失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("確認送達失敗:", error)
            toast({
                title: "確認失敗",
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

    const OrderCard = ({ order, showAcceptButton = false, showCompleteButton = false }: {
        order: Order
        showAcceptButton?: boolean
        showCompleteButton?: boolean
    }) => (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-lg">訂單 #{order.oid}</h3>
                        <p className="text-muted-foreground">{order.restaurant_name}</p>
                        <p className="text-sm text-muted-foreground">{formatTime(order.created_at)}</p>
                        <Badge className={`${statusMap[order.status as keyof typeof statusMap]?.color} text-white mt-2`}>
                            {statusMap[order.status as keyof typeof statusMap]?.label}
                        </Badge>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-lg">{formatCurrency(order.delivery_fee)}</div>
                        <div className="text-sm text-muted-foreground">配送費</div>
                        <div className="text-sm text-muted-foreground mt-1">
                            總額: {formatCurrency(order.total_amount)}
                        </div>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-2">
                        <Package className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                            <div className="font-medium">餐廳地址</div>
                            <div className="text-sm text-muted-foreground">{order.restaurant_address || '請聯繫餐廳確認地址'}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                            <div className="font-medium">送達地址</div>
                            <div className="text-sm text-muted-foreground">{order.delivery_address}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                            <div className="font-medium">預計送達時間</div>
                            <div className="text-sm text-muted-foreground">{formatTime(order.estimated_delivery_time)}</div>
                        </div>
                    </div>

                    <div>
                        <div className="font-medium mb-2">訂單內容</div>
                        <div className="space-y-1">
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                    <span>{item.menu_name} x{item.quantity}</span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    {showAcceptButton && (
                        <>
                            {order.status === 'preparing' && (
                                <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-md">
                                    <p className="text-sm text-orange-700">
                                        🍳 餐廳正在準備中，您可以先接單並前往餐廳
                                    </p>
                                </div>
                            )}
                            {order.status === 'ready' && (
                                <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                                    <p className="text-sm text-green-700">
                                        ✅ 餐點已準備完成，可立即取餐
                                    </p>
                                </div>
                            )}
                            <Button
                                onClick={() => acceptOrder(order.oid)}
                                className="w-full"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                接受訂單
                            </Button>
                        </>
                    )}

                    {showCompleteButton && order.status === 'delivering' && (
                        <Button
                            onClick={() => completeDelivery(order.oid)}
                            className="w-full"
                        >
                            確認送達
                        </Button>
                    )}

                    {order.status === 'delivering' && !showCompleteButton && (
                        <Button
                            onClick={() => router.push(`/delivery/orders/${order.oid}`)}
                            className="w-full"
                            variant="outline"
                        >
                            查看詳情
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                <span className="ml-2">載入中...</span>
            </div>
        )
    }

    return (
        <div className="container py-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">外送訂單</h1>
                <Button onClick={fetchOrders} variant="outline">
                    刷新訂單
                </Button>
            </div>

            <Tabs defaultValue="available" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="available">
                        可接訂單 ({availableOrders.length})
                    </TabsTrigger>
                    <TabsTrigger value="my-orders">
                        我的訂單 ({myOrders.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="available" className="mt-6">
                    {availableOrders.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">目前沒有可接的訂單</p>
                                <Button onClick={fetchOrders} variant="outline" className="mt-4">
                                    重新整理
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {availableOrders.map((order) => (
                                <OrderCard
                                    key={order.oid}
                                    order={order}
                                    showAcceptButton={true}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="my-orders" className="mt-6">
                    {myOrders.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <p className="text-muted-foreground">目前沒有進行中的訂單</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {myOrders.map((order) => (
                                <OrderCard
                                    key={order.oid}
                                    order={order}
                                    showCompleteButton={true}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
} 