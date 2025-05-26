"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"

interface SearchBarProps {
  onSearch: (query: string, location: string) => void
  initialQuery?: string
  initialLocation?: string
}

export function SearchBar({ onSearch, initialQuery = "", initialLocation = "" }: SearchBarProps) {
  const { toast } = useToast()
  const [query, setQuery] = useState(initialQuery)
  const [location, setLocation] = useState(initialLocation)
  const [isOpen, setIsOpen] = useState(false)
  const [locationInput, setLocationInput] = useState(initialLocation)

  // 當初始位置改變時更新狀態
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation)
      setLocationInput(initialLocation)
    }
  }, [initialLocation])

  // 常用地區列表
  const commonLocations = [
    "台北市信義區",
    "台北市大安區",
    "台北市中山區",
    "台北市松山區",
    "台北市內湖區",
    "台北市士林區",
    "台北市北投區",
    "台北市中正區",
    "台北市萬華區",
    "台北市文山區",
    "台北市南港區",
    "台北市大同區",
    "新北市板橋區",
    "新北市新莊區",
    "新北市中和區",
    "新北市永和區",
    "新北市土城區",
    "新北市樹林區",
    "桃園市桃園區",
    "桃園市中壢區",
    "台中市西屯區",
    "台中市北屯區",
    "台中市南屯區",
    "高雄市前金區",
    "高雄市新興區",
    "高雄市苓雅區"
  ]

  // 獲取當前位置
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            // 使用 Geocoding API 將座標轉換為地址
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&language=zh-TW`
            )
            const data = await response.json()
            if (data.results[0]) {
              const newLocation = data.results[0].formatted_address
              setLocation(newLocation)
              setLocationInput(newLocation)
              setIsOpen(false)
              onSearch(query, newLocation)
            }
          } catch (error) {
            console.error("獲取地址失敗:", error)
            toast({
              title: "錯誤",
              description: "無法獲取當前位置",
              variant: "destructive",
            })
          }
        },
        (error) => {
          console.error("獲取位置失敗:", error)
          toast({
            title: "錯誤",
            description: "無法獲取當前位置，請手動輸入地址",
            variant: "destructive",
          })
        }
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const finalLocation = locationInput || location
    setLocation(finalLocation)
    onSearch(query, finalLocation)
  }

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation)
    setLocationInput(selectedLocation)
    setIsOpen(false)
    onSearch(query, selectedLocation)
  }

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(e.target.value)
  }

  const handleLocationInputSubmit = () => {
    setLocation(locationInput)
    setIsOpen(false)
    onSearch(query, locationInput)
  }

  // 過濾地區列表
  const filteredLocations = commonLocations.filter(loc =>
    loc.toLowerCase().includes(locationInput.toLowerCase())
  )

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋餐廳、美食或地區..."
          className="pl-10 bg-white"
        />
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="bg-white min-w-[200px] justify-start text-left text-foreground"
            onClick={() => setIsOpen(true)}
          >
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{location || "選擇或輸入地區"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-3">
          <div className="space-y-3">
            {/* 地址輸入框 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">輸入地址</label>
              <div className="flex gap-2">
                <Input
                  value={locationInput}
                  onChange={handleLocationInputChange}
                  placeholder="輸入完整地址..."
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleLocationInputSubmit()
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleLocationInputSubmit}
                  className="bg-brand-primary hover:bg-brand-primary/90"
                >
                  確定
                </Button>
              </div>
            </div>

            {/* 分隔線 */}
            <div className="border-t pt-2">
              <Button
                variant="ghost"
                className="w-full justify-start mb-2"
                onClick={() => {
                  getCurrentLocation()
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                使用目前位置
              </Button>
            </div>

            {/* 常用地區 */}
            <div className="space-y-1">
              <label className="text-sm font-medium">常用地區</label>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {filteredLocations.map((loc) => (
                  <Button
                    key={loc}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => handleLocationSelect(loc)}
                  >
                    {loc}
                  </Button>
                ))}
                {filteredLocations.length === 0 && locationInput && (
                  <p className="text-sm text-muted-foreground p-2">
                    沒有找到符合的地區
                  </p>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">
        搜尋
      </Button>
    </form>
  )
}
