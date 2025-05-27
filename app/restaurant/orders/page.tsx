"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Phone, MapPin, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Order {
    oid: number
    uid: number
    member_name: string
    member_phone: string
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
    pending: { label: "待確認", color: "bg-yellow-500" },
    accepted: { label: "已接受", color: "bg-blue-500" },
    preparing: { label: "準備中", color: "bg-orange-500" },
    ready: { label: "已完成", color: "bg-green-500" },
    delivering: { label: "外送中", color: "bg-purple-500" },
    completed: { label: "已送達", color: "bg-gray-500" },
    cancelled: { label: "已取消", color: "bg-red-500" }
}

export default function RestaurantOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [rejectReason, setRejectReason] = useState("")
    const [restaurantId, setRestaurantId] = useState<string>("")
    const { toast } = useToast()

    // 獲取餐廳ID
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // 從 restaurantAccount 獲取餐廳資訊
            const restaurantAccountStr = localStorage.getItem("restaurantAccount")
            if (restaurantAccountStr) {
                try {
                    const restaurantAccount = JSON.parse(restaurantAccountStr)
                    const id = restaurantAccount.restaurantId?.toString() || '1'
                    setRestaurantId(id)
                } catch (error) {
                    console.error("解析餐廳帳號資料失敗:", error)
                    setRestaurantId('1')
                }
            } else {
                setRestaurantId('1')
            }
        }
    }, [])

    useEffect(() => {
        if (restaurantId) {
            fetchOrders()
            // 每30秒刷新一次訂單
            const interval = setInterval(fetchOrders, 30000)
            return () => clearInterval(interval)
        }
    }, [restaurantId])

    const fetchOrders = async () => {
        try {
            const response = await fetch(`/api/orders?rid=${restaurantId}`)
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

    const updateOrderStatus = async (oid: number, status: string, notes?: string) => {
        try {
            const response = await fetch(`/api/orders/${oid}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, notes })
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "訂單狀態更新成功",
                    description: `訂單 #${oid} 已更新為 ${statusMap[status as keyof typeof statusMap]?.label}`
                })
                fetchOrders() // 重新獲取訂單
                setSelectedOrder(null)
                setRejectReason("")
            } else {
                toast({
                    title: "更新失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("更新訂單狀態失敗:", error)
            toast({
                title: "更新失敗",
                description: "網路錯誤，請稍後再試",
                variant: "destructive"
            })
        }
    }

    const handleAcceptOrder = (order: Order) => {
        updateOrderStatus(order.oid, 'accepted')
    }

    const handleRejectOrder = (order: Order) => {
        if (!rejectReason.trim()) {
            toast({
                title: "請輸入拒絕原因",
                variant: "destructive"
            })
            return
        }
        updateOrderStatus(order.oid, 'cancelled', rejectReason)
    }

    const handleStartPreparing = (order: Order) => {
        updateOrderStatus(order.oid, 'preparing')
    }

    const handleMarkReady = (order: Order) => {
        updateOrderStatus(order.oid, 'ready')
    }

    const formatTime = (timeString: string) => {
        return new Date(timeString).toLocaleString('zh-TW')
    }

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
                <h1 className="text-2xl font-bold">訂單管理</h1>
                <Button onClick={fetchOrders} variant="outline">
                    刷新訂單
                </Button>
            </div>

            {orders.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">目前沒有訂單</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.oid} className="overflow-hidden">
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
                                        <Phone className="h-4 w-4" />
                                        <span>{order.member_phone}</span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">顧客資訊</h4>
                                    <p className="text-sm">{order.member_name}</p>
                                    <div className="flex items-start gap-1 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{order.delivery_address}</span>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">訂單內容</h4>
                                    <div className="space-y-2">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-start text-sm">
                                                <div className="flex-1">
                                                    <span className="font-medium">{item.menu_name}</span>
                                                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                                                    {item.special_instructions && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            備註: {item.special_instructions}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="font-medium">${item.subtotal}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-2 mt-2">
                                        <div className="flex justify-between text-sm">
                                            <span>小計</span>
                                            <span>${order.total_amount - order.delivery_fee}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>外送費</span>
                                            <span>${order.delivery_fee}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span>總計</span>
                                            <span>${order.total_amount}</span>
                                        </div>
                                    </div>
                                </div>

                                {order.notes && (
                                    <div>
                                        <h4 className="font-medium mb-1">訂單備註</h4>
                                        <p className="text-sm text-muted-foreground">{order.notes}</p>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    {order.status === 'pending' && (
                                        <>
                                            <Button
                                                onClick={() => handleAcceptOrder(order)}
                                                className="flex-1"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                接受訂單
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={() => setSelectedOrder(order)}
                                                className="flex-1"
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                拒絕訂單
                                            </Button>
                                        </>
                                    )}

                                    {order.status === 'accepted' && (
                                        <Button
                                            onClick={() => handleStartPreparing(order)}
                                            className="w-full"
                                        >
                                            開始準備
                                        </Button>
                                    )}

                                    {order.status === 'preparing' && (
                                        <Button
                                            onClick={() => handleMarkReady(order)}
                                            className="w-full"
                                        >
                                            標記為已完成
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* 拒絕訂單彈窗 */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>拒絕訂單 #{selectedOrder.oid}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">拒絕原因</label>
                                <Textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="請輸入拒絕原因..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedOrder(null)
                                        setRejectReason("")
                                    }}
                                    className="flex-1"
                                >
                                    取消
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleRejectOrder(selectedOrder)}
                                    className="flex-1"
                                >
                                    確認拒絕
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
} 