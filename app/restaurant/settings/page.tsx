"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Upload, X } from "lucide-react"

export default function RestaurantSettingsPage() {
  const { toast } = useToast()
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [restaurantData, setRestaurantData] = useState({
    rid: "",
    name: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    openingHours: {
      weekday: "11:00-21:00",
      weekend: "10:00-22:00",
    },
    minimumOrder: "300",
    deliveryFee: "60",
    deliveryTime: "30-45 分鐘",
    cuisine: "中式料理",
    isOpen: true,
    acceptingOrders: true,
    logo: "",
    coverImage: "",
    rating: 4.5,
    deliveryArea: "高雄市"
  })

  // 從localStorage獲取餐廳ID並載入資料
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const rid = localStorage.getItem("restaurantId")
        if (!rid) {
          toast({
            title: "錯誤",
            description: "請先登入餐廳帳號",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`/api/restaurant/profile?rid=${rid}`)
        const data = await response.json()

        if (data.success) {
          const restaurant = data.restaurant
          setRestaurantData({
            rid: restaurant.rid,
            name: restaurant.name || "",
            description: restaurant.description || "",
            address: restaurant.address || "",
            phone: restaurant.phone || "",
            email: restaurant.email || "",
            openingHours: {
              weekday: restaurant.business_hours?.split(',')[0] || "11:00-21:00",
              weekend: restaurant.business_hours?.split(',')[1] || "10:00-22:00",
            },
            minimumOrder: restaurant.min_order?.toString() || "300",
            deliveryFee: "60", // 可以從距離計算得出
            deliveryTime: "30-45 分鐘",
            cuisine: restaurant.cuisine || "中式料理",
            isOpen: restaurant.is_open ?? true,
            acceptingOrders: restaurant.is_open ?? true,
            logo: restaurant.image || "",
            coverImage: restaurant.image || "",
            rating: restaurant.rating || 4.5,
            deliveryArea: restaurant.delivery_area || "高雄市"
          })
        } else {
          toast({
            title: "錯誤",
            description: data.message || "無法載入餐廳資料",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("載入餐廳資料失敗:", error)
        toast({
          title: "錯誤",
          description: "網路連線錯誤",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurantData()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setRestaurantData({
      ...restaurantData,
      [name]: value,
    })
  }

  const handleOpeningHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRestaurantData({
      ...restaurantData,
      openingHours: {
        ...restaurantData.openingHours,
        [name]: value,
      },
    })
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setRestaurantData({
      ...restaurantData,
      [name]: checked,
    })
  }

  const handleCuisineChange = (value: string) => {
    setRestaurantData({
      ...restaurantData,
      cuisine: value,
    })
  }

  // 處理檔案上傳
  const handleFileUpload = async (file: File, type: 'logo' | 'cover') => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('rid', restaurantData.rid)

      const response = await fetch('/api/restaurant/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        const imageUrl = data.imageUrl
        if (type === 'logo') {
          setRestaurantData(prev => ({ ...prev, logo: imageUrl }))
        } else {
          setRestaurantData(prev => ({ ...prev, coverImage: imageUrl }))
        }

        toast({
          title: "上傳成功",
          description: `${type === 'logo' ? '標誌' : '封面圖片'}已成功上傳`,
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("圖片上傳失敗:", error)
      toast({
        title: "上傳失敗",
        description: "圖片上傳失敗，請重試",
        variant: "destructive",
      })
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查檔案類型
      if (!file.type.startsWith('image/')) {
        toast({
          title: "檔案格式錯誤",
          description: "請選擇圖片檔案",
          variant: "destructive",
        })
        return
      }

      // 檢查檔案大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "檔案過大",
          description: "圖片檔案不能超過 5MB",
          variant: "destructive",
        })
        return
      }

      handleFileUpload(file, type)
    }
  }

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/restaurant/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rid: restaurantData.rid,
          name: restaurantData.name,
          description: restaurantData.description,
          address: restaurantData.address,
          phone: restaurantData.phone,
          email: restaurantData.email,
          business_hours: `${restaurantData.openingHours.weekday},${restaurantData.openingHours.weekend}`,
          min_order: parseInt(restaurantData.minimumOrder),
          is_open: restaurantData.isOpen,
          image: restaurantData.coverImage,
          delivery_area: restaurantData.deliveryArea,
          rating: restaurantData.rating,
          cuisine: restaurantData.cuisine
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "設定已儲存",
          description: "您的餐廳設定已成功更新",
        })
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      console.error("儲存失敗:", error)
      toast({
        title: "儲存失敗",
        description: "無法儲存設定，請重試",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          <span className="ml-2">載入中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">餐廳設定</h1>
        <p className="text-muted-foreground">管理您的餐廳資訊和設定</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">基本資訊</TabsTrigger>
          <TabsTrigger value="business">營業設定</TabsTrigger>
          <TabsTrigger value="appearance">外觀設定</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
              <CardDescription>更新您的餐廳基本資訊</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">餐廳名稱</Label>
                  <Input id="name" name="name" value={restaurantData.name} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">餐廳描述</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={restaurantData.description}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">地址</Label>
                  <Input id="address" name="address" value={restaurantData.address} onChange={handleInputChange} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">電話</Label>
                    <Input id="phone" name="phone" value={restaurantData.phone} onChange={handleInputChange} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">電子郵件</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={restaurantData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deliveryArea">外送區域</Label>
                  <Input
                    id="deliveryArea"
                    name="deliveryArea"
                    value={restaurantData.deliveryArea}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cuisine">料理類型</Label>
                  <Select value={restaurantData.cuisine} onValueChange={handleCuisineChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇料理類型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="中式料理">中式料理</SelectItem>
                      <SelectItem value="日式料理">日式料理</SelectItem>
                      <SelectItem value="韓式料理">韓式料理</SelectItem>
                      <SelectItem value="義式料理">義式料理</SelectItem>
                      <SelectItem value="美式料理">美式料理</SelectItem>
                      <SelectItem value="泰式料理">泰式料理</SelectItem>
                      <SelectItem value="素食">素食</SelectItem>
                      <SelectItem value="甜點">甜點</SelectItem>
                      <SelectItem value="飲料">飲料</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? "儲存中..." : "儲存變更"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>營業設定</CardTitle>
              <CardDescription>設定您的營業時間和配送資訊</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-medium">營業時間</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="weekday">週一至週五</Label>
                      <Input
                        id="weekday"
                        name="weekday"
                        value={restaurantData.openingHours.weekday}
                        onChange={handleOpeningHoursChange}
                        placeholder="例：11:00-21:00"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weekend">週六至週日</Label>
                      <Input
                        id="weekend"
                        name="weekend"
                        value={restaurantData.openingHours.weekend}
                        onChange={handleOpeningHoursChange}
                        placeholder="例：10:00-22:00"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="minimumOrder">最低消費</Label>
                    <Input
                      id="minimumOrder"
                      name="minimumOrder"
                      type="number"
                      value={restaurantData.minimumOrder}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryFee">外送費</Label>
                    <Input
                      id="deliveryFee"
                      name="deliveryFee"
                      type="number"
                      value={restaurantData.deliveryFee}
                      onChange={handleInputChange}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">外送費由系統根據距離自動計算</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryTime">預計送達時間</Label>
                    <Input
                      id="deliveryTime"
                      name="deliveryTime"
                      value={restaurantData.deliveryTime}
                      onChange={handleInputChange}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">送達時間由系統根據距離自動計算</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">營業狀態</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isOpen"
                      checked={restaurantData.isOpen}
                      onCheckedChange={(checked) => handleSwitchChange("isOpen", checked)}
                    />
                    <Label htmlFor="isOpen">營業中</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="acceptingOrders"
                      checked={restaurantData.acceptingOrders}
                      onCheckedChange={(checked) => handleSwitchChange("acceptingOrders", checked)}
                    />
                    <Label htmlFor="acceptingOrders">接受訂單</Label>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? "儲存中..." : "儲存變更"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>外觀設定</CardTitle>
              <CardDescription>更新您的餐廳標誌和封面圖片</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">餐廳標誌</h3>
                  <div className="flex items-start gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md border-2 border-dashed border-gray-300">
                      {restaurantData.logo ? (
                        <Image
                          src={restaurantData.logo}
                          alt="餐廳標誌"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50">
                          <Upload className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="grid gap-2">
                        <Label htmlFor="logo">標誌網址</Label>
                        <Input
                          id="logo"
                          name="logo"
                          value={restaurantData.logo}
                          onChange={handleInputChange}
                          placeholder="輸入圖片網址或上傳檔案"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoFileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          上傳檔案
                        </Button>
                        {restaurantData.logo && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setRestaurantData(prev => ({ ...prev, logo: "" }))}
                          >
                            <X className="h-4 w-4 mr-2" />
                            清除
                          </Button>
                        )}
                      </div>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, 'logo')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">封面圖片</h3>
                  <div className="space-y-4">
                    <div className="relative h-48 w-full overflow-hidden rounded-md border-2 border-dashed border-gray-300">
                      {restaurantData.coverImage ? (
                        <Image
                          src={restaurantData.coverImage}
                          alt="封面圖片"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-50">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coverImage">封面圖片網址</Label>
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={restaurantData.coverImage}
                        onChange={handleInputChange}
                        placeholder="輸入圖片網址或上傳檔案"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => coverFileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        上傳檔案
                      </Button>
                      {restaurantData.coverImage && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setRestaurantData(prev => ({ ...prev, coverImage: "" }))}
                        >
                          <X className="h-4 w-4 mr-2" />
                          清除
                        </Button>
                      )}
                    </div>
                    <input
                      ref={coverFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e, 'cover')}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges} disabled={saving}>
                {saving ? "儲存中..." : "儲存變更"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
