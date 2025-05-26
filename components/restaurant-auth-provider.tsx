"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// 定義店家帳號類型
export type RestaurantAccount = {
  id: string
  username: string
  restaurantId: number
  restaurantName: string
  email: string
  address?: string
  description?: string
  phonenumber?: string
}

// 創建認證上下文
type RestaurantAuthContextType = {
  account: RestaurantAccount | null
  isLoading: boolean
  logout: () => void
}

const RestaurantAuthContext = createContext<RestaurantAuthContextType>({
  account: null,
  isLoading: true,
  logout: () => { },
})

// 認證提供者組件
export function RestaurantAuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<RestaurantAccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 從 localStorage 獲取登入資訊
    const storedAccount = localStorage.getItem("restaurantAccount")

    if (storedAccount) {
      try {
        const parsedAccount = JSON.parse(storedAccount)
        // 驗證必要欄位是否存在
        if (parsedAccount.id && parsedAccount.restaurantName && parsedAccount.email) {
          setAccount(parsedAccount)
        } else {
          // 資料不完整，清除 localStorage
          localStorage.removeItem("restaurantAccount")
          router.push("/login?type=restaurant")
        }
      } catch (error) {
        console.error("Failed to parse restaurant account:", error)
        localStorage.removeItem("restaurantAccount")
        router.push("/login?type=restaurant")
      }
    } else {
      // 未登入，導向登入頁
      router.push("/login?type=restaurant")
    }

    setIsLoading(false)
  }, [router])

  const logout = () => {
    localStorage.removeItem("restaurantAccount")
    setAccount(null)
    router.push("/login?type=restaurant")
  }

  return (
    <RestaurantAuthContext.Provider value={{ account, isLoading, logout }}>{children}</RestaurantAuthContext.Provider>
  )
}

// 自定義 Hook 以便在組件中使用
export function useRestaurantAuth() {
  return useContext(RestaurantAuthContext)
}
