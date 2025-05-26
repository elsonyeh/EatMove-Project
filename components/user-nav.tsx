"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { User, Settings, History, LogOut, CreditCard } from "lucide-react"
import { getUserAvatar } from "@/utils/image-utils"
import { useState, useEffect } from "react"

export function UserNav() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    avatar: "/placeholder.svg"
  })

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const mid = localStorage.getItem("userId")
        if (!mid) return

        const response = await fetch(`/api/user/profile?mid=${mid}`)
        const data = await response.json()

        if (data.success) {
          setUserData({
            name: data.data.name,
            email: data.data.email,
            avatar: data.data.avatar || "/placeholder.svg"
          })
        }
      } catch (error) {
        console.error("獲取用戶資料失敗:", error)
      }
    }

    fetchUserData()
  }, [])

  const handleLogout = () => {
    toast({
      title: "已登出",
      description: "您已成功登出",
      variant: "default",
    })

    localStorage.removeItem("userId")
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-brand-primary/20">
            <AvatarImage src={userData.avatar} alt={userData.name} />
            <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
              {userData.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userData.name || "訪客"}</p>
            <p className="text-xs leading-none text-muted-foreground">{userData.email || "未登入"}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/user/profile")}>
            <User className="mr-2 h-4 w-4 text-brand-primary" />
            <span>個人資料</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/user/orders")}>
            <History className="mr-2 h-4 w-4 text-brand-secondary" />
            <span>訂單記錄</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/user/payment")}>
            <CreditCard className="mr-2 h-4 w-4 text-brand-accent" />
            <span>付款方式</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/user/settings")}>
            <Settings className="mr-2 h-4 w-4 text-brand-dark" />
            <span>設定</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
