"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ReorderTestPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const checkStatus = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/reorder-rid')
            const data = await response.json()
            setResult(data)
        } catch (error) {
            console.error('檢查失敗:', error)
        } finally {
            setLoading(false)
        }
    }

    const reorderRid = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/reorder-rid', {
                method: 'POST'
            })
            const data = await response.json()
            setResult(data)
        } catch (error) {
            console.error('重新排序失敗:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">餐廳rid重新排序</h1>
                <p className="text-muted-foreground">將餐廳rid重新排序為從1開始的連續編號</p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>操作</CardTitle>
                        <CardDescription>檢查當前狀況或執行重新排序</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button onClick={checkStatus} disabled={loading}>
                                {loading ? "檢查中..." : "檢查當前狀況"}
                            </Button>
                            <Button onClick={reorderRid} disabled={loading} variant="destructive">
                                {loading ? "處理中..." : "執行重新排序"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {result && (
                    <Card>
                        <CardHeader>
                            <CardTitle>結果</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <p className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {result.success ? '✅ 成功' : '❌ 失敗'}
                                    </p>
                                    <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                                        {result.message}
                                    </p>
                                </div>

                                {result.success && (
                                    <>
                                        {result.currentRids && (
                                            <div>
                                                <h3 className="font-semibold mb-2">當前rid狀況</h3>
                                                <p>總餐廳數: {result.totalRestaurants}</p>
                                                <p>是否連續: {result.isSequential ? '是' : '否'}</p>
                                                <p>當前rid: [{result.currentRids.join(', ')}]</p>
                                            </div>
                                        )}

                                        {result.oldRids && result.newRids && (
                                            <div>
                                                <h3 className="font-semibold mb-2">重新排序結果</h3>
                                                <p>舊的rid: [{result.oldRids.join(', ')}]</p>
                                                <p>新的rid: [{result.newRids.join(', ')}]</p>
                                                <p>總餐廳數: {result.totalRestaurants}</p>
                                                <p>總菜單項目: {result.totalMenuItems}</p>
                                            </div>
                                        )}

                                        {result.updatedRestaurants && (
                                            <div>
                                                <h3 className="font-semibold mb-2">更新後的餐廳列表</h3>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {result.updatedRestaurants.map((restaurant: any) => (
                                                        <div key={restaurant.rid} className="text-sm">
                                                            ID: {restaurant.rid} - {restaurant.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {result.menuCounts && (
                                            <div>
                                                <h3 className="font-semibold mb-2">菜單統計</h3>
                                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                                    {result.menuCounts.map((menu: any) => (
                                                        <div key={menu.rid} className="text-sm">
                                                            餐廳 {menu.rid}: {menu.menu_count} 道菜
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
} 