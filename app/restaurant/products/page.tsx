"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRestaurantAuth } from "@/components/restaurant-auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function RestaurantProductsPage() {
  const { toast } = useToast()
  const { account } = useRestaurantAuth()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "主餐" | "配菜" | "飲料">("all")

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "主餐",
    image: "",
    isAvailable: true,
  })

  useEffect(() => {
    async function fetchProducts() {
      if (!account?.restaurantId) {
        console.error("❌ 無法取得餐廳帳號資訊")
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`/api/products?rid=${account.restaurantId}`)
        if (!res.ok) throw new Error(`伺服器錯誤 (${res.status})`)
        const data = await res.json()
        const items = (data.items || []).map((p: any) => ({
          ...p,
          price: typeof p.price === "string" ? parseFloat(p.price) : p.price,
          dishid: typeof p.dishid === "string" ? parseInt(p.dishid, 10) : p.dishid,
        }))
        setProducts(items)
      } catch (err) {
        console.error("❌ 載入商品失敗：", err)
        toast({ title: "載入失敗", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [account, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const openAddDialog = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "主餐",
      image: "",
      isAvailable: true,
    })
    setShowAddDialog(true)
  }

  const openEditDialog = (product: any) => {
    setCurrentProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      image: product.image,
      isAvailable: product.isavailable,
    })
    setShowEditDialog(true)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.price) {
      toast({ title: "錯誤", description: "請填寫商品名稱和價格", variant: "destructive" })
      return
    }
    const newProduct = {
      rid: account!.restaurantId,
      dishid: Math.floor(Date.now() / 1000),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image || "/placeholder.svg?height=128&width=128",
      isavailable: formData.isAvailable,
      ispopular: true,
    }
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      })
      const data = await res.json()
      if (data.success) {
        setProducts(prev => [data.item, ...prev])
        setShowAddDialog(false)
        toast({ title: "✅ 商品已新增" })
      } else {
        toast({ title: "❌ 新增失敗", description: data.message, variant: "destructive" })
      }
    } catch (err) {
      console.error("❌ 新增商品失敗：", err)
      toast({ title: "伺服器錯誤", variant: "destructive" })
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentProduct) return
    const updated = {
      rid: account!.restaurantId,
      dishid: currentProduct.dishid,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      image: formData.image,
      isavailable: formData.isAvailable,
    }
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
      const data = await res.json()
      if (data.success) {
        setProducts(prev => prev.map(p => p.dishid === updated.dishid ? data.item : p))
        setShowEditDialog(false)
        toast({ title: "✅ 商品已更新" })
      } else {
        toast({ title: "❌ 更新失敗", description: data.message, variant: "destructive" })
      }
    } catch (err) {
      console.error("❌ 更新商品失敗：", err)
      toast({ title: "伺服器錯誤", variant: "destructive" })
    }
  }

  const handleDeleteProduct = async (dishid: number) => {
    if (!window.confirm("確定要刪除這個商品嗎？")) return
    try {
      const res = await fetch("/api/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid: account!.restaurantId, dishid }),
      })
      const data = await res.json()
      if (data.success) {
        setProducts(prev => prev.filter(p => Number(p.dishid) !== Number(dishid)))
        toast({ title: "✅ 商品已刪除" })
      } else {
        toast({ title: "❌ 刪除失敗", description: data.message, variant: "destructive" })
      }
    } catch (err) {
      console.error("❌ 刪除商品失敗：", err)
      toast({ title: "伺服器錯誤", variant: "destructive" })
    }
  }

  const filtered = products.filter(p => tab === "all" || p.category === tab)

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">商品管理</h1>
          <p className="text-muted-foreground">管理您的菜單和商品</p>
        </div>
        <Button onClick={openAddDialog} className="bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="mr-2 h-4 w-4" /> 新增商品
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">全部商品</TabsTrigger>
          <TabsTrigger value="主餐">主餐</TabsTrigger>
          <TabsTrigger value="配菜">配菜</TabsTrigger>
          <TabsTrigger value="飲料">飲料</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="w-full h-40" />
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">目前沒有商品</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(product => (
            <Card key={product.dishid}>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Image
                  src={product.image}
                  alt={product.name}
                  width={128}
                  height={128}
                  className="rounded-md mb-4"
                />
                <p className="font-semibold mb-2">
                  價格：${Number(product.price).toFixed(2)}
                </p>
                <Badge variant={product.isavailable ? "outline" : "destructive"}>
                  {product.isavailable ? "可供應" : "暫停供應"}
                </Badge>
                <Badge className="ml-2" variant="secondary">
                  {product.category}
                </Badge>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => openEditDialog(product)}>
                  <Pencil className="mr-2 h-4 w-4" /> 編輯
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteProduct(product.dishid)}>
                  <Trash2 className="mr-2 h-4 w-4" /> 刪除
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 新增商品 Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增商品</DialogTitle>
            <DialogDescription>填寫以下欄位以新增商品</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct} className="space-y-4">
            <Label>名稱</Label>
            <Input name="name" value={formData.name} onChange={handleInputChange} required />
            <Label>描述</Label>
            <Textarea name="description" value={formData.description} onChange={handleInputChange} />
            <Label>價格</Label>
            <Input name="price" type="number" value={formData.price} onChange={handleInputChange} required />
            <Label>類別</Label>
            <Input name="category" value={formData.category} onChange={handleInputChange} />
            <Label>圖片 URL</Label>
            <Input name="image" value={formData.image} onChange={handleInputChange} />
            <div className="flex items-center space-x-2">
              <Label>是否供應</Label>
              <Switch
                checked={formData.isAvailable}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, isAvailable: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">確認新增</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 編輯商品 Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯商品</DialogTitle>
            <DialogDescription>修改以下欄位以更新商品資料</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4">
            <Label>名稱</Label>
            <Input name="name" value={formData.name} onChange={handleInputChange} required />
            <Label>描述</Label>
            <Textarea name="description" value={formData.description} onChange={handleInputChange} />
            <Label>價格</Label>
            <Input name="price" type="number" value={formData.price} onChange={handleInputChange} required />
            <Label>類別</Label>
            <Input name="category" value={formData.category} onChange={handleInputChange} />
            <Label>圖片 URL</Label>
            <Input name="image" value={formData.image} onChange={handleInputChange} />
            <div className="flex items-center space-x-2">
              <Label>是否供應</Label>
              <Switch
                checked={formData.isAvailable}
                onCheckedChange={checked => setFormData(prev => ({ ...prev, isAvailable: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">確認更新</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
