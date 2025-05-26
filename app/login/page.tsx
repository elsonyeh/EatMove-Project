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
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [faceLoginEmail, setFaceLoginEmail] = useState("")
  const [faceLoginEmailError, setFaceLoginEmailError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
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

  // 驗證電子郵件格式
  const validateFaceLoginEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) {
      setFaceLoginEmailError("請輸入電子郵件")
      return false
    }
    if (!emailRegex.test(email)) {
      setFaceLoginEmailError("請輸入有效的電子郵件地址")
      return false
    }
    setFaceLoginEmailError(null)
    return true
  }

  // 開始人臉登入
  const startFaceLogin = async () => {
    setIsFaceLoginMode(true)
  }

  // 驗證電子郵件
  const verifyEmail = async () => {
    if (!validateFaceLoginEmail(faceLoginEmail)) {
      return
    }

    setVerifyingEmail(true)
    try {
      // 根據用戶類型設定正確的角色
      let role = ""
      switch (userType) {
        case "user":
          role = "member"  // 使用資料庫表名
          break
        case "delivery":
          role = "deliveryman"  // 使用資料庫表名
          break
        default:
          setFaceLoginEmailError("不支援此用戶類型的人臉辨識登入")
          setVerifyingEmail(false)
          return
      }

      console.log('發送請求:', {
        email: faceLoginEmail,
        role,
        userType
      })

      const checkResponse = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: faceLoginEmail,
          role
        }),
      })

      const checkData = await checkResponse.json()
      if (!checkData.success) {
        setFaceLoginEmailError(checkData.message || "找不到此用戶")
        return
      }

      // 儲存臨時資訊
      localStorage.setItem('tempUserId', checkData.data.id)
      localStorage.setItem('tempEmail', faceLoginEmail)
      setIsEmailVerified(true)

      // 等待 React 渲染完成
      await new Promise(resolve => setTimeout(resolve, 100))

      // 開啟攝影機
      try {
        // 確保影片元素已經準備好
        if (!videoRef.current) {
          throw new Error('影片元素未準備就緒')
        }

        // 先停止現有的串流（如果有的話）
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
        }

        // 嘗試多種攝影機設定
        const cameraConfigs = [
          {
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: "user"
            }
          },
          {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user"
            }
          },
          {
            video: true
          }
        ]

        let newStream: MediaStream | null = null
        let lastError = null

        for (const config of cameraConfigs) {
          try {
            console.log('嘗試攝影機設定:', config)
            const result = await Promise.race([
              navigator.mediaDevices.getUserMedia(config),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('攝影機啟動超時')), 10000)
              )
            ])
            newStream = result as MediaStream
            break // 成功則跳出迴圈
          } catch (error) {
            console.warn('攝影機設定失敗:', config, error)
            lastError = error
            continue // 嘗試下一個設定
          }
        }

        if (!newStream) {
          throw lastError || new Error('無法啟動攝影機')
        }

        // 設定影片來源
        videoRef.current.srcObject = newStream

        // 等待影片元素載入完成（加入超時）
        await Promise.race([
          new Promise<void>((resolve, reject) => {
            if (!videoRef.current) {
              reject(new Error('影片元素未準備就緒'))
              return
            }

            const video = videoRef.current

            // 處理載入完成事件
            video.onloadedmetadata = () => {
              console.log('影片元數據載入完成')
              video.play()
                .then(() => {
                  console.log('影片播放成功')
                  resolve(void 0)
                })
                .catch(error => {
                  console.error('播放影片時發生錯誤:', error)
                  reject(error)
                })
            }

            // 處理錯誤事件
            video.onerror = (error) => {
              console.error('影片載入錯誤:', error)
              reject(error)
            }

            // 如果已經有 metadata，直接播放
            if (video.readyState >= 1) {
              video.play()
                .then(() => {
                  console.log('影片播放成功（已有metadata）')
                  resolve(void 0)
                })
                .catch(error => {
                  console.error('播放影片時發生錯誤:', error)
                  reject(error)
                })
            }
          }),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('影片載入超時')), 5000)
          )
        ])

        setStream(newStream)
        setFaceDetected(false)

        toast({
          title: "開始辨識",
          description: "請將臉部對準框框中心",
        })

      } catch (error: any) {
        console.error('Error accessing camera:', error)

        // 清理失敗的資源
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          setStream(null)
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null
        }

        if (error.name === 'NotAllowedError') {
          toast({
            title: "攝影機存取失敗",
            description: "請確認已允許攝影機權限，並重新整理頁面後再試一次",
            variant: "destructive",
            duration: 5000,
          })
        } else if (error.name === 'NotFoundError') {
          toast({
            title: "找不到攝影機",
            description: "請確認您的裝置已正確連接攝影機，並重新整理頁面",
            variant: "destructive",
          })
        } else if (error.message === '攝影機啟動超時' || error.message === '影片載入超時') {
          toast({
            title: "攝影機啟動超時",
            description: "攝影機啟動時間過長，請檢查攝影機是否被其他應用程式佔用，或重新整理頁面再試",
            variant: "destructive",
            duration: 8000,
          })
        } else {
          toast({
            title: "錯誤",
            description: `無法啟動攝影機：${error.message}`,
            variant: "destructive",
          })
        }

        stopFaceLogin()
      }
    } catch (error) {
      console.error('Error verifying email:', error)
      setFaceLoginEmailError("驗證電子郵件時發生錯誤")
    } finally {
      setVerifyingEmail(false)
    }
  }

  // 停止人臉登入
  const stopFaceLogin = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsFaceLoginMode(false)
    setIsEmailVerified(false)
    setFaceDetected(false)
    localStorage.removeItem('tempUserId')
    localStorage.removeItem('tempEmail')
  }

  // 處理人臉辨識
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isFaceLoginMode || !modelsLoaded) return

    const video = videoRef.current
    const canvas = canvasRef.current

    let animationFrameId: number
    let lastDetectionTime = 0
    const DETECTION_INTERVAL = 100

    // 根據用戶類型設定正確的角色
    let role = ""
    switch (userType) {
      case "user":
        role = "member"  // 使用資料庫表名
        break
      case "delivery":
        role = "deliveryman"  // 使用資料庫表名
        break
      default:
        console.error("不支援此用戶類型的人臉辨識登入")
        return
    }

    const detectFace = async () => {
      const now = Date.now()
      if (now - lastDetectionTime < DETECTION_INTERVAL) {
        animationFrameId = requestAnimationFrame(detectFace)
        return
      }
      lastDetectionTime = now

      if (video.readyState !== 4) {
        animationFrameId = requestAnimationFrame(detectFace)
        return
      }

      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors()

        // 設定 canvas 尺寸
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        const context = canvas.getContext('2d')
        if (!context) return

        context.clearRect(0, 0, canvas.width, canvas.height)

        // 繪製理想位置的框框
        const idealSize = Math.min(canvas.width, canvas.height) * 0.7
        const idealX = (canvas.width - idealSize) / 2
        const idealY = (canvas.height - idealSize) / 2

        // 繪製外框和提示文字
        context.strokeStyle = '#ffffff'
        context.lineWidth = 3
        context.setLineDash([5, 5])
        context.strokeRect(idealX, idealY, idealSize, idealSize)

        // 添加提示文字
        context.font = '20px Arial'
        context.fillStyle = '#ffffff'
        context.textAlign = 'center'

        if (detections.length === 0) {
          context.fillText('未偵測到人臉', canvas.width / 2, 30)
          context.fillText('請將臉部對準框框', canvas.width / 2, 60)
        } else if (detections.length > 1) {
          context.fillText('偵測到多個人臉', canvas.width / 2, 30)
          context.fillText('請確保畫面中只有一個人臉', canvas.width / 2, 60)
        }

        // 繪製四角標記
        const cornerSize = 30
        context.setLineDash([])
        context.beginPath()
        // 左上角
        context.moveTo(idealX, idealY + cornerSize)
        context.lineTo(idealX, idealY)
        context.lineTo(idealX + cornerSize, idealY)
        // 右上角
        context.moveTo(idealX + idealSize - cornerSize, idealY)
        context.lineTo(idealX + idealSize, idealY)
        context.lineTo(idealX + idealSize, idealY + cornerSize)
        // 右下角
        context.moveTo(idealX + idealSize, idealY + idealSize - cornerSize)
        context.lineTo(idealX + idealSize, idealY + idealSize)
        context.lineTo(idealX + idealSize - cornerSize, idealY + idealSize)
        // 左下角
        context.moveTo(idealX + cornerSize, idealY + idealSize)
        context.lineTo(idealX, idealY + idealSize)
        context.lineTo(idealX, idealY + idealSize - cornerSize)
        context.stroke()

        if (detections.length === 1) {
          const detection = detections[0]

          // 確保 detection 和 box 都存在
          if (!detection || !detection.box) {
            context.fillText('無法取得人臉位置資訊', canvas.width / 2, 30)
            context.fillText('請稍候再試', canvas.width / 2, 60)
            animationFrameId = requestAnimationFrame(detectFace)
            return
          }

          const box = detection.box

          // 檢查人臉是否在理想位置
          const isInPosition = (
            box.x > idealX &&
            box.y > idealY &&
            box.x + box.width < idealX + idealSize &&
            box.y + box.height < idealY + idealSize
          )

          // 繪製人臉檢測框
          context.strokeStyle = isInPosition ? '#00ff00' : '#ff0000'
          context.lineWidth = 2
          context.setLineDash([])
          context.strokeRect(box.x, box.y, box.width, box.height)

          // 添加位置提示文字
          if (!isInPosition) {
            let message = ''
            if (box.x <= idealX) {
              message = '請向右移動'
            } else if (box.x + box.width >= idealX + idealSize) {
              message = '請向左移動'
            } else if (box.y <= idealY) {
              message = '請向下移動'
            } else if (box.y + box.height >= idealY + idealSize) {
              message = '請向上移動'
            }

            if (box.width > idealSize || box.height > idealSize) {
              message = '請後退一些'
            } else if (box.width < idealSize * 0.5 || box.height < idealSize * 0.5) {
              message = '請靠近一些'
            }

            context.fillText(message, canvas.width / 2, 30)
          } else {
            context.fillStyle = '#00ff00'
            context.fillText('位置正確！請保持不動', canvas.width / 2, 30)
          }

          if (isInPosition) {
            // 確保 descriptor 存在
            if (!detection.descriptor) {
              context.fillStyle = '#ffffff'
              context.fillText('正在分析人臉特徵...', canvas.width / 2, 60)
              animationFrameId = requestAnimationFrame(detectFace)
              return
            }

            const currentFaceDescriptor = detection.descriptor

            try {
              // 從資料庫取得已儲存的人臉特徵
              const response = await fetch(`/api/face-auth?userId=${localStorage.getItem('tempUserId')}&role=${role}`)
              if (!response.ok) {
                throw new Error('取得已儲存人臉特徵失敗')
              }

              const data = await response.json()
              if (!data.success) {
                throw new Error(data.error || '找不到已儲存的人臉特徵')
              }

              // 將已儲存的特徵轉換為 Float32Array
              const storedDescriptor = new Float32Array(data.data.faceDescriptor)

              // 計算特徵相似度
              const distance = faceapi.euclideanDistance(currentFaceDescriptor, storedDescriptor)

              // 如果相似度夠高（距離夠小），則視為同一個人
              if (distance < 0.6) {
                handleFaceLoginSuccess(data.data.userId)
                return
              }
            } catch (error) {
              console.error('Error comparing face descriptors:', error)
            }
          }
        }

        animationFrameId = requestAnimationFrame(detectFace)
      } catch (error) {
        console.error('Face detection error:', error)
        animationFrameId = requestAnimationFrame(detectFace)
      }
    }

    detectFace()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isFaceLoginMode, modelsLoaded, userType])

  // 人臉登入成功處理
  const handleFaceLoginSuccess = async (userId: string) => {
    stopFaceLogin()

    try {
      // 使用人臉辨識結果進行登入
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: localStorage.getItem('tempEmail'),
          role: userType,
          faceDescriptor: true // 表示這是人臉辨識登入
        }),
      })

      const loginData = await loginResponse.json()

      if (loginData.success) {
        localStorage.setItem("userId", loginData.data.mid)
        localStorage.removeItem('tempUserId')
        localStorage.removeItem('tempEmail')

        toast({
          title: "登入成功",
          description: "已透過人臉辨識成功登入",
        })

        if (userType === "user") {
          router.push("/user/home")
        } else if (userType === "delivery") {
          router.push("/delivery/dashboard")
        }
      } else {
        toast({
          title: "登入失敗",
          description: loginData.message || "人臉辨識登入失敗",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('人臉登入失敗:', error)
      toast({
        title: "錯誤",
        description: "人臉辨識登入失敗",
        variant: "destructive",
      })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!username || !password) {
      setError("請輸入帳號和密碼")
      return
    }

    // 驗證 email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(username)) {
      setError("請輸入有效的電子郵件地址")
      return
    }

    setIsLoading(true)

    try {
      if (userType === "restaurant") {
        // 檢查餐廳帳號密碼
        const account = restaurantAccounts.find(
          (account) => account.username === username && account.password === password,
        )

        if (account) {
          localStorage.setItem("restaurantAccount", JSON.stringify(account))
          toast({
            title: "登入成功",
            description: `歡迎回來，${account.restaurantName}`,
          })
          router.push("/restaurant/dashboard")
          return
        } else {
          setError("帳號或密碼錯誤")
        }
      } else {
        try {
          // 使用明文密碼進行登入
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              password,
              role: userType === "user" ? "member" : "deliveryman",
              plaintext: true  // 添加標記表示使用明文密碼
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "登入失敗")
          }

          const data = await response.json()

          if (data.success) {
            localStorage.setItem("userId", data.data.mid)
            toast({
              title: "登入成功",
              description: `歡迎回來，${data.data.name}！`,
            })

            if (userType === "user") {
              router.push("/user/home")
            } else if (userType === "delivery") {
              router.push("/delivery/dashboard")
            }
          } else {
            setError(data.message || "帳號或密碼錯誤")
          }
        } catch (error: any) {
          console.error("登入失敗:", error)
          setError(error.message || "登入時發生錯誤，請稍後再試")
        }
      }
    } catch (error: any) {
      console.error("登入失敗:", error)
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
                    {!isEmailVerified ? (
                      <div className="space-y-4">
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2">人臉辨識登入</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            請輸入您的電子郵件以開始人臉辨識登入
                          </p>
                          <div className="space-y-2">
                            <Input
                              type="email"
                              placeholder="請輸入電子郵件"
                              value={faceLoginEmail}
                              onChange={(e) => {
                                setFaceLoginEmail(e.target.value)
                                setFaceLoginEmailError(null)
                              }}
                            />
                            {faceLoginEmailError && (
                              <p className="text-sm text-red-500">{faceLoginEmailError}</p>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            <Button
                              onClick={verifyEmail}
                              className="flex-1"
                              disabled={verifyingEmail}
                            >
                              {verifyingEmail ? (
                                <>
                                  <span className="animate-spin mr-2">⭮</span>
                                  驗證中...
                                </>
                              ) : (
                                "開始辨識"
                              )}
                            </Button>
                            <Button
                              onClick={() => {
                                setIsFaceLoginMode(false)
                                setFaceLoginEmail("")
                                setFaceLoginEmailError(null)
                              }}
                              variant="outline"
                            >
                              取消
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* 左側指引區域 */}
                        <div className="md:w-1/3 space-y-4">
                          <div className="bg-slate-100 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">登入步驟</h3>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs">1</span>
                                <span>確保光線充足</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs">2</span>
                                <span>將臉部對準框框中心</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white text-xs">3</span>
                                <span>保持不動，等待辨識</span>
                              </li>
                            </ul>
                          </div>
                          <div className="bg-slate-100 p-4 rounded-lg">
                            <h3 className="text-lg font-semibold mb-2">目前狀態</h3>
                            <div className="space-y-2">
                              <div className={`flex items-center gap-2 ${faceDetected ? "text-green-600" : "text-red-500"}`}>
                                <div className={`w-2 h-2 rounded-full ${faceDetected ? "bg-green-600" : "bg-red-500"}`} />
                                {faceDetected ? "人臉位置正確" : "請調整位置"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 右側攝影機區域 */}
                        <div className="md:w-2/3">
                          <div className="relative bg-black rounded-lg overflow-hidden">
                            <div className="relative aspect-[4/3]">
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                              />
                              <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full"
                                style={{ transform: 'scaleX(-1)' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={stopFaceLogin}
                        variant="outline"
                        className="w-full"
                      >
                        取消
                      </Button>
                    </div>
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
                      {(userType === "user" || userType === "delivery") && (
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
