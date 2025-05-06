"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/hooks/use-cart"

export default function UserCheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const { cart, getSubtotal, clearCart, mounted } = useCart()

  // 計算訂單金額
  const subtotal = getSubtotal()
  const deliveryFee = 60
  const total = subtotal + deliveryFee

  // 修改handleSubmitOrder函數，先導向訂單詳情頁，再清空購物車
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault()

    // 生成訂單ID (這裡使用簡單的隨機數字)
    const orderId = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")

    toast({
      title: "訂單已送出",
      description: "您的訂單已成功送出，店家正在準備中",
    })

    // 先導向訂單詳情頁，再清空購物車
    router.push(`/user/orders/${orderId}`)

    // 延遲清空購物車，確保導航完成後再清空
    setTimeout(() => {
      clearCart()
    }, 500)
  }

  // 等待客戶端渲染
  if (!mounted) {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">結帳</h1>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  // 如果購物車為空，導回購物車頁面
  if (cart.items.length === 0) {
    router.push("/user/cart")
    return null
  }

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">結帳</h1>
        <p className="text-muted-foreground">完成您的訂單</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>配送資訊</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">姓名</Label>
                    <Input id="name" placeholder="請輸入姓名" defaultValue="王小明" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話</Label>
                    <Input id="phone" placeholder="請輸入電話" defaultValue="0912345678" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">地址</Label>
                  <Input id="address" placeholder="請輸入地址" defaultValue="台北市信義區信義路五段7號" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">備註</Label>
                  <Textarea id="notes" placeholder="有任何特殊要求嗎？" />
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>付款方式</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">貨到付款</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit" id="credit" />
                  <Label htmlFor="credit">信用卡付款</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crypto" id="crypto" />
                  <Label htmlFor="crypto">虛擬代幣交易</Label>
                </div>
              </RadioGroup>

              {paymentMethod === "credit" && (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber">卡號</Label>
                      <Input id="cardNumber" placeholder="請輸入卡號" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardName">持卡人姓名</Label>
                      <Input id="cardName" placeholder="請輸入持卡人姓名" />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">到期日</Label>
                      <Input id="expiry" placeholder="MM/YY" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">安全碼</Label>
                      <Input id="cvc" placeholder="CVC" />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "crypto" && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="walletAddress">錢包地址</Label>
                    <Input id="walletAddress" placeholder="請輸入錢包地址" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.name} x {item.quantity}
                  </span>
                  <span>${item.price * item.quantity}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span>小計</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>外送費</span>
                <span>${deliveryFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>總計</span>
                <span>${total}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSubmitOrder}>
                確認訂單
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
