"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Upload, Search, Trash2, Loader2, ImageIcon, Sparkles, ChefHat } from "lucide-react"
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
    const [modelLoaded, setModelLoaded] = useState(false)

    // 載入TensorFlow.js模型
    useEffect(() => {
        const loadModel = async () => {
            try {
                // 這裡應該載入TensorFlow.js模型，暫時用模擬的方式
                console.log("🧠 載入食物分類模型中...")
                await new Promise(resolve => setTimeout(resolve, 1000)) // 模擬載入時間
                setModelLoaded(true)
                console.log("✅ 食物分類模型載入完成")
            } catch (error) {
                console.error("❌ 模型載入失敗:", error)
                toast({
                    title: "模型載入失敗",
                    description: "食物分類功能暫時無法使用",
                    variant: "destructive",
                })
            }
        }

        if (isOpen) {
            loadModel()
        }
    }, [isOpen, toast])

    const classifyFood = async (imageFile: File): Promise<FoodClassification> => {
        // 模擬食物分類結果
        // 在實際實作中，這裡會使用TensorFlow.js的MobileNet或專門的食物分類模型

        const foodTypes = [
            { category: "中式料理", foodType: "炒飯", confidence: 0.85, description: "看起來像是蛋炒飯或其他炒飯類料理" },
            { category: "中式料理", foodType: "湯麵", confidence: 0.78, description: "可能是牛肉麵、雞湯麵等湯麵類" },
            { category: "西式料理", foodType: "漢堡", confidence: 0.92, description: "經典的漢堡包，包含麵包、肉排和蔬菜" },
            { category: "日式料理", foodType: "拉麵", confidence: 0.88, description: "日式拉麵，濃郁的湯頭配上麵條" },
            { category: "西式料理", foodType: "披薩", confidence: 0.75, description: "義式披薩，薄餅皮搭配各種配料" },
            { category: "中式料理", foodType: "餃子", confidence: 0.82, description: "包餡的餃子，可能是水餃或煎餃" },
            { category: "點心甜品", foodType: "蛋糕", confidence: 0.79, description: "甜點蛋糕，適合當作餐後甜品" },
            { category: "小吃類", foodType: "雞排", confidence: 0.86, description: "台式炸雞排，香脆可口的小吃" }
        ]

        // 隨機選擇一個分類結果來模擬
        const randomIndex = Math.floor(Math.random() * foodTypes.length)
        const result = foodTypes[randomIndex]

        // 模擬分析時間
        await new Promise(resolve => setTimeout(resolve, 2000))

        return result
    }

    const getRestaurantRecommendations = async (foodClassification: FoodClassification): Promise<RestaurantRecommendation[]> => {
        try {
            console.log("🔍 根據食物分類搜尋餐廳:", foodClassification.category)

            // 獲取所有餐廳
            const response = await fetch('/api/restaurants')
            const data = await response.json()

            if (!data.success) {
                throw new Error("獲取餐廳資料失敗")
            }

            // 根據食物分類篩選相關餐廳
            const matchingRestaurants = data.restaurants.filter((restaurant: any) => {
                const cuisine = restaurant.cuisine?.toLowerCase() || ""
                const category = foodClassification.category.toLowerCase()

                // 簡單的關鍵字匹配
                if (category.includes("中式") && (cuisine.includes("中式") || cuisine.includes("台式") || cuisine.includes("中華"))) {
                    return true
                }
                if (category.includes("日式") && cuisine.includes("日式")) {
                    return true
                }
                if (category.includes("西式") && (cuisine.includes("西式") || cuisine.includes("美式") || cuisine.includes("義式"))) {
                    return true
                }
                if (category.includes("韓式") && cuisine.includes("韓式")) {
                    return true
                }
                if (category.includes("東南亞") && (cuisine.includes("泰式") || cuisine.includes("越南"))) {
                    return true
                }

                // 如果沒有明確分類，使用部分匹配
                return cuisine.includes(foodClassification.foodType) ||
                    restaurant.rname.includes(foodClassification.foodType)
            })

            // 轉換為推薦格式
            const recommendations: RestaurantRecommendation[] = matchingRestaurants
                .slice(0, 6) // 最多6個推薦
                .map((restaurant: any) => ({
                    rid: restaurant.rid,
                    rname: restaurant.rname,
                    raddress: restaurant.raddress,
                    image: restaurant.image || "/images/restaurants/default.jpg",
                    rating: restaurant.rating || 4.0,
                    cuisine: restaurant.cuisine || "美食",
                    deliveryTime: "25-40分鐘",
                    deliveryFee: restaurant.delivery_fee || 30,
                    matchReason: `專門提供${foodClassification.category}，推薦度${Math.round(foodClassification.confidence * 100)}%`
                }))

            return recommendations
        } catch (error) {
            console.error("❌ 獲取餐廳推薦失敗:", error)
            return []
        }
    }

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
        if (!selectedFile || !modelLoaded) {
            toast({
                title: "錯誤",
                description: "請先選擇圖片並等待模型載入完成",
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
            // 分析食物類型
            console.log("🔍 開始食物分類分析...")
            const classification = await classifyFood(selectedFile)
            setFoodClassification(classification)

            // 顯示分類結果
            toast({
                title: "🎯 識別完成！",
                description: `識別為 ${classification.foodType}（${classification.category}），信心度 ${Math.round(classification.confidence * 100)}%`,
            })

            // 獲取餐廳推薦
            console.log("🍽️ 獲取餐廳推薦...")
            toast({
                title: "🔍 搜尋餐廳",
                description: `根據 ${classification.category} 為您推薦合適的餐廳...`,
            })

            const restaurantRecommendations = await getRestaurantRecommendations(classification)
            setRecommendations(restaurantRecommendations)

            if (restaurantRecommendations.length === 0) {
                toast({
                    title: "😔 暫無推薦",
                    description: `目前沒有找到專門提供 ${classification.category} 的餐廳，請稍後再試`,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "🎉 推薦完成！",
                    description: `為您推薦了 ${restaurantRecommendations.length} 家${classification.category}餐廳`,
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ChefHat className="h-5 w-5 mr-2 text-brand-primary" />
                        AI食物分類識別
                    </DialogTitle>
                    <DialogDescription>
                        上傳食物照片，AI會自動識別食物類型並推薦相關餐廳
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 模型載入狀態 */}
                    {!modelLoaded && (
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2 text-blue-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">載入AI食物分類模型中...</span>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 圖片上傳區域 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">上傳食物照片</CardTitle>
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
                                        AI會自動識別食物類型並推薦餐廳
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
                                        disabled={isAnalyzing || !selectedFile}
                                        className="w-full bg-brand-primary hover:bg-brand-primary/90"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                分析中...
                                            </>
                                        ) : (
                                            <>
                                                <ChefHat className="h-4 w-4 mr-2" />
                                                分析食物類型
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
                                    <ChefHat className="h-5 w-5 mr-2 text-brand-primary" />
                                    分析結果
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium">
                                        食物類型: {foodClassification.foodType}
                                    </p>
                                    <p className="text-sm font-medium">
                                        信心度: {Math.round(foodClassification.confidence * 100)}%
                                    </p>
                                    <p className="text-sm font-medium">
                                        描述: {foodClassification.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 餐廳推薦 */}
                    {recommendations.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <ChefHat className="h-5 w-5 mr-2 text-brand-primary" />
                                    餐廳推薦
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {recommendations.map((recommendation, index) => (
                                        <div
                                            key={`${recommendation.rid}-${index}`}
                                            className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleRestaurantClick(recommendation)}
                                        >
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
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
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-medium truncate">{recommendation.rname}</h3>
                                                    <Badge variant="secondary">
                                                        {Math.round(recommendation.rating * 100)}% 評價
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{recommendation.raddress}</p>
                                                <p className="text-sm font-medium text-brand-primary">NT$ {recommendation.deliveryFee}</p>
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