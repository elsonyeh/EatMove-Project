"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { menuItems } from "@/lib/data"
import { useRestaurantAuth } from "@/components/restaurant-auth-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function RestaurantProductsPage() {
  const { toast } = useToast()
  const { account } = useRestaurantAuth()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    image: "",
    isAvailable: true,
  })

  useEffect(() => {
    if (account) {
      // 模擬加載數據
      setTimeout(() => {
        // 根據餐廳ID過濾菜單項目
        const filteredProducts = menuItems.filter((item) => item.restaurantId === account.restaurantId)
        setProducts(filteredProducts)
        setLoading(false)
      }, 800)
    }
  }, [account])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      isAvailable: checked,
    })
  }

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    })
  }

  const openAddDialog = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
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
      category: product.category || "",
      image: product.image || "",
      isAvailable: product.isAvailable !== false,
    })
    setShowEditDialog(true)
  }

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      toast({
        title: "錯誤",
        description: "請填寫商品名稱和價格",
        variant: "destructive",
      })
      return
    }

    const newProduct = {
      id: `product-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: Number.parseFloat(formData.price),
      category: formData.category,
      image: formData.image || "/placeholder.svg?height=128&width=128",
      isAvailable: formData.isAvailable,
      restaurantId: account?.restaurantId,
    }

    setProducts([newProduct, ...products])
    setShowAddDialog(false)

    toast({
      title: "商品已新增",
      description: "商品已成功新增到菜單",
    })
  }

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      toast({
        title: "錯誤",
        description: "請填寫商品名稱和價格",
        variant: "destructive",
      })
      return
    }

    const updatedProducts = products.map((product) =>
      product.id === currentProduct.id
        ? {
            ...product,
            name: formData.name,
            description: formData.description,
            price: Number.parseFloat(formData.price),
            category: formData.category,
            image: formData.image || product.image,
            isAvailable: formData.isAvailable,
          }
        : product,
    )

    setProducts(updatedProducts)
    setShowEditDialog(false)

    toast({
      title: "商品已更新",
      description: "商品資訊已成功更新",
    })
  }

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter((product) => product.id !== id))

    toast({
      title: "商品已刪除",
      description: "商品已從菜單中移除",
    })
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">商品管理</h1>
          <p className="text-muted-foreground">管理您的菜單和商品</p>
        </div>
        <Button onClick={openAddDialog} className="bg-brand-primary hover:bg-brand-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          新增商品
        </Button>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">全部商品</TabsTrigger>
          <TabsTrigger value="main">主餐</TabsTrigger>
          <TabsTrigger value="side">配菜</TabsTrigger>
          <TabsTrigger value="drink">飲料</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full rounded-t-lg" />
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden border-none shadow-md">
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        product.image ||
                        `/placeholder.svg?height=192&width=384&text=${encodeURIComponent(product.name)}`
                      }
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">
                          已下架
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${product.price}</span>
                      <Badge variant="outline">{product.category || "未分類"}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編輯
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-xl">
              <h2 className="text-xl font-medium mb-2">尚無商品</h2>
              <p className="text-muted-foreground mb-4">點擊「新增商品」按鈕來添加您的第一個商品</p>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                新增商品
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="main" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((product) => product.category === "主餐")
              .map((product) => (
                <Card key={product.id} className="overflow-hidden border-none shadow-md">
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        product.image ||
                        `/placeholder.svg?height=192&width=384&text=${encodeURIComponent(product.name)}`
                      }
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">
                          已下架
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${product.price}</span>
                      <Badge variant="outline">{product.category || "未分類"}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編輯
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="side" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((product) => product.category === "配菜" || product.category === "小菜")
              .map((product) => (
                <Card key={product.id} className="overflow-hidden border-none shadow-md">
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        product.image ||
                        `/placeholder.svg?height=192&width=384&text=${encodeURIComponent(product.name)}`
                      }
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">
                          已下架
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${product.price}</span>
                      <Badge variant="outline">{product.category || "未分類"}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編輯
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="drink" className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products
              .filter((product) => product.category === "飲料")
              .map((product) => (
                <Card key={product.id} className="overflow-hidden border-none shadow-md">
                  <div className="relative h-48 w-full">
                    <Image
                      src={
                        product.image ||
                        `/placeholder.svg?height=192&width=384&text=${encodeURIComponent(product.name)}`
                      }
                      alt={product.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {product.isAvailable === false && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-lg">
                          已下架
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-lg">${product.price}</span>
                      <Badge variant="outline">{product.category || "未分類"}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      編輯
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新增商品</DialogTitle>
            <DialogDescription>填寫以下資訊以新增商品到您的菜單</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">商品名稱</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="請輸入商品名稱"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">商品描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="請輸入商品描述"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">價格</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  placeholder="請輸入價格"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">分類</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="主餐">主餐</SelectItem>
                    <SelectItem value="配菜">配菜</SelectItem>
                    <SelectItem value="飲料">飲料</SelectItem>
                    <SelectItem value="甜點">甜點</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="image">圖片網址</Label>
                <Input
                  id="image"
                  name="image"
                  placeholder="請輸入圖片網址"
                  value={formData.image}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="isAvailable" checked={formData.isAvailable} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="isAvailable">上架商品</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">新增商品</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>編輯商品</DialogTitle>
            <DialogDescription>修改商品資訊</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProduct}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">商品名稱</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="請輸入商品名稱"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">商品描述</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="請輸入商品描述"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">價格</Label>
                <Input
                  id="edit-price"
                  name="price"
                  type="number"
                  placeholder="請輸入價格"
                  value={formData.price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">分類</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="主餐">主餐</SelectItem>
                    <SelectItem value="配菜">配菜</SelectItem>
                    <SelectItem value="飲料">飲料</SelectItem>
                    <SelectItem value="甜點">甜點</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-image">圖片網址</Label>
                <Input
                  id="edit-image"
                  name="image"
                  placeholder="請輸入圖片網址"
                  value={formData.image}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="edit-isAvailable" checked={formData.isAvailable} onCheckedChange={handleSwitchChange} />
                <Label htmlFor="edit-isAvailable">上架商品</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">儲存變更</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
