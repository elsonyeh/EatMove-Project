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
    dishId: number
    name: string
    price: number
    quantity: number
    image: string
    specialInstructions?: string
}

interface CartProps {
    restaurantId: number
    restaurantName: string
    minOrder: number
    deliveryFee: number
    onOrderSuccess?: () => void
}

export interface CartRef {
    addToCart: (item: Omit<CartItem, 'quantity'>) => void
}

const Cart = forwardRef<CartRef, CartProps>(({ restaurantId, restaurantName, minOrder, deliveryFee, onOrderSuccess }, ref) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [deliveryAddress, setDeliveryAddress] = useState("")
    const [orderNotes, setOrderNotes] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const { toast } = useToast()

    // 從localStorage載入購物車
    useEffect(() => {
        const savedCart = localStorage.getItem(`cart_${restaurantId}`)
        console.log(`🛒 載入購物車 (餐廳${restaurantId}):`, savedCart)
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart)
                setCartItems(parsedCart)
                console.log(`✅ 購物車載入成功:`, parsedCart)
            } catch (error) {
                console.error(`❌ 購物車載入失敗:`, error)
            }
        }
        setIsInitialized(true)
    }, [restaurantId])

    // 儲存購物車到localStorage（只有在初始化完成後才儲存）
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems))
            console.log(`💾 購物車已儲存 (餐廳${restaurantId}):`, cartItems)
        }
    }, [cartItems, restaurantId, isInitialized])

    // 添加商品到購物車
    const addToCart = (item: Omit<CartItem, 'quantity'>) => {
        console.log(`🛒 添加商品到購物車:`, item)
        setCartItems(prev => {
            const existingItem = prev.find(cartItem => cartItem.dishId === item.dishId)
            let newCartItems
            if (existingItem) {
                newCartItems = prev.map(cartItem =>
                    cartItem.dishId === item.dishId
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
                console.log(`📈 商品數量增加:`, newCartItems)
            } else {
                newCartItems = [...prev, { ...item, quantity: 1 }]
                console.log(`➕ 新增商品:`, newCartItems)
            }
            return newCartItems
        })
        toast({
            title: "已加入購物車",
            description: `${item.name} 已加入購物車`
        })
    }

    // 暴露方法給父組件
    useImperativeHandle(ref, () => ({
        addToCart
    }))

    // 更新商品數量
    const updateQuantity = (dishId: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(dishId)
            return
        }
        setCartItems(prev =>
            prev.map(item =>
                item.dishId === dishId ? { ...item, quantity: newQuantity } : item
            )
        )
    }

    // 移除商品
    const removeFromCart = (dishId: number) => {
        setCartItems(prev => prev.filter(item => item.dishId !== dishId))
    }

    // 更新特殊要求
    const updateSpecialInstructions = (dishId: number, instructions: string) => {
        setCartItems(prev =>
            prev.map(item =>
                item.dishId === dishId ? { ...item, specialInstructions: instructions } : item
            )
        )
    }

    // 計算總價
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
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

        // 獲取用戶ID
        const uid = localStorage.getItem('userId')
        if (!uid) {
            toast({
                title: "錯誤",
                description: "請先登入",
                variant: "destructive"
            })
            return
        }

        console.log(`👤 用戶ID:`, uid)
        console.log(`🛒 購物車商品:`, cartItems)
        console.log(`📍 外送地址:`, deliveryAddress)
        console.log(`💰 總金額:`, total)

        setIsSubmitting(true)

        try {
            const orderData = {
                uid: uid, // 直接使用字符串格式的用戶ID
                rid: restaurantId,
                items: cartItems.map(item => ({
                    dishId: item.dishId,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    subtotal: item.price * item.quantity,
                    specialInstructions: item.specialInstructions
                })),
                deliveryAddress,
                totalAmount: total,
                deliveryFee,
                notes: orderNotes
            }

            console.log(`📦 準備提交訂單:`, orderData)

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData)
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "訂單提交成功",
                    description: `訂單 #${result.orderId} 已成功提交！`
                })

                // 清空購物車
                setCartItems([])
                setDeliveryAddress("")
                setOrderNotes("")
                setIsOpen(false)

                // 清除本地存儲
                localStorage.removeItem(`cart_${restaurantId}`)

                // 清除數據庫購物車
                try {
                    const clearResponse = await fetch('/api/cart', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ uid })
                    })
                    console.log("🗑️ 清除數據庫購物車結果:", await clearResponse.json())
                } catch (clearError) {
                    console.error("清除數據庫購物車失敗:", clearError)
                }

                onOrderSuccess?.()

                // 跳轉到訂單詳情頁面
                if (typeof window !== 'undefined') {
                    setTimeout(() => {
                        window.location.href = `/user/orders/${result.orderId}`
                    }, 1500)
                }
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
        <>
            {/* 購物車按鈕 */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg"
                size="lg"
            >
                <ShoppingCart className="h-6 w-6" />
                {itemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center">
                        {itemCount}
                    </Badge>
                )}
            </Button>

            {/* 購物車彈窗 */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>購物車 - {restaurantName}</span>
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                                    ✕
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 overflow-y-auto max-h-[60vh]">
                            {cartItems.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">購物車是空的</p>
                            ) : (
                                <>
                                    {cartItems.map((item) => (
                                        <div key={item.dishId} className="flex items-start space-x-3 p-3 border rounded-lg">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium">{item.name}</h4>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeFromCart(item.dishId)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">${item.price}</span>
                                                    <div className="flex items-center space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Input
                                                    placeholder="特殊要求（選填）"
                                                    value={item.specialInstructions || ""}
                                                    onChange={(e) => updateSpecialInstructions(item.dishId, e.target.value)}
                                                    className="text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="space-y-3 pt-4 border-t">
                                        <div>
                                            <Label htmlFor="address">外送地址 *</Label>
                                            <Input
                                                id="address"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="請輸入詳細地址"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="notes">訂單備註</Label>
                                            <Textarea
                                                id="notes"
                                                value={orderNotes}
                                                onChange={(e) => setOrderNotes(e.target.value)}
                                                placeholder="其他要求（選填）"
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-4 border-t">
                                        <div className="flex justify-between text-sm">
                                            <span>小計</span>
                                            <span>${subtotal}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>外送費</span>
                                            <span>${deliveryFee}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold">
                                            <span>總計</span>
                                            <span>${total}</span>
                                        </div>
                                        {subtotal < minOrder && (
                                            <p className="text-sm text-red-500">
                                                最低訂購金額 ${minOrder}，還差 ${minOrder - subtotal}
                                            </p>
                                        )}
                                    </div>

                                    <Button
                                        onClick={submitOrder}
                                        disabled={isSubmitting || subtotal < minOrder || !deliveryAddress.trim()}
                                        className="w-full"
                                    >
                                        {isSubmitting ? "提交中..." : `確認訂單 $${total}`}
                                    </Button>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </>
    )
})

Cart.displayName = 'Cart'

export default Cart 