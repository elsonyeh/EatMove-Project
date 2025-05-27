"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Camera, Upload, Search, Trash2, Loader2, ImageIcon, Sparkles } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
    extractImageFeatures,
    findSimilarImages,
    generateThumbnail,
    type ImageFeatures
} from "@/lib/image-similarity"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface SearchResult {
    id: string
    name: string
    url: string
    description: string
    price: number
    rid: number
    restaurantName: string
    restaurantAddress: string
    similarity: number
}

interface ImageSearchProps {
    onClose?: () => void
    isOpen?: boolean
}

export function ImageSearch({ onClose, isOpen = false }: ImageSearchProps) {
    const router = useRouter()
    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [thumbnail, setThumbnail] = useState<string>("")
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [imageFeatures, setImageFeatures] = useState<ImageFeatures | null>(null)
    const [threshold, setThreshold] = useState(0.3)

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
            const thumbnailUrl = await generateThumbnail(file)
            setThumbnail(thumbnailUrl)

            // 提取圖像特徵
            const features = await extractImageFeatures(file)
            setImageFeatures(features)

            toast({
                title: "圖片載入成功",
                description: "圖片已分析完成，可以開始搜尋",
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

    const handleSearch = async () => {
        if (!imageFeatures) {
            toast({
                title: "錯誤",
                description: "請先選擇圖片",
                variant: "destructive",
            })
            return
        }

        setIsSearching(true)
        setSearchResults([])

        // 顯示搜尋開始提示
        toast({
            title: "🔍 開始搜尋",
            description: "正在分析圖片並搜尋相似餐點...",
        })

        try {
            // 獲取所有餐點圖片
            console.log("📡 正在獲取餐點資料...")
            const response = await fetch('/api/search/image')
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.message || "獲取餐點資料失敗")
            }

            console.log(`📊 獲得 ${data.data.length} 筆餐點資料`)

            // 顯示分析進度提示
            toast({
                title: "🧠 分析中",
                description: `正在比對 ${data.data.length} 道餐點的相似度...`,
            })

            // 搜尋相似圖片
            const results = await findSimilarImages(
                imageFeatures,
                data.data,
                threshold,
                20 // 最多20個結果
            )

            setSearchResults(results as SearchResult[])

            if (results.length === 0) {
                toast({
                    title: "😔 未找到相似餐點",
                    description: `使用 ${Math.round(threshold * 100)}% 相似度門檻未找到匹配結果。建議降低門檻或嘗試其他圖片`,
                    variant: "destructive",
                })
            } else {
                toast({
                    title: "🎉 搜尋完成！",
                    description: `找到 ${results.length} 個相似的餐點，最高相似度 ${Math.round(results[0].similarity * 100)}%`,
                })
            }
        } catch (error) {
            console.error("❌ 搜尋失敗:", error)
            toast({
                title: "❌ 搜尋失敗",
                description: error instanceof Error ? error.message : "搜尋過程中發生錯誤，請重試",
                variant: "destructive",
            })
        } finally {
            setIsSearching(false)
        }
    }

    const handleClear = () => {
        setSelectedFile(null)
        setThumbnail("")
        setImageFeatures(null)
        setSearchResults([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }

        toast({
            title: "🗑️ 已清除",
            description: "圖片和搜尋結果已清除",
        })
    }

    const handleResultClick = (result: SearchResult) => {
        toast({
            title: "🎯 跳轉到餐廳",
            description: `正在前往 ${result.restaurantName}，查看 ${result.name}`,
        })

        router.push(`/user/restaurant/${result.rid}?highlight=${result.id}`)
        if (onClose) onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Camera className="h-5 w-5 mr-2 text-brand-primary" />
                        以圖搜圖
                    </DialogTitle>
                    <DialogDescription>
                        上傳食物照片，找到相似的餐點和餐廳
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* 圖片上傳區域 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">上傳圖片</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {!selectedFile ? (
                                <div
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium mb-2">點擊或拖拽上傳圖片</p>
                                    <p className="text-sm text-gray-500">
                                        支援 JPG、PNG、WebP 格式，最大 10MB
                                    </p>
                                    <Button className="mt-4" variant="outline">
                                        <Upload className="h-4 w-4 mr-2" />
                                        選擇檔案
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

                                    {/* 搜尋設定 */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            相似度門檻: {Math.round(threshold * 100)}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="0.8"
                                            step="0.05"
                                            value={threshold}
                                            onChange={(e) => setThreshold(parseFloat(e.target.value))}
                                            className="w-full"
                                        />
                                        <p className="text-xs text-gray-500">
                                            調整此值來控制搜尋結果的嚴格程度
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleSearch}
                                        disabled={isSearching || !imageFeatures}
                                        className="w-full bg-brand-primary hover:bg-brand-primary/90"
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                搜尋中...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-4 w-4 mr-2" />
                                                開始搜尋
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

                    {/* 搜尋結果 */}
                    {searchResults.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Sparkles className="h-5 w-5 mr-2 text-brand-primary" />
                                    搜尋結果 ({searchResults.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                    {searchResults.map((result, index) => (
                                        <div
                                            key={`${result.id}-${index}`}
                                            className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => handleResultClick(result)}
                                        >
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={result.url}
                                                    alt={result.name}
                                                    fill
                                                    className="object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/images/menu/default.jpg"
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-medium truncate">{result.name}</h3>
                                                    <Badge variant="secondary">
                                                        {Math.round(result.similarity * 100)}% 相似
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">{result.restaurantName}</p>
                                                <p className="text-sm font-medium text-brand-primary">NT$ {result.price}</p>
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