"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BrandLogo } from "@/components/brand-logo"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userType, setUserType] = useState("user")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

    if (!username || !password) {
      toast({
        title: "登入失敗",
        description: "請輸入帳號和密碼",
        variant: "destructive",
      })
      return
    }

    // 模擬登入成功
    toast({
      title: "登入成功",
      description: "歡迎回來！",
    })

    // 根據用戶類型導向不同頁面
    if (userType === "user") {
      router.push("/user/home")
    } else if (userType === "restaurant") {
      router.push("/restaurant/dashboard")
    } else if (userType === "delivery") {
      router.push("/delivery/dashboard")
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-2">
            <BrandLogo size="lg" />
          </div>
          <p className="text-muted-foreground">食在好時</p>
        </div>

        <Tabs defaultValue="user" className="w-full" onValueChange={setUserType}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user">用戶</TabsTrigger>
            <TabsTrigger value="restaurant">店家</TabsTrigger>
            <TabsTrigger value="delivery">外送員</TabsTrigger>
          </TabsList>

          <Card className="mt-4 border-none shadow-lg">
            <CardHeader>
              <CardTitle>
                {userType === "user" ? "用戶登入" : userType === "restaurant" ? "店家登入" : "外送員登入"}
              </CardTitle>
              <CardDescription>
                {userType === "user"
                  ? "登入您的帳號以開始訂購美食"
                  : userType === "restaurant"
                    ? "登入您的店家帳號以管理訂單"
                    : "登入您的外送員帳號以接收訂單"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">帳號</Label>
                  <Input
                    id="username"
                    placeholder="請輸入帳號"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密碼</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="請輸入密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  登入
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-muted-foreground">
                還沒有帳號？{" "}
                <Link href="/register" className="text-primary hover:underline">
                  立即註冊
                </Link>
              </div>
              <div className="text-sm text-muted-foreground">
                <Link href="/forgot-password" className="text-primary hover:underline">
                  忘記密碼？
                </Link>
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
