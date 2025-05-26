"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react"

interface CartItem {
    cart_item_id: number
    mid: number
    name: string
    price: number
    quantity: number
    image: string
    description?: string
    specialInstructions?: string
    subtotal: number
}

interface CartProps {
    restaurantId: number
    restaurantName: string
    minOrder: number
    deliveryFee: number
    onOrderSuccess?: () => void
}

export interface CartRef {
    addToCart: (item: { mid: number; name: string; price: number; image: string; specialInstructions?: string }) => void
    refreshCart: () => void
}

const CartDB = forwardRef<CartRef, CartProps>(({ restaurantId, restaurantName, minOrder, deliveryFee, onOrderSuccess }, ref) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [orderNotes, setOrderNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    // 獲取用戶ID（這裡使用硬編碼，實際應該從登入狀態獲取）
    const uid = localStorage.getItem('userId') || '1'

    // 載入購物車
    const loadCart = async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/cart?uid=${uid}&rid=${restaurantId}`)
            const result = await response.json()

            if (result.success) {
                setCartItems(result.cart.items)
            } else {
                console.error("載入購物車失敗:", result.message)
            }
        } catch (error) {
            console.error("載入購物車失敗:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadCart()
    }, [restaurantId, uid])

    // 添加商品到購物車
    const addToCart = async (item: { mid: number; name: string; price: number; image: string; specialInstructions?: string }) => {
        try {
            const response = await fetch('/api/cart', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: parseInt(uid),
                    rid: restaurantId,
                    mid: item.mid,
                    quantity: 1,
                    specialInstructions: item.specialInstructions
                })
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "已加入購物車",
                    description: `${item.name} 已加入購物車`
                })
                loadCart() // 重新載入購物車
            } else {
                toast({
                    title: "加入購物車失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("加入購物車失敗:", error)
            toast({
                title: "加入購物車失敗",
                description: "網路錯誤，請稍後再試",
                variant: "destructive"
            })
        }
    }

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
        addToCart,
        refreshCart: loadCart
    }))

    // 更新商品數量
    const updateQuantity = async (cartItemId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(cartItemId)
            return
        }

        try {
            const response = await fetch(`/api/cart/${cartItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ quantity: newQuantity })
            })

            const result = await response.json()

            if (result.success) {
                loadCart() // 重新載入購物車
            } else {
                toast({
                    title: "更新失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("更新數量失敗:", error)
            toast({
                title: "更新失敗",
                description: "網路錯誤，請稍後再試",
                variant: "destructive"
            })
        }
    }

    // 移除商品
    const removeFromCart = async (cartItemId: number) => {
        try {
            const response = await fetch(`/api/cart/${cartItemId}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (result.success) {
                loadCart() // 重新載入購物車
                toast({
                    title: "已移除",
                    description: "商品已從購物車移除"
                })
            } else {
                toast({
                    title: "移除失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("移除商品失敗:", error)
            toast({
                title: "移除失敗",
                description: "網路錯誤，請稍後再試",
                variant: "destructive"
            })
        }
    }

    // 更新特殊要求
    const updateSpecialInstructions = async (cartItemId: number, instructions: string) => {
        try {
            const response = await fetch(`/api/cart/${cartItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ specialInstructions: instructions })
            })

            const result = await response.json()

            if (result.success) {
                loadCart() // 重新載入購物車
            } else {
                toast({
                    title: "更新失敗",
                    description: result.message,
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("更新特殊要求失敗:", error)
        }
    }

    // 計算總價
    const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0)
    const total = subtotal + deliveryFee
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    // 提交訂單
    const submitOrder = async () => {
        if (cartItems.length === 0) {
            toast({
                title: "錯誤",
                description: "購物車是空的",
                variant: "destructive"
            })
            return
        }

        if (subtotal < minOrder) {
            toast({
                title: "錯誤",
                description: `最低訂購金額為 $${minOrder}`,
                variant: "destructive"
            })
            return
        }

        if (!deliveryAddress.trim()) {
            toast({
                title: "錯誤",
                description: "請輸入外送地址",
                variant: "destructive"
            })
            return
        }

        setIsSubmitting(true)

        try {
            const orderData = {
                uid: parseInt(uid),
                rid: restaurantId,
                items: cartItems.map(item => ({
                    mid: item.mid,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    subtotal: item.subtotal,
                    specialInstructions: item.specialInstructions
                })),
                deliveryAddress,
                totalAmount: total,
                deliveryFee,
                notes: orderNotes
            }

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            })

            const result = await response.json()

            if (result.success) {
                // 清空購物車
                await fetch(`/api/cart?uid=${uid}&rid=${restaurantId}`, {
                    method: 'DELETE'
                })

                toast({
                    title: "訂單提交成功",
                    description: "您的訂單已成功提交！"
                })
                setCartItems([])
                setDeliveryAddress("")
                setOrderNotes("")
                setIsOpen(false)
                onOrderSuccess?.()
            } else {
                toast({
                    title: "訂單提交失敗",
                    description: result.message || "訂單提交失敗",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error("提交訂單失敗:", error)
            toast({
                title: "訂單提交失敗",
                description: "網路錯誤，請稍後再試",
                variant: "destructive"
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* 購物車按鈕 */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className="rounded-full w-16 h-16 shadow-lg"
                size="lg"
            >
                <div className="relative">
                    <ShoppingCart className="h-6 w-6" />
                    {itemCount > 0 && (
                        <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {itemCount}
                        </Badge>
                    )}
                </div>
            </Button>

            {/* 購物車面板 */}
            {isOpen && (
                <Card className="absolute bottom-20 right-0 w-96 max-h-[600px] shadow-xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                            <span>購物車</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {restaurantName}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="text-center py-4">載入中...</div>
                        ) : cartItems.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                購物車是空的
                            </div>
                        ) : (
                            <>
                                {/* 購物車項目 */}
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                    {cartItems.map((item) => (
                                        <div key={item.cart_item_id} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">{item.name}</h4>
                                                <p className="text-sm text-muted-foreground">${item.price}</p>
                                                {item.specialInstructions && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        備註: {item.specialInstructions}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.cart_item_id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center">{item.quantity}</span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFromCart(item.cart_item_id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 總計 */}
                                <div className="border-t pt-3 space-y-2">
                                    <div className="flex justify-between">
                                        <span>小計</span>
                                        <span>${subtotal}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>外送費</span>
                                        <span>${deliveryFee}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>總計</span>
                                        <span>${total}</span>
                                    </div>
                                </div>

                                {/* 最低訂購金額提示 */}
                                {subtotal < minOrder && (
                                    <div className="text-sm text-orange-600 bg-orange-50 p-2 rounded">
                                        還需要 ${minOrder - subtotal} 才能達到最低訂購金額
                                    </div>
                                )}

                                {/* 外送地址 */}
                                <div className="space-y-2">
                                    <Label htmlFor="address">外送地址</Label>
                                    <Input
                                        id="address"
                                        placeholder="請輸入外送地址"
                                        value={deliveryAddress}
                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                    />
                                </div>

                                {/* 訂單備註 */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">訂單備註</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="有什麼特殊要求嗎？"
                                        value={orderNotes}
                                        onChange={(e) => setOrderNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                {/* 提交按鈕 */}
                                <Button
                                    onClick={submitOrder}
                                    disabled={isSubmitting || subtotal < minOrder || !deliveryAddress.trim()}
                                    className="w-full"
                                >
                                    {isSubmitting ? "提交中..." : `提交訂單 $${total}`}
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    )
})

CartDB.displayName = "CartDB"

export default CartDB 