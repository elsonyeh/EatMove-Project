"use client"

import type React from "react"

import { useState } from "react"
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

export default function RestaurantSettingsPage() {
  const { toast } = useToast()
  const [restaurantData, setRestaurantData] = useState({
    name: "美味餐廳",
    description: "提供各種美味料理，從傳統到創新，滿足您的味蕾。",
    address: "台北市信義區信義路五段7號",
    phone: "02-2345-6789",
    email: "info@delicious.com",
    openingHours: {
      weekday: "11:00 - 21:00",
      weekend: "10:00 - 22:00",
    },
    minimumOrder: "100",
    deliveryFee: "60",
    deliveryTime: "30-45 分鐘",
    cuisine: "中式料理",
    isOpen: true,
    acceptingOrders: true,
    logo: "/placeholder.svg?height=200&width=200",
    coverImage: "/placeholder.svg?height=400&width=800",
  })

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

  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault()

    toast({
      title: "設定已儲存",
      description: "您的餐廳設定已成功更新",
    })
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
              <Button onClick={handleSaveChanges}>儲存變更</Button>
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
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="weekend">週六至週日</Label>
                      <Input
                        id="weekend"
                        name="weekend"
                        value={restaurantData.openingHours.weekend}
                        onChange={handleOpeningHoursChange}
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
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deliveryTime">預計送達時間</Label>
                    <Input
                      id="deliveryTime"
                      name="deliveryTime"
                      value={restaurantData.deliveryTime}
                      onChange={handleInputChange}
                    />
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
              <Button onClick={handleSaveChanges}>儲存變更</Button>
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
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-md">
                      <Image
                        src={restaurantData.logo || "/placeholder.svg"}
                        alt="餐廳標誌"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="logo">標誌網址</Label>
                      <Input id="logo" name="logo" value={restaurantData.logo} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-medium">封面圖片</h3>
                  <div className="space-y-4">
                    <div className="relative h-48 w-full overflow-hidden rounded-md">
                      <Image
                        src={restaurantData.coverImage || "/placeholder.svg"}
                        alt="封面圖片"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="coverImage">封面圖片網址</Label>
                      <Input
                        id="coverImage"
                        name="coverImage"
                        value={restaurantData.coverImage}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveChanges}>儲存變更</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
