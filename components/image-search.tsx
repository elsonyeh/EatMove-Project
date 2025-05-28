"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Upload, Search, Trash2, Loader2, ImageIcon, Sparkles, ChefHat, Star, MapPin, Clock, DollarSign } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface FoodClassification {
    category: string
    confidence: number
    foodType: string
    description: string
}

interface MenuMatch {
    name: string
    price: number
    category: string
}

interface RestaurantRecommendation {
    rid: number
    rname: string
    raddress: string
    image: string
    rating: number
    cuisine: string
    deliveryTime: string
    deliveryFee: number
    matchReason: string
    matchScore: number
    distance?: string
    menuMatches: MenuMatch[]
}

interface ImageSearchProps {
    onClose?: () => void
    isOpen?: boolean
}

// 食物分類映射
const FOOD_CATEGORIES = {
    "中式料理": ["飯", "麵", "粥", "餃子", "包子", "炒飯", "炒麵", "湯麵", "乾麵"],
    "日式料理": ["壽司", "拉麵", "烏龍麵", "丼飯", "天婦羅", "味噌湯"],
    "西式料理": ["漢堡", "披薩", "義大利麵", "牛排", "沙拉", "三明治"],
    "韓式料理": ["韓式料理", "泡菜", "石鍋拌飯", "韓式烤肉"],
    "東南亞料理": ["泰式料理", "越南料理", "咖哩", "河粉"],
    "點心甜品": ["蛋糕", "甜點", "冰淇淋", "飲料", "奶茶"],
    "小吃類": ["雞排", "鹽酥雞", "臭豆腐", "滷味", "關東煮"]
}

