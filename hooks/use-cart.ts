"use client"

import { useState, useEffect } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useToast } from "@/components/ui/use-toast"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  restaurantId: string
  restaurantName: string
}

interface CartState {
  items: CartItem[]
  restaurantId: string | null
  restaurantName: string | null
}

const initialState: CartState = {
  items: [],
  restaurantId: null,
  restaurantName: null,
}

export function useCart() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [cart, setCart] = useLocalStorage<CartState>("eatmove-cart", initialState)

  // 確保只在客戶端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 添加商品到購物車
  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    if (!mounted) return

    setCart((prevCart) => {
      // 如果購物車為空，設置餐廳信息
      if (prevCart.items.length === 0) {
        return {
          ...prevCart,
          restaurantId: item.restaurantId,
          restaurantName: item.restaurantName,
          items: [{ ...item, quantity }],
        }
      }

      // 如果嘗試添加不同餐廳的商品
      if (prevCart.restaurantId && prevCart.restaurantId !== item.restaurantId) {
        toast({
          title: "無法添加商品",
          description: `您的購物車中已有來自 ${prevCart.restaurantName} 的商品。請先清空購物車或完成當前訂單。`,
          variant: "destructive",
        })
        return prevCart
      }

      // 檢查商品是否已在購物車中
      const existingItemIndex = prevCart.items.findIndex((i) => i.id === item.id)

      if (existingItemIndex > -1) {
        // 更新現有商品數量
        const updatedItems = [...prevCart.items]
        updatedItems[existingItemIndex].quantity += quantity
        return { ...prevCart, items: updatedItems }
      }

      // 添加新商品
      return {
        ...prevCart,
        items: [...prevCart.items, { ...item, quantity }],
      }
    })

    toast({
      title: "已添加到購物車",
      description: `${item.name} x ${quantity} 已添加到您的購物車`,
    })
  }

  // 從購物車中移除商品
  const removeItem = (itemId: string) => {
    if (!mounted) return

    setCart((prevCart) => {
      const updatedItems = prevCart.items.filter((item) => item.id !== itemId)

      // 如果購物車為空，重置餐廳信息
      if (updatedItems.length === 0) {
        return initialState
      }

      return { ...prevCart, items: updatedItems }
    })

    toast({
      title: "已從購物車移除",
      description: "商品已從購物車中移除",
    })
  }

  // 更新購物車中商品的數量
  const updateQuantity = (itemId: string, quantity: number) => {
    if (!mounted || quantity < 1) return

    setCart((prevCart) => {
      const updatedItems = prevCart.items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      return { ...prevCart, items: updatedItems }
    })
  }

  // 清空購物車
  const clearCart = () => {
    if (!mounted) return
    setCart(initialState)

    toast({
      title: "購物車已清空",
      description: "所有商品已從購物車中移除",
    })
  }

  // 計算購物車小計
  const getSubtotal = () => {
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  // 獲取購物車中的商品總數
  const getTotalItems = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  // 檢查商品是否在購物車中
  const isInCart = (itemId: string) => {
    return cart.items.some((item) => item.id === itemId)
  }

  // 獲取購物車中特定商品的數量
  const getItemQuantity = (itemId: string) => {
    const item = cart.items.find((item) => item.id === itemId)
    return item ? item.quantity : 0
  }

  return {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotalItems,
    isInCart,
    getItemQuantity,
    mounted,
  }
}
