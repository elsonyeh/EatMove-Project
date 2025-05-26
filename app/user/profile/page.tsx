"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { User, Mail, Phone, MapPin, Camera, Wallet } from "lucide-react"

export default function UserProfilePage() {
  const { toast } = useToast()
  const [userData, setUserData] = useState({
    mid: "",
    name: "",
    email: "",
    phonenumber: "",
    address: "",
    wallet: 0,
    avatar: "/placeholder.svg?height=128&width=128"
  })

  const [formData, setFormData] = useState({ ...userData })
  const [loading, setLoading] = useState(true)

  // 從 localStorage 獲取用戶 ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mid = localStorage.getItem("userId")
        if (!mid) {
          toast({
            title: "錯誤",
            description: "請先登入",
            variant: "destructive",
          })
          return
        }

        const response = await fetch(`/api/user/profile?mid=${mid}`)
        const data = await response.json()

        if (data.success) {
          const userInfo = data.data
          setUserData(userInfo)
          setFormData(userInfo)
          setLoading(false)
        } else {
          toast({
            title: "錯誤",
            description: data.message,
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error)
        toast({
          title: "錯誤",
          description: "獲取用戶資料失敗",
          variant: "destructive",
        })
      }
    }

    fetchUserData()
  }, [toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          mid: userData.mid,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUserData(data.data)
        toast({
          title: "成功",
          description: "個人資料已更新",
          variant: "default",
        })
      } else {
        toast({
          title: "錯誤",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("更新用戶資料失敗:", error)
      toast({
        title: "錯誤",
        description: "更新用戶資料失敗",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <div className="container py-8">載入中...</div>
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">個人資料</h1>
        <p className="text-muted-foreground">管理您的個人資訊和偏好設定</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar className="h-32 w-32 border-4 border-brand-primary/20">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="text-3xl bg-brand-primary/10 text-brand-primary">
                      {userData.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full">
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">更換頭像</span>
                  </Button>
                </div>
                <h2 className="text-xl font-bold">{userData.name}</h2>
                <p className="text-sm text-muted-foreground">{userData.email}</p>
                <div className="mt-4 w-full">
                  <div className="flex items-center py-2 border-t">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.phonenumber}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">{userData.address}</span>
                  </div>
                  <div className="flex items-center py-2 border-t">
                    <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="text-sm">錢包餘額: ${userData.wallet}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">基本資料</TabsTrigger>
              <TabsTrigger value="security">安全設定</TabsTrigger>
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
                        <Label htmlFor="name">用戶名稱</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            name="name"
                            className="pl-10"
                            value={formData.name}
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
                        <Label htmlFor="phonenumber">電話號碼</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phonenumber"
                            name="phonenumber"
                            className="pl-10"
                            value={formData.phonenumber}
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
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button onClick={handleSaveProfile}>儲存變更</Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>安全設定</CardTitle>
                  <CardDescription>管理您的密碼和安全選項</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">目前密碼</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">新密碼</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">確認新密碼</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button>更新密碼</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
