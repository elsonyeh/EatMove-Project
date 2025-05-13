"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BrandLogo } from "@/components/brand-logo"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userType, setUserType] = useState("user")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const handleRegister = async () => {
    console.log("⚡ 點擊註冊")

    if (!username || !email || !password || !confirmPassword) {
      toast({
        title: "註冊失敗",
        description: "請填寫所有欄位",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "註冊失敗",
        description: "兩次輸入的密碼不一致",
        variant: "destructive",
      })
      return
    }

    const payload = {
      mid: username,
      name: username,
      address: "暫時地址",
      phonenumber: "0912345678",
      email,
      introducer: null,
    }

    try {
      const res = await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "註冊失敗")
      }

      toast({
        title: "註冊成功",
        description: "請登入您的帳號",
      })

      router.push("/login")
    } catch (err: any) {
      toast({
        title: "註冊失敗",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4">
            <BrandLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold">註冊帳號</h1>
          <p className="text-muted-foreground">加入我們的美食外送平台</p>
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
                {userType === "user"
                  ? "用戶註冊"
                  : userType === "restaurant"
                  ? "店家註冊"
                  : "外送員註冊"}
              </CardTitle>
              <CardDescription>
                {userType === "user"
                  ? "創建您的用戶帳號以開始訂購美食"
                  : userType === "restaurant"
                  ? "創建您的店家帳號以開始銷售美食"
                  : "創建您的外送員帳號以開始接單"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">用戶名稱</Label>
                  <Input
                    id="username"
                    placeholder="請輸入用戶名稱"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">電子郵件</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="請輸入電子郵件"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">確認密碼</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="請再次輸入密碼"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button type="button" onClick={handleRegister} className="w-full">
                  註冊
                </Button>
              </form>
            </CardContent>
            <CardFooter>
              <div className="text-sm text-muted-foreground">
                已有帳號？{" "}
                <Link href="/login" className="text-primary hover:underline">
                  立即登入
                </Link>
              </div>
            </CardFooter>
          </Card>
        </Tabs>
      </div>
    </div>
  )
}
