"use client"

import { useEffect, useRef } from "react"

interface DeliveryMapProps {
  status: string
}

export function DeliveryMap({ status }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = mapRef.current.clientWidth
    canvas.height = mapRef.current.clientHeight
    mapRef.current.innerHTML = ""
    mapRef.current.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 繪製地圖背景
    ctx.fillStyle = "#f3f4f6"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 繪製道路
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 8

    // 水平道路
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()

    // 垂直道路
    ctx.beginPath()
    ctx.moveTo(canvas.width / 3, 0)
    ctx.lineTo(canvas.width / 3, canvas.height)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo((canvas.width * 2) / 3, 0)
    ctx.lineTo((canvas.width * 2) / 3, canvas.height)
    ctx.stroke()

    // 繪製餐廳位置
    const restaurantX = canvas.width / 3
    const restaurantY = canvas.height / 4

    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(restaurantX, restaurantY, 10, 0, Math.PI * 2)
    ctx.fill()

    // 繪製客戶位置
    const customerX = (canvas.width * 2) / 3
    const customerY = (canvas.height * 3) / 4

    ctx.fillStyle = "#3b82f6"
    ctx.beginPath()
    ctx.arc(customerX, customerY, 10, 0, Math.PI * 2)
    ctx.fill()

    // 繪製外送員位置和路線
    let deliveryX, deliveryY

    if (status === "accepted" || status === "preparing") {
      // 外送員前往餐廳的路線
      deliveryX = canvas.width / 2
      deliveryY = canvas.height / 2

      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(deliveryX, deliveryY)
      ctx.lineTo(restaurantX, restaurantY)
      ctx.stroke()
    } else if (status === "picked" || status === "delivering") {
      // 外送員前往客戶的路線
      deliveryX = (restaurantX + customerX) / 2
      deliveryY = (restaurantY + customerY) / 2

      ctx.strokeStyle = "#10b981"
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(restaurantX, restaurantY)
      ctx.lineTo(deliveryX, deliveryY)
      ctx.lineTo(customerX, customerY)
      ctx.stroke()
    }

    // 繪製外送員
    if (deliveryX && deliveryY) {
      ctx.fillStyle = "#10b981"
      ctx.beginPath()
      ctx.arc(deliveryX, deliveryY, 8, 0, Math.PI * 2)
      ctx.fill()
    }

    // 添加標籤
    ctx.fillStyle = "#000000"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("餐廳", restaurantX, restaurantY - 20)
    ctx.fillText("客戶", customerX, customerY - 20)

    if (deliveryX && deliveryY) {
      ctx.fillText("外送員", deliveryX, deliveryY - 20)
    }
  }, [status, mapRef])

  return (
    <div className="relative">
      <div ref={mapRef} className="h-[400px] w-full rounded-md bg-muted"></div>
      <div className="absolute bottom-4 right-4 flex gap-2">
        <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-md text-xs">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <span>餐廳</span>
        </div>
        <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-md text-xs">
          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
          <span>客戶</span>
        </div>
        <div className="flex items-center gap-1 bg-white/80 px-2 py-1 rounded-md text-xs">
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
          <span>外送員</span>
        </div>
      </div>
    </div>
  )
}
