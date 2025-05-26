"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, Phone, MapPin, Package, CheckCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Order {
    oid: number
    uid: number
    rid: number
    member_name: string
    member_phone: string
    restaurant_name: string
    restaurant_phone: string
    restaurant_address: string
    delivery_address: string
    total_amount: number
    delivery_fee: number
    status: string
    notes: string
    created_at: string
    estimated_delivery_time: string
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
    ready: { label: "待接單", color: "bg-green-500" },
    delivering: { label: "配送中", color: "bg-blue-500" },
    completed: { label: "已完成", color: "bg-gray-500" }
}

export default function DeliveryOrdersPage() {
    const [availableOrders, setAvailableOrders] = useState<Order[]>([])
    const [myOrders, setMyOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    // 獲取外送員ID（實際應該從登入狀態獲取）
    const deliverymanId = localStorage.getItem('deliverymanId') || '1'

    useEffect(() => {
        fetchOrders()
        // 每30秒刷新一次訂單
        const interval = setInterval(fetchOrders, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchOrders = async () => {
        try {
            // 獲取可接單的訂單（狀態為ready且沒有外送員）
            const availableResponse = await fetch('/api/orders?status=ready&available=true')
            const availableResult = await availableResponse.json()

            // 獲取我的訂單（已分配給我的訂單）
            const myResponse = await fetch(`/api/orders?did=${deliverymanId}`)
            const myResult = await myResponse.json()

            if (availableResult.success) {
                setAvailableOrders(availableResult.orders)
            }

            if (myResult.success) {
                setMyOrders(myResult.orders)
            }
        } catch (error) {
            console.error("獲取訂單失敗:", error)
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
            const response = await fetch(`/api/orders/${oid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'completed',
                    actualDeliveryTime: new Date().toISOString()
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

    const OrderCard = ({ order, showAcceptButton = false, showCompleteButton = false }: {
        order: Order,
        showAcceptButton?: boolean,
        showCompleteButton?: boolean
    }) => (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">訂單 #{order.oid}</CardTitle>
                    <Badge className={`${statusMap[order.status as keyof typeof statusMap]?.color} text-white`}>
                        {statusMap[order.status as keyof typeof statusMap]?.label}
                    </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(order.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>${order.total_amount}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium mb-2">取餐地點</h4>
                        <p className="text-sm font-medium">{order.restaurant_name}</p>
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{order.restaurant_address}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{order.restaurant_phone}</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">送餐地點</h4>
                        <p className="text-sm font-medium">{order.member_name}</p>
                        <div className="flex items-start gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span>{order.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <Phone className="h-4 w-4" />
                            <span>{order.member_phone}</span>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-medium mb-2">訂單內容</h4>
                    <div className="space-y-1">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                                <span>{item.menu_name} x{item.quantity}</span>
                                <span>${item.subtotal}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-semibold">
                            <span>總計</span>
                            <span>${order.total_amount}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>外送費</span>
                            <span>${order.delivery_fee}</span>
                        </div>
                    </div>
                </div>

                {order.notes && (
                    <div>
                        <h4 className="font-medium mb-1">備註</h4>
                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                )}

                <div className="pt-2">
                    {showAcceptButton && (
                        <Button
                            onClick={() => acceptOrder(order.oid)}
                            className="w-full"
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            接受訂單
                        </Button>
                    )}

                    {showCompleteButton && order.status === 'delivering' && (
                        <Button
                            onClick={() => completeDelivery(order.oid)}
                            className="w-full"
                        >
                            確認送達
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
                                <p className="text-muted-foreground">您目前沒有進行中的訂單</p>
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