export function ImageSearch({ onClose, isOpen = false }: ImageSearchProps) {
    const router = useRouter()
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [thumbnail, setThumbnail] = useState<string>("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [foodClassification, setFoodClassification] = useState<FoodClassification | null>(null)
    const [recommendations, setRecommendations] = useState<RestaurantRecommendation[]>([])

    const handleFileSelect = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast({
                title: "錯誤",
                description: "請選擇圖片檔案",
                variant: "destructive",
            })
            return
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({
                title: "錯誤",
                description: "圖片檔案大小不能超過 10MB",
                variant: "destructive",
            })
            return
        }

        try {
            setSelectedFile(file)

            // 生成縮略圖
            const reader = new FileReader()
            reader.onload = (e) => {
                if (e.target?.result) {
                    setThumbnail(e.target.result as string)
                }
            }
            reader.readAsDataURL(file)

            // 重置之前的結果
            setFoodClassification(null)
            setRecommendations([])

            toast({
                title: "圖片載入成功",
                description: "圖片已載入，可以開始分析食物類型",
            })
        } catch (error) {
            console.error("處理圖片失敗:", error)
            toast({
                title: "錯誤",
                description: "處理圖片失敗，請重試",
                variant: "destructive",
            })
        }
    }, [toast])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const file = e.dataTransfer.files?.[0]
        if (file) {
            handleFileSelect(file)
        }
    }, [handleFileSelect])

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
    }

    const handleAnalyze = async () => {
        if (!selectedFile) {
            toast({
                title: "錯誤",
                description: "請先選擇圖片",
                variant: "destructive",
            })
            return
        }

        setIsAnalyzing(true)
        setFoodClassification(null)
        setRecommendations([])

        // 顯示分析開始提示
        toast({
            title: "🤖 開始分析",
            description: "正在使用AI識別圖片中的食物類型...",
        })

        try {
            // 準備FormData
            const formData = new FormData()
            formData.append("image", selectedFile)

            // 調用新的AI食物分類API
            const response = await fetch('/api/ai/food-classification', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (!data.success) {
                throw new Error(data.message || "分析失敗")
            }

            // 設置分類結果
            setFoodClassification(data.classification)

            // 顯示分類結果
            toast({
                title: "🎯 識別完成！",
                description: `識別為 ${data.classification.foodType}（${data.classification.category}），信心度 ${data.classification.confidence}%`,
            })

            // 設置餐廳推薦
            setRecommendations(data.recommendations)

            if (data.recommendations.length === 0) {
                toast({
                    title: "😔 暫無推薦",
                    description: `目前沒有找到專門提供 ${data.classification.category} 的餐廳，請稍後再試`,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "🎉 推薦完成！",
                    description: `為您推薦了 ${data.recommendations.length} 家${data.classification.category}餐廳`,
                })
            }

        } catch (error) {
            console.error("❌ 分析失敗:", error)
            toast({
                title: "❌ 分析失敗",
                description: error instanceof Error ? error.message : "分析過程中發生錯誤，請重試",
                variant: "destructive",
            })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleClear = () => {
        setSelectedFile(null)
        setThumbnail("")
        setFoodClassification(null)
        setRecommendations([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }

        toast({
            title: "🗑️ 已清除",
            description: "圖片和分析結果已清除",
        })
    }

    const handleRestaurantClick = (recommendation: RestaurantRecommendation) => {
        toast({
            title: "🎯 跳轉到餐廳",
            description: `正在前往 ${recommendation.rname}`,
        })

        router.push(`/user/restaurant/${recommendation.rid}`)
        if (onClose) onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ChefHat className="h-5 w-5 mr-2 text-brand-primary" />
                        AI 以圖搜餐 - 精準推薦
                    </DialogTitle>
                    <DialogDescription>
                        上傳食物照片，AI會精準識別食物類型並推薦有該料理的餐廳
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4 max-h-[calc(90vh-120px)] overflow-y-auto">
                    {/* 圖片上傳區域 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center">
                                <Camera className="h-5 w-5 mr-2 text-brand-primary" />
                                上傳食物照片
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedFile ? (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">點擊或拖拽上傳食物照片</p>
                                    <p className="text-sm text-gray-500">
                                        支援 JPG、PNG、WebP 格式，最大 10MB<br />
                                        AI會自動識別食物類型並推薦有該料理的餐廳
                                    </p>
                                    <Button className="mt-4" variant="outline">
                                        <Upload className="h-4 w-4 mr-2" />
                                        選擇食物照片
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            {thumbnail && (
                                                <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                                                    <Image
                                                        src={thumbnail}
                                                        alt="預覽圖"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-medium">{selectedFile.name}</p>
                                                <p className="text-sm text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleClear}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            移除
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="w-full bg-brand-primary hover:bg-brand-primary/90"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                AI 分析中...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                開始 AI 食物識別
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </CardContent>
                    </Card>

                    {/* 分析結果 */}
                    {foodClassification && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Sparkles className="h-5 w-5 mr-2 text-brand-primary" />
                                    AI 識別結果
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-sm text-gray-600">料理類型</p>
                                        <p className="text-lg font-bold text-blue-600">{foodClassification.category}</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-sm text-gray-600">具體食物</p>
                                        <p className="text-lg font-bold text-green-600">{foodClassification.foodType}</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <p className="text-sm text-gray-600">信心度</p>
                                        <p className="text-lg font-bold text-purple-600">{foodClassification.confidence}%</p>
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">{foodClassification.description}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 餐廳推薦 */}
                    {recommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <Search className="h-5 w-5 mr-2 text-brand-primary" />
                                        精準餐廳推薦
                                    </div>
                                    <Badge variant="secondary">
                                        {recommendations.length} 家餐廳
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    {recommendations.map((recommendation, index) => (
                                        <div
                                            key={`${recommendation.rid}-${index}`}
                                            className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleRestaurantClick(recommendation)}
                                        >
                                            {/* 餐廳圖片 */}
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={recommendation.image}
                                                    alt={recommendation.rname}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/images/restaurants/default.jpg"
                                                    }}
                                                />
                                            </div>

                                            {/* 餐廳資訊 */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg truncate">{recommendation.rname}</h3>
                                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                            <Badge variant="outline" className="text-xs">
                                                                {recommendation.cuisine}
                                                            </Badge>
                                                            <div className="flex items-center">
                                                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                                                <span>{recommendation.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant="default"
                                                        className="bg-brand-primary text-white"
                                                    >
                                                        匹配度 {recommendation.matchScore}%
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <MapPin className="h-3 w-3 mr-1" />
                                                        <span className="truncate">{recommendation.raddress}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        <span>{recommendation.deliveryTime}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <DollarSign className="h-3 w-3 mr-1" />
                                                        <span>外送費 NT${recommendation.deliveryFee}</span>
                                                    </div>
                                                    <div className="text-sm text-brand-primary font-medium">
                                                        {recommendation.matchReason}
                                                    </div>
                                                </div>

                                                {/* 相關菜品 */}
                                                {recommendation.menuMatches.length > 0 && (
                                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                                        <p className="text-sm font-medium text-blue-800 mb-2">
                                                            相關菜品：
                                                        </p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {recommendation.menuMatches.map((menu, idx) => (
                                                                <Badge
                                                                    key={idx}
                                                                    variant="secondary"
                                                                    className="text-xs bg-blue-100 text-blue-700"
                                                                >
                                                                    {menu.name} - NT${menu.price}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
} 