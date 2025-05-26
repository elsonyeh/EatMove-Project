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
    mid: number
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
    const { toast } = useToast()

    // 從localStorage載入購物車
    useEffect(() => {
        const savedCart = localStorage.getItem(`cart_${restaurantId}`)
        if (savedCart) {
            setCartItems(JSON.parse(savedCart))
        }
    }, [restaurantId])

    // 儲存購物車到localStorage
    useEffect(() => {
        localStorage.setItem(`cart_${restaurantId}`, JSON.stringify(cartItems))
    }, [cartItems, restaurantId])

    // 添加商品到購物車
    const addToCart = (item: Omit<CartItem, 'quantity'>) => {
        setCartItems(prev => {
            const existingItem = prev.find(cartItem => cartItem.mid === item.mid)
            if (existingItem) {
                return prev.map(cartItem =>
                    cartItem.mid === item.mid
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                )
            } else {
                return [...prev, { ...item, quantity: 1 }]
            }
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
    const updateQuantity = (mid: number, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(mid)
            return
        }
        setCartItems(prev =>
            prev.map(item =>
                item.mid === mid ? { ...item, quantity: newQuantity } : item
            )
        )
    }

    // 移除商品
    const removeFromCart = (mid: number) => {
        setCartItems(prev => prev.filter(item => item.mid !== mid))
    }

    // 更新特殊要求
    const updateSpecialInstructions = (mid: number, instructions: string) => {
        setCartItems(prev =>
            prev.map(item =>
                item.mid === mid ? { ...item, specialInstructions: instructions } : item
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

        // 獲取用戶ID（這裡使用硬編碼，實際應該從登入狀態獲取）
        const uid = localStorage.getItem('userId') || '1'

        setIsSubmitting(true)

        try {
            const orderData = {
                uid: parseInt(uid),
                rid: restaurantId,
                items: cartItems.map(item => ({
                    mid: item.mid,
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
                    description: "您的訂單已成功提交！"
                })
                setCartItems([])
                setDeliveryAddress("")
                setOrderNotes("")
                setIsOpen(false)
                localStorage.removeItem(`cart_${restaurantId}`)
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
                                        <div key={item.mid} className="flex items-start space-x-3 p-3 border rounded-lg">
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
                                                        onClick={() => removeFromCart(item.mid)}
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
                                                            onClick={() => updateQuantity(item.mid, item.quantity - 1)}
                                                        >
                                                            <Minus className="h-3 w-3" />
                                                        </Button>
                                                        <span className="w-8 text-center">{item.quantity}</span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => updateQuantity(item.mid, item.quantity + 1)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Input
                                                    placeholder="特殊要求（選填）"
                                                    value={item.specialInstructions || ""}
                                                    onChange={(e) => updateSpecialInstructions(item.mid, e.target.value)}
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