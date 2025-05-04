"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface OrderCardProps {
  order: any
}

export function OrderCard({ order }: OrderCardProps) {
  const { toast } = useToast()
  const [status, setStatus] = useState(order.status)

  const handleAcceptOrder = () => {
    setStatus("preparing")

    toast({
      title: "訂單已接受",
      description: "您已接受訂單，請開始準備餐點",
    })
  }

  const handleRejectOrder = () => {
    setStatus("rejected")

    toast({
      title: "訂單已拒絕",
      description: "您已拒絕訂單",
    })
  }

  const handleCompleteOrder = () => {
    setStatus("completed")

    toast({
      title: "訂單已完成",
      description: "訂單已準備完成，等待外送員取餐",
    })
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">訂單 #{order.id}</h3>
              <Badge
                variant={
                  status === "pending"
                    ? "default"
                    : status === "preparing"
                      ? "secondary"
                      : status === "completed"
                        ? "success"
                        : "destructive"
                }
              >
                {status === "pending"
                  ? "待處理"
                  : status === "preparing"
                    ? "準備中"
                    : status === "completed"
                      ? "已完成"
                      : "已拒絕"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customer} · {order.time}
            </p>
            <div className="flex items-center gap-2">
              <div className="text-sm font-medium">配送地址:</div>
              <div className="text-sm text-muted-foreground">{order.deliveryAddress}</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-lg font-bold">${order.total}</div>
            <div className="text-sm text-muted-foreground">{order.items.length} 件商品</div>
          </div>
        </div>

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
                </div>
                <div className="text-sm font-medium">${item.price * item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 p-6 pt-0">
        {status === "pending" && (
          <>
            <Button variant="outline" onClick={handleRejectOrder}>
              拒絕訂單
            </Button>
            <Button onClick={handleAcceptOrder}>接受訂單</Button>
          </>
        )}

        {status === "preparing" && <Button onClick={handleCompleteOrder}>完成準備</Button>}

        {status === "completed" && (
          <Button variant="outline" disabled>
            等待外送員取餐
          </Button>
        )}

        {status === "rejected" && (
          <Button variant="outline" disabled>
            已拒絕
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
