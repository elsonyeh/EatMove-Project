"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"

export default function TestDatabasePage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [dbInfo, setDbInfo] = useState<any>(null)

    const checkDatabase = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/check-missing-fields')
            const data = await response.json()

            if (data.success) {
                setDbInfo(data)
                toast({
                    title: "檢查完成",
                    description: `找到 ${data.summary.totalRestaurants} 家餐廳，${data.summary.totalMenuItems} 道菜`,
                })
            } else {
                throw new Error(data.message)
            }
        } catch (error: any) {
            toast({
                title: "檢查失敗",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const addMissingFields = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/check-missing-fields', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'add_missing_fields' }),
            })

            const data = await response.json()

            if (data.success) {
                toast({
                    title: "添加成功",
                    description: data.message,
                })
                // 重新檢查資料庫
                checkDatabase()
            } else {
                throw new Error(data.message)
            }
        } catch (error: any) {
            toast({
                title: "添加失敗",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const reorderRestaurantRid = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/check-missing-fields', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'reorder_restaurant_rid' }),
            })

            const data = await response.json()

            if (data.success) {
                toast({
                    title: "重新排序成功",
                    description: data.message,
                })
                // 重新檢查資料庫
                checkDatabase()
            } else {
                throw new Error(data.message)
            }
        } catch (error: any) {
            toast({
                title: "重新排序失敗",
                description: error.message,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">資料庫檢查與管理</h1>
                <p className="text-muted-foreground">檢查資料庫欄位對應、缺少的欄位，並重新排序餐廳rid</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>資料庫操作</CardTitle>
                        <CardDescription>檢查和管理資料庫結構</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2 flex-wrap">
                            <Button onClick={checkDatabase} disabled={loading}>
                                {loading ? "檢查中..." : "檢查資料庫"}
                            </Button>
                            <Button onClick={addMissingFields} disabled={loading || !dbInfo?.summary?.hasMissingFields} variant="outline">
                                {loading ? "處理中..." : "添加缺少的欄位"}
                            </Button>
                            <Button onClick={reorderRestaurantRid} disabled={loading} variant="secondary">
                                {loading ? "處理中..." : "重新排序餐廳rid"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {dbInfo && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>資料庫摘要</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{dbInfo.summary.totalRestaurants}</div>
                                        <div className="text-sm text-muted-foreground">餐廳數量</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{dbInfo.summary.totalMenuItems}</div>
                                        <div className="text-sm text-muted-foreground">菜單項目</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">
                                            {dbInfo.summary.hasMissingFields ? "有" : "無"}
                                        </div>
                                        <div className="text-sm text-muted-foreground">缺少欄位</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>欄位檢查結果</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {Object.entries(dbInfo.missingFields).map(([table, fields]: [string, any]) => (
                                        <div key={table}>
                                            <h3 className="font-semibold mb-2 capitalize">{table} 表</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {dbInfo.existingFields[table].map((field: string) => (
                                                    <Badge key={field} variant="secondary">{field}</Badge>
                                                ))}
                                            </div>
                                            {fields.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-red-600 mb-1">缺少的欄位:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {fields.map((field: string) => (
                                                            <Badge key={field} variant="destructive">{field}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>餐廳資料 ({dbInfo.restaurantData.length}家)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {dbInfo.restaurantData.map((restaurant: any) => (
                                        <div key={restaurant.rid} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-semibold">ID: {restaurant.rid} - {restaurant.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline">{restaurant.cuisine}</Badge>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        評分: {restaurant.rating} | 最低消費: ${restaurant.min_order}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                電話: {restaurant.phone} | Email: {restaurant.email}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>菜單資料 ({dbInfo.menuData.length}道菜)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {dbInfo.menuData.reduce((acc: any, menu: any) => {
                                        const existing = acc.find((item: any) => item.rid === menu.rid);
                                        if (existing) {
                                            existing.count++;
                                        } else {
                                            acc.push({
                                                rid: menu.rid,
                                                restaurant_name: menu.restaurant_name,
                                                count: 1
                                            });
                                        }
                                        return acc;
                                    }, []).map((item: any) => (
                                        <div key={item.rid} className="flex justify-between items-center border-b pb-2">
                                            <span>餐廳 {item.rid}: {item.restaurant_name}</span>
                                            <Badge variant="outline">{item.count} 道菜</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
} 