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

  // 當初始位置改變時更新狀態
  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation)
    }
  }, [initialLocation])

  // 常用地區列表
  const commonLocations = [
    "台北市信義區",
    "台北市大安區",
    "台北市中山區",
    "台北市松山區",
    "台北市內湖區",
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
            description: "無法獲取當前位置，請手動選擇地址",
            variant: "destructive",
          })
        }
      )
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query, location)
  }

  const handleLocationSelect = (selectedLocation: string) => {
    setLocation(selectedLocation)
    setIsOpen(false)
    onSearch(query, selectedLocation)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜尋餐廳或美食..."
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
            <span className="truncate">{location || "選擇地區"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-2">
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                getCurrentLocation()
              }}
            >
              <MapPin className="mr-2 h-4 w-4" />
              使用目前位置
            </Button>
            {commonLocations.map((loc) => (
              <Button
                key={loc}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleLocationSelect(loc)}
              >
                {loc}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button type="submit" className="bg-brand-primary hover:bg-brand-primary/90">
        搜尋
      </Button>
    </form>
  )
}
