"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { Camera, User, Mail, Phone, MapPin, Bike, Car, Shield } from "lucide-react"

export default function DeliverySettingsPage() {
  const { toast } = useToast()
  const [userData, setUserData] = useState({
    username: "李小明",
    email: "driver001@example.com",
    phone: "0912345678",
    address: "台北市信義區信義路五段7號",
    avatar: "/placeholder.svg?height=128&width=128&text=李小明",
    vehicleType: "機車",
    licensePlate: "ABC-1234",
    idNumber: "A123456789",
    bankAccount: "012-345-678901",
    isAvailable: true,
    notifications: {
      newOrders: true,
      orderUpdates: true,
      earnings: true,
      promotions: false,
    },
  })

  const [formData, setFormData] = useState({ ...userData })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    if (field === "isAvailable") {
      setFormData({
        ...formData,
        isAvailable: checked,
      })
    } else {
      setFormData({
        ...formData,
        notifications: {
          ...formData.notifications,
          [field]: checked,
        },
      })
    }
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setUserData({ ...formData })

    toast({
      title: "個人資料已更新",
      description: "您的個人資料已成功儲存",
      variant: "default",
    })
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">個人設定</h1>
        <p className="text-muted-foreground">管理您的個人資訊和偏好設定</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-brand-primary/20">
                    <AvatarImage src={userData.avatar || "/placeholder.svg"} alt={userData.username} />
                    <AvatarFallback className="text-3xl bg-brand-primary/10 text-brand-primary">
                      {userData.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">更換頭像</span>
                  </Button>
                </div>
                <h2 className="text-xl font-bold">{userData.username}</h2>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
                <div className="mt-4 w-full">
                  <div className="flex items-center py-2 border-t">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.phone}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.address}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <Bike className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">
                      {userData.vehicleType} · {userData.licensePlate}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本資料</TabsTrigger>
              <TabsTrigger value="vehicle">車輛資訊</TabsTrigger>
              <TabsTrigger value="notifications">通知設定</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>基本資料</CardTitle>
                  <CardDescription>更新您的個人資訊</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveProfile}>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">姓名</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="username"
                            name="username"
                            className="pl-10"
                            value={formData.username}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">電子郵件</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            className="pl-10"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phone">電話號碼</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            name="phone"
                            className="pl-10"
                            value={formData.phone}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="address">地址</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="address"
                            name="address"
                            className="pl-10"
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="idNumber">身分證字號</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="idNumber"
                            name="idNumber"
                            className="pl-10"
                            value={formData.idNumber}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="bankAccount">銀行帳號</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="bankAccount"
                            name="bankAccount"
                            className="pl-10"
                            value={formData.bankAccount}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile}>儲存變更</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="vehicle" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>車輛資訊</CardTitle>
                  <CardDescription>更新您的車輛資訊</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="vehicleType">車輛類型</Label>
                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="motorcycle"
                            name="vehicleType"
                            value="機車"
                            checked={formData.vehicleType === "機車"}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-brand-primary"
                          />
                          <Label htmlFor="motorcycle" className="flex items-center">
                            <Bike className="mr-2 h-4 w-4" />
                            機車
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="car"
                            name="vehicleType"
                            value="汽車"
                            checked={formData.vehicleType === "汽車"}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-brand-primary"
                          />
                          <Label htmlFor="car" className="flex items-center">
                            <Car className="mr-2 h-4 w-4" />
                            汽車
                          </Label>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="licensePlate">車牌號碼</Label>
                      <Input
                        id="licensePlate"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="isAvailable">接單狀態</Label>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="isAvailable"
                          checked={formData.isAvailable}
                          onCheckedChange={(checked) => handleSwitchChange("isAvailable", checked)}
                        />
                        <Label htmlFor="isAvailable">{formData.isAvailable ? "可接單" : "暫停接單"}</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formData.isAvailable ? "您目前可以接收新訂單" : "您目前無法接收新訂單"}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile}>儲存變更</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>通知設定</CardTitle>
                  <CardDescription>管理您接收通知的方式</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="newOrders" className="font-medium">
                          新訂單通知
                        </Label>
                        <p className="text-sm text-muted-foreground">接收新訂單的即時通知</p>
                      </div>
                      <Switch
                        id="newOrders"
                        checked={formData.notifications.newOrders}
                        onCheckedChange={(checked) => handleSwitchChange("newOrders", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="orderUpdates" className="font-medium">
                          訂單狀態更新
                        </Label>
                        <p className="text-sm text-muted-foreground">接收訂單狀態變更的通知</p>
                      </div>
                      <Switch
                        id="orderUpdates"
                        checked={formData.notifications.orderUpdates}
                        onCheckedChange={(checked) => handleSwitchChange("orderUpdates", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="earnings" className="font-medium">
                          收入通知
                        </Label>
                        <p className="text-sm text-muted-foreground">接收收入和付款相關通知</p>
                      </div>
                      <Switch
                        id="earnings"
                        checked={formData.notifications.earnings}
                        onCheckedChange={(checked) => handleSwitchChange("earnings", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="promotions" className="font-medium">
                          促銷活動
                        </Label>
                        <p className="text-sm text-muted-foreground">接收促銷和獎勵計劃的通知</p>
                      </div>
                      <Switch
                        id="promotions"
                        checked={formData.notifications.promotions}
                        onCheckedChange={(checked) => handleSwitchChange("promotions", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile}>儲存變更</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
