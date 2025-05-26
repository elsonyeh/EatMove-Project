"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface OrderCardProps {
  order: {
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
  onStatusChange?: () => void
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState(order.status)
  const [isUpdating, setIsUpdating] = useState(false)

  const updateOrderStatus = async (newStatus: string) => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        setStatus(newStatus)
        onStatusChange?.()

        const statusMessages = {
          preparing: "訂單已接受，請開始準備餐點",
          completed: "訂單已準備完成，等待外送員取餐",
          cancelled: "訂單已取消"
        }

        toast({
          title: "狀態更新成功",
          description: statusMessages[newStatus as keyof typeof statusMessages] || "訂單狀態已更新",
        })
      } else {
        throw new Error(result.message || "更新失敗")
      }
    } catch (error) {
      console.error("更新訂單狀態失敗:", error)
      toast({
        title: "更新失敗",
        description: "無法更新訂單狀態，請稍後再試",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAcceptOrder = () => updateOrderStatus("preparing")
  const handleRejectOrder = () => updateOrderStatus("cancelled")
  const handleCompleteOrder = () => updateOrderStatus("completed")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "default" as const, label: "待處理" },
      preparing: { variant: "secondary" as const, label: "準備中" },
      ready: { variant: "outline" as const, label: "待取餐" },
      delivering: { variant: "outline" as const, label: "外送中" },
      completed: { variant: "default" as const, label: "已完成" },
      cancelled: { variant: "destructive" as const, label: "已取消" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{order.orderNumber}</h3>
              {getStatusBadge(status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customerName} · {formatTime(order.orderTime)}
            </p>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">配送地址:</div>
              <div className="text-sm text-muted-foreground">{order.customerAddress}</div>
            </div>
            {order.customerPhone && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">聯絡電話:</div>
                <div className="text-sm text-muted-foreground">{order.customerPhone}</div>
              </div>
            )}
            {order.notes && (
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium">備註:</div>
                <div className="text-sm text-muted-foreground">{order.notes}</div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end">
            <div className="text-lg font-bold">{formatCurrency(order.total)}</div>
            <div className="text-sm text-muted-foreground">
              {order.items.length > 0 ? `${order.items.length} 件商品` : "查看詳細內容"}
            </div>
            {order.deliveryFee > 0 && (
              <div className="text-xs text-muted-foreground">
                外送費: {formatCurrency(order.deliveryFee)}
              </div>
            )}
          </div>
        </div>

        {order.items.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">訂單內容:</h4>
            <div className="space-y-2">
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md">
                    <Image
                      src={item.image || "/placeholder.svg?height=40&width=40"}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">x{item.quantity}</div>
                    {item.specialInstructions && (
                      <div className="text-xs text-blue-600">備註: {item.specialInstructions}</div>
                    )}
                  </div>
                  <div className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-end gap-2 p-6 pt-0">
        {status === "pending" && (
          <>
            <Button
              variant="outline"
              onClick={handleRejectOrder}
              disabled={isUpdating}
            >
              拒絕訂單
            </Button>
            <Button
              onClick={handleAcceptOrder}
              disabled={isUpdating}
            >
              {isUpdating ? "處理中..." : "接受訂單"}
            </Button>
          </>
        )}

        {status === "preparing" && (
          <Button
            onClick={handleCompleteOrder}
            disabled={isUpdating}
          >
            {isUpdating ? "處理中..." : "完成準備"}
          </Button>
        )}

        {status === "ready" && (
          <Button variant="outline" disabled>
            等待外送員取餐
          </Button>
        )}

        {status === "delivering" && (
          <Button variant="outline" disabled>
            外送中
          </Button>
        )}

        {status === "completed" && (
          <Button variant="outline" disabled>
            已完成
          </Button>
        )}

        {status === "cancelled" && (
          <Button variant="outline" disabled>
            已取消
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
