"use client"

import { useState, useEffect, useCallback } from "react"

export interface CartItem {
  cart_item_id: number
  cart_id: number
  rid: number
  dishId: number
  dishName: string
  price: number
  quantity: number
  specialInstructions: string
  image: string
  restaurantName: string
  addedAt: string
}

export interface Cart {
  cartId: number | null
  items: CartItem[]
  totalItems: number
  totalPrice: number
}

export function useCartDB() {
  const [cart, setCart] = useState<Cart>({
    cartId: null,
    items: [],
    totalItems: 0,
    totalPrice: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 獲取用戶ID
  const getUserId = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId')
    }
    return null
  }, [])

  // 載入購物車
  const loadCart = useCallback(async () => {
    const userId = getUserId()
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/cart?mid=${userId}`)
      const data = await response.json()

      if (data.success) {
        setCart({
          cartId: data.cartId,
          items: data.items,
          totalItems: data.totalItems,
          totalPrice: data.totalPrice
        })
      } else {
        setError(data.message)
      }
    } catch (err) {
      console.error("載入購物車失敗:", err)
      setError("載入購物車失敗")
    } finally {
      setLoading(false)
    }
  }, [getUserId])

  // 添加商品到購物車
  const addToCart = useCallback(async (
    rid: number, 
    dishId: number, 
    quantity: number = 1, 
    specialInstructions: string = ""
  ) => {
    const userId = getUserId()
    if (!userId) {
      setError("請先登入")
      return false
    }

    try {
      setError(null)
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mid: userId,
          rid,
          dishId,
          quantity,
          specialInstructions
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 重新載入購物車
        await loadCart()
        return true
      } else {
        setError(data.message)
        return false
      }
    } catch (err) {
      console.error("添加到購物車失敗:", err)
      setError("添加到購物車失敗")
      return false
    }
  }, [getUserId, loadCart])

  // 更新購物車項目
  const updateCartItem = useCallback(async (
    cartItemId: number, 
    quantity: number, 
    specialInstructions?: string
  ) => {
    try {
      setError(null)
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity,
          specialInstructions
        }),
      })

      const data = await response.json()

      if (data.success) {
        // 重新載入購物車
        await loadCart()
        return true
      } else {
        setError(data.message)
        return false
      }
    } catch (err) {
      console.error("更新購物車項目失敗:", err)
      setError("更新購物車項目失敗")
      return false
    }
  }, [loadCart])

  // 刪除購物車項目
  const removeFromCart = useCallback(async (cartItemId: number) => {
    try {
      setError(null)
      const response = await fetch(`/api/cart/${cartItemId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        // 重新載入購物車
        await loadCart()
        return true
      } else {
        setError(data.message)
        return false
      }
    } catch (err) {
      console.error("刪除購物車項目失敗:", err)
      setError("刪除購物車項目失敗")
      return false
    }
  }, [loadCart])

  // 清空購物車
  const clearCart = useCallback(async () => {
    const userId = getUserId()
    if (!userId) {
      setError("請先登入")
      return false
    }

    try {
      setError(null)
      const response = await fetch(`/api/cart?mid=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setCart({
          cartId: null,
          items: [],
          totalItems: 0,
          totalPrice: 0
        })
        return true
      } else {
        setError(data.message)
        return false
      }
    } catch (err) {
      console.error("清空購物車失敗:", err)
      setError("清空購物車失敗")
      return false
    }
  }, [getUserId])

  // 初始載入
  useEffect(() => {
    loadCart()
  }, [loadCart])

  return {
    cart,
    loading,
    error,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    refreshCart: loadCart
  }
} 