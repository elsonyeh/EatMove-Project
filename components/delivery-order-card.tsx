"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface DeliveryOrderCardProps {
  order: any
}

export function DeliveryOrderCard({ order }: DeliveryOrderCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState(order.status)

  const handleAcceptOrder = () => {
    setStatus("accepted")

    toast({
      title: "訂單已接受",
      description: "您已接受訂單，請前往餐廳取餐",
    })

    router.push(`/delivery/orders/${order.id}`)
  }

  const handleRejectOrder = () => {
    setStatus("rejected")

    toast({
      title: "訂單已拒絕",
      description: "您已拒絕訂單",
    })
  }

  const handleViewOrder = () => {
    router.push(`/delivery/orders/${order.id}`)
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
                  status === "available"
                    ? "default"
                    : status === "accepted"
                      ? "secondary"
                      : status === "completed"
                        ? "outline"
                        : "destructive"
                }
              >
                {status === "available"
                  ? "可接單"
                  : status === "accepted"
                    ? "進行中"
                    : status === "completed"
                      ? "已完成"
                      : "已拒絕"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.restaurant} · 預計送達時間: {order.estimatedDeliveryTime}
            </p>
            <div className="flex items-start gap-1">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">{order.deliveryAddress}</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="text-lg font-bold">${order.deliveryFee}</div>
            <div className="text-sm text-muted-foreground">配送費</div>
            <div className="text-sm text-muted-foreground mt-1">距離: {order.distance}</div>
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
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2 p-6 pt-0">
        {status === "available" && (
          <>
            <Button variant="outline" onClick={handleRejectOrder}>
              拒絕訂單
            </Button>
            <Button onClick={handleAcceptOrder}>接受訂單</Button>
          </>
        )}

        {status === "accepted" && (
          <Button onClick={handleViewOrder}>
            <Navigation className="mr-2 h-4 w-4" />
            查看訂單
          </Button>
        )}

        {status === "completed" && (
          <Button variant="outline" onClick={handleViewOrder}>
            查看詳情
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
