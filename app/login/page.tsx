"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BrandLogo } from "@/components/brand-logo"
import { restaurantAccounts } from "@/lib/restaurant-accounts"
import Script from 'next/script'

// 移除 face-api.js 的直接引入
declare const faceapi: any

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userType, setUserType] = useState("user")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isFaceLoginMode, setIsFaceLoginMode] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)

  // 載入人臉辨識模型
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
      } catch (error) {
        console.error('Error loading models:', error)
        toast({
          title: "錯誤",
          description: "無法載入人臉辨識模型",
          variant: "destructive",
        })
      }
    }

    // 確保 faceapi 已載入
    if (typeof faceapi !== 'undefined') {
      loadModels()
    }
  }, [])

  // 清理攝影機資源
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [stream])

  // 開始人臉登入
  const startFaceLogin = async () => {
    if (!modelsLoaded) {
      toast({
        title: "請稍候",
        description: "人臉辨識模型正在載入中",
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStream(stream)
      }
      setIsFaceLoginMode(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "錯誤",
        description: "無法存取攝影機",
        variant: "destructive",
      })
    }
  }

  // 停止人臉登入
  const stopFaceLogin = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsFaceLoginMode(false)
  }

  // 處理人臉辨識
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isFaceLoginMode || !modelsLoaded) return

    const video = videoRef.current
    const canvas = canvasRef.current

    let animationFrameId: number

    const detectFace = async () => {
      if (video.readyState === 4) {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        // 清除畫布
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)

        // 繪製偵測結果
        if (detections.length > 0) {
          const dims = faceapi.matchDimensions(canvas, video, true)
          const resizedDetections = faceapi.resizeResults(detections, dims)
          faceapi.draw.drawDetections(canvas, resizedDetections)

          // 取得當前偵測到的人臉特徵
          const currentFaceDescriptor = detections[0].descriptor

          try {
            // 從資料庫取得已儲存的人臉特徵
            const response = await fetch('/api/face-auth?userId=current-user-id')
            if (!response.ok) {
              throw new Error('取得已儲存人臉特徵失敗')
            }

            const data = await response.json()
            if (!data.success) {
              throw new Error(data.error || '找不到已儲存的人臉特徵')
            }

            // 將已儲存的特徵轉換為 Float32Array
            const storedDescriptor = new Float32Array(data.faceDescriptor)

            // 計算特徵相似度
            const distance = faceapi.euclideanDistance(currentFaceDescriptor, storedDescriptor)

            // 如果相似度夠高（距離夠小），則視為同一個人
            if (distance < 0.6) { // 可以調整這個閾值
              handleFaceLoginSuccess()
              return
            }
          } catch (error) {
            console.error('Error comparing face descriptors:', error)
            toast({
              title: "錯誤",
              description: "比對人臉特徵時發生錯誤",
              variant: "destructive",
            })
            stopFaceLogin()
            return
          }
        }

        animationFrameId = requestAnimationFrame(detectFace)
      } else {
        animationFrameId = requestAnimationFrame(detectFace)
      }
    }

    video.addEventListener('play', detectFace)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isFaceLoginMode, modelsLoaded])

  // 人臉登入成功處理
  const handleFaceLoginSuccess = () => {
    stopFaceLogin()
    toast({
      title: "登入成功",
      description: "已透過人臉辨識成功登入",
    })
    router.push("/user/home")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("請輸入帳號和密碼")
      return
    }

    setIsLoading(true)

    try {
      // 模擬API請求延遲
      await new Promise((resolve) => setTimeout(resolve, 800))

      if (userType === "restaurant") {
        // 檢查餐廳帳號密碼
        const account = restaurantAccounts.find(
          (account) => account.username === username && account.password === password,
        )

        if (account) {
          // 儲存登入資訊到 localStorage
          localStorage.setItem("restaurantAccount", JSON.stringify(account))

          toast({
            title: "登入成功",
            description: `歡迎回來，${account.restaurantName}`,
          })

          // 直接導向店家儀表板
          router.push("/restaurant/dashboard")
          return
        } else {
          setError("帳號或密碼錯誤")
        }
      } else {
        // 處理用戶或外送員登入
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              password,
              role: userType
            }),
          });

          const data = await response.json();

          if (data.success) {
            localStorage.setItem("userId", data.data.mid);

            toast({
              title: "登入成功",
              description: `歡迎回來，${data.data.name}！`,
            });

            // 根據用戶類型導向不同頁面
            if (userType === "user") {
              router.push("/user/home");
            } else if (userType === "delivery") {
              router.push("/delivery/dashboard");
            }
          } else {
            setError(data.message || "帳號或密碼錯誤");
          }
        } catch (error) {
          console.error("登入失敗:", error);
          setError("登入時發生錯誤，請稍後再試");
        }
      }
    } catch (error) {
      setError("登入時發生錯誤，請稍後再試")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
        strategy="beforeInteractive"
      />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-2">
              <BrandLogo size="lg" />
            </div>
            <p className="text-muted-foreground">食在好時</p>
          </div>

          <Tabs defaultValue="user" className="w-full" onValueChange={setUserType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="user">用戶</TabsTrigger>
              <TabsTrigger value="restaurant">店家</TabsTrigger>
              <TabsTrigger value="delivery">外送員</TabsTrigger>
            </TabsList>

            <Card className="mt-4 border-none shadow-lg">
              <CardHeader>
                <CardTitle>
                  {userType === "user" ? "用戶登入" : userType === "restaurant" ? "店家登入" : "外送員登入"}
                </CardTitle>
                <CardDescription>
                  {userType === "user"
                    ? "登入您的帳號以開始訂購美食"
                    : userType === "restaurant"
                      ? "登入您的店家帳號以管理訂單和商品"
                      : "登入您的外送員帳號以接收訂單"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFaceLoginMode ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full rounded-lg"
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute top-0 left-0 w-full h-full"
                      />
                    </div>
                    <Button
                      onClick={stopFaceLogin}
                      variant="outline"
                      className="w-full"
                    >
                      取消人臉辨識
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
                    <div className="space-y-2">
                      <Label htmlFor="username">電子郵件</Label>
                      <Input
                        id="username"
                        type="email"
                        placeholder="請輸入電子郵件"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">密碼</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="請輸入密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "登入中..." : "登入"}
                      </Button>
                      {userType === "user" && (
                        <Button
                          type="button"
                          onClick={startFaceLogin}
                          variant="outline"
                          className="w-full"
                        >
                          使用人臉辨識登入
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <div className="text-sm text-muted-foreground">
                  還沒有帳號？{" "}
                  <Link href="/register" className="text-primary hover:underline">
                    立即註冊
                  </Link>
                </div>
                <div className="text-sm text-muted-foreground">
                  <Link href="/forgot-password" className="text-primary hover:underline">
                    忘記密碼？
                  </Link>
                </div>
              </CardFooter>
            </Card>
          </Tabs>
        </div>
      </div>
    </>
  )
}
