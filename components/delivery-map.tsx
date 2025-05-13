"use client"
import Image from "next/image"

interface DeliveryMapProps {
  status: string
}

export function DeliveryMap({ status }: DeliveryMapProps) {
  // 根據訂單狀態選擇不同的地圖圖片
  const mapImage =
    status === "preparing" || status === "accepted"
      ? "/placeholder.svg?height=400&width=600&text=前往餐廳路線"
      : "/placeholder.svg?height=400&width=600&text=前往客戶路線"

  return (
    <div className="relative">
      <div className="h-[400px] w-full rounded-md bg-muted overflow-hidden">
        <Image src={mapImage || "/placeholder.svg"} alt="配送地圖" fill className="object-cover" />
      </div>
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
