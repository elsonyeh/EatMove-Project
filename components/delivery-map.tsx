"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Navigation, Truck, Clock, Phone } from "lucide-react"

interface DeliveryMapProps {
  status: string
  restaurantAddress?: string
  deliveryAddress?: string
  deliverymanName?: string
  deliverymanPhone?: string
  estimatedTime?: string
}

interface Location {
  lat: number
  lng: number
  name: string
  type: 'restaurant' | 'customer' | 'delivery'
}

export function DeliveryMap({
  status,
  restaurantAddress = "台北市大安區忠孝東路四段101號",
  deliveryAddress = "台北市信義區信義路五段7號",
  deliverymanName,
  deliverymanPhone,
  estimatedTime
}: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)

  // 模擬的位置資料（實際應用中應該從API獲取）
  const locations: Location[] = [
    {
      lat: 25.0418,
      lng: 121.5654,
      name: restaurantAddress,
      type: 'restaurant'
    },
    {
      lat: 25.0330,
      lng: 121.5654,
      name: deliveryAddress,
      type: 'customer'
    }
  ]

  // 模擬外送員位置（實際應用中應該從GPS獲取）
  const [deliveryLocation, setDeliveryLocation] = useState<Location>({
    lat: 25.0374,
    lng: 121.5654,
    name: "外送員位置",
    type: 'delivery'
  })

  useEffect(() => {
    // 模擬外送員移動
    if (status === "delivering") {
      const interval = setInterval(() => {
        setDeliveryLocation(prev => ({
          ...prev,
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001
        }))
      }, 5000) // 每5秒更新一次位置

      return () => clearInterval(interval)
    }
  }, [status])

  useEffect(() => {
    // 模擬地圖載入
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const getStatusMessage = () => {
    switch (status) {
      case "pending":
        return "等待餐廳確認訂單"
      case "accepted":
      case "preparing":
        return "餐廳正在準備您的餐點"
      case "ready":
        return "餐點已準備完成，等待外送員取餐"
      case "delivering":
        return "外送員正在前往您的位置"
      case "completed":
        return "訂單已送達"
      default:
        return "訂單處理中"
    }
  }

  const getMapContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">載入地圖中...</span>
        </div>
      )
    }

    if (mapError) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">地圖載入失敗</p>
            <p className="text-sm text-gray-400">{mapError}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="relative h-full bg-gradient-to-br from-blue-50 to-green-50">
        {/* 簡化的地圖視覺化 */}
        <div className="absolute inset-0 p-4">
          {/* 道路網格 */}
          <svg className="absolute inset-0 w-full h-full opacity-20">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* 餐廳位置 */}
          <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                餐廳
              </div>
            </div>
          </div>

          {/* 客戶位置 */}
          <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
            <div className="relative">
              <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                您的位置
              </div>
            </div>
          </div>

          {/* 外送員位置（僅在配送中顯示） */}
          {status === "delivering" && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-8 h-8 bg-green-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <Truck className="h-4 w-4 text-white" />
                </div>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white px-2 py-1 rounded shadow text-xs whitespace-nowrap">
                  外送員
                </div>
                {/* 移動軌跡 */}
                <div className="absolute inset-0 w-8 h-8 bg-green-500 rounded-full animate-ping opacity-30"></div>
              </div>
            </div>
          )}

          {/* 路線指示 */}
          {(status === "delivering" || status === "ready") && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d="M 25% 25% Q 50% 10% 75% 75%"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="10,5"
                fill="none"
                className="animate-pulse"
              />
            </svg>
          )}
        </div>

        {/* 狀態指示器 */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status === "delivering" ? "bg-green-500 animate-pulse" :
                status === "completed" ? "bg-blue-500" : "bg-yellow-500"
              }`}></div>
            <span className="text-sm font-medium">{getStatusMessage()}</span>
          </div>
          {estimatedTime && status === "delivering" && (
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              <span>預計 {estimatedTime} 送達</span>
            </div>
          )}
        </div>

        {/* 外送員資訊（僅在配送中顯示） */}
        {status === "delivering" && deliverymanName && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {deliverymanName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{deliverymanName}</p>
                {deliverymanPhone && (
                  <p className="text-xs text-gray-600">{deliverymanPhone}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 控制按鈕 */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button
            size="sm"
            className="bg-white text-gray-700 hover:bg-gray-50 shadow-lg"
            onClick={() => {
              // 實際應用中應該開啟真實的導航應用
              window.open(`https://www.google.com/maps/dir/${encodeURIComponent(restaurantAddress)}/${encodeURIComponent(deliveryAddress)}`, '_blank')
            }}
          >
            <Navigation className="h-4 w-4 mr-1" />
            導航
          </Button>

          {deliverymanPhone && status === "delivering" && (
            <Button
              size="sm"
              variant="outline"
              className="bg-white shadow-lg"
              onClick={() => {
                window.open(`tel:${deliverymanPhone}`, '_self')
              }}
            >
              <Phone className="h-4 w-4 mr-1" />
              致電
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="h-[400px] w-full relative">
          {getMapContent()}
        </div>
      </CardContent>
    </Card>
  )
}
