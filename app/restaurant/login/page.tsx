"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { restaurantAccounts } from "@/lib/restaurant-accounts"
import { BrandLogo } from "@/components/brand-logo"
import { AlertCircle } from "lucide-react"

export default function RestaurantLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("請輸入帳號和密碼")
      return
    }

    setIsLoading(true)

    try {
      // 模擬API請求延遲
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 檢查帳號密碼
      const account = restaurantAccounts.find(
        (account) => account.username === username && account.password === password,
      )

      if (account) {
        // 儲存登入資訊到 localStorage
        localStorage.setItem("restaurantAccount", JSON.stringify(account))

        toast({
          title: "登入成功",
          description: `歡迎回來，${account.restaurantName}`,
        })

        // 導向店家儀表板
        router.push("/restaurant/dashboard")
      } else {
        setError("帳號或密碼錯誤")
      }
    } catch (error) {
      setError("登入時發生錯誤，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-light to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-6">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold">店家管理系統</h1>
          <p className="text-muted-foreground">登入您的店家帳號以管理訂單和商品</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle>店家登入</CardTitle>
            <CardDescription>請輸入您的店家帳號和密碼</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-center text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {error}
                </div>
              )}
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "登入中..." : "登入"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-muted-foreground">
              <span>測試帳號：</span>
              {restaurantAccounts.map((account, index) => (
                <span key={account.id}>
                  {index > 0 && ", "}
                  <span className="font-medium">{account.username}</span>
                </span>
              ))}
              <span> (密碼與帳號相同)</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link href="/login" className="text-brand-primary hover:underline">
                返回用戶登入
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
