"use client"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Trash2, Plus, Minus } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/hooks/use-cart"

export default function UserCartPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { cart, updateQuantity, removeItem, clearCart, getSubtotal, mounted } = useCart()

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      toast({
        title: "購物車為空",
        description: "請先添加商品到購物車",
        variant: "destructive",
      })
      return
    }

    router.push("/user/checkout")
  }

  const handleClearCart = () => {
    if (cart.items.length === 0) return

    clearCart()
    toast({
      title: "購物車已清空",
      description: "所有商品已從購物車中移除",
    })
  }

  // Wait for client-side hydration
  if (!mounted) {
    return (
      <div className="container py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">購物車</h1>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const deliveryFee = 60
  const total = subtotal + deliveryFee

  return (
    <div className="container py-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">購物車</h1>
          <p className="text-muted-foreground">查看並編輯您的購物車商品</p>
        </div>
        {cart.items.length > 0 && (
          <Button
            variant="outline"
            onClick={handleClearCart}
            className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            清空購物車
          </Button>
        )}
      </div>

      {cart.items.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>購物車商品 ({cart.items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                      <Image
                        src={item.image || "/placeholder.svg?height=64&width=64"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.restaurantName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                        <span className="sr-only">減少</span>
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, Number.parseInt(e.target.value) || 1)}
                        className="h-8 w-12 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only">增加</span>
                      </Button>
                    </div>
                    <div className="w-20 text-right font-medium">${item.price * item.quantity}</div>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">刪除</span>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>訂單摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                <Button className="w-full" onClick={handleCheckout}>
                  前往結帳
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">您的購物車是空的</h2>
          <p className="text-muted-foreground mb-4">瀏覽店家並添加商品到購物車</p>
          <Button onClick={() => router.push("/user/home")} className="bg-brand-primary hover:bg-brand-primary/90">
            瀏覽店家
          </Button>
        </div>
      )}
    </div>
  )
}
