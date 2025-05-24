"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { BrandLogo } from "@/components/brand-logo"
import Script from 'next/script'

// 移除 face-api.js 的直接引入
declare const faceapi: any

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userType, setUserType] = useState("user")
  const [account, setAccount] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isFaceRegistering, setIsFaceRegistering] = useState(false)
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const REQUIRED_CAPTURES = 3

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

  // 開始註冊人臉
  const startFaceRegistration = async () => {
    if (!modelsLoaded) {
      toast({
        title: "請稍候",
        description: "人臉辨識模型正在載入中",
      })
      return
    }

    try {
      // 先檢查是否支援攝影機
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的瀏覽器不支援攝影機功能')
      }

      // 如果已經有串流，先停止它
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }

      // 等待 React 渲染完成
      await new Promise(resolve => setTimeout(resolve, 0))

      // 確保影片元素已經準備好
      if (!videoRef.current) {
        setIsFaceRegistering(true) // 先設定狀態讓 video 元素渲染出來
        await new Promise(resolve => setTimeout(resolve, 100)) // 等待渲染
      }

      if (!videoRef.current) {
        throw new Error('影片元素未準備就緒')
      }

      // 嘗試獲取攝影機權限
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      })

      // 設定影片來源並等待載入
      videoRef.current.srcObject = newStream
      await new Promise((resolve) => {
        if (!videoRef.current) return
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play()
              .then(resolve)
              .catch(error => {
                console.error('播放影片時發生錯誤:', error)
                resolve(null)
              })
          }
        }
      })

      setStream(newStream)
      setIsFaceRegistering(true)

    } catch (error: any) {
      console.error('Error accessing camera:', error)

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
      } else if (error.name === 'NotReadableError') {
        toast({
          title: "無法存取攝影機",
          description: "請確認沒有其他程式正在使用攝影機，並重新整理頁面",
          variant: "destructive",
        })
      } else {
        toast({
          title: "錯誤",
          description: `無法啟動攝影機：${error.message}`,
          variant: "destructive",
        })
      }

      // 清理任何可能的殘留資源
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        setStream(null)
      }
      setIsFaceRegistering(false)
    }
  }

  // 在組件掛載時初始化影片元素
  useEffect(() => {
    if (isFaceRegistering && videoRef.current && !videoRef.current.srcObject && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(error => {
        console.error('播放影片時發生錯誤:', error)
      })
    }
  }, [isFaceRegistering, stream])

  // 停止註冊人臉
  const stopFaceRegistration = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsFaceRegistering(false)
  }

  // 定期檢查人臉位置
  useEffect(() => {
    let animationFrameId: number
    let lastDetectionTime = 0
    const DETECTION_INTERVAL = 100 // 每100ms檢查一次

    const detectFace = async () => {
      if (!videoRef.current || !isFaceRegistering || !modelsLoaded) return

      const now = Date.now()
      if (now - lastDetectionTime < DETECTION_INTERVAL) {
        animationFrameId = requestAnimationFrame(detectFace)
        return
      }
      lastDetectionTime = now

      try {
        const video = videoRef.current
        const canvas = canvasRef.current

        // 確保影片已經有正確的尺寸
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameId = requestAnimationFrame(detectFace)
          return
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions()
        )

        if (canvas) {
          // 設定 canvas 尺寸與影片相同
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight

          const context = canvas.getContext('2d')
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height)

            // 繪製理想位置的框框
            const idealSize = Math.min(canvas.width, canvas.height) * 0.5
            const idealX = (canvas.width - idealSize) / 2
            const idealY = (canvas.height - idealSize) / 2

            // 繪製外框
            context.strokeStyle = '#ffffff'
            context.lineWidth = 3
            context.setLineDash([5, 5])
            context.strokeRect(idealX, idealY, idealSize, idealSize)

            // 繪製四角標記
            const cornerSize = 20
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

            // 添加指引文字
            context.font = '24px Arial'
            context.fillStyle = '#ffffff'
            context.textAlign = 'center'
            context.fillText(
              '請將臉部對準框框中心',
              canvas.width / 2,
              idealY - 20
            )

            if (detections.length === 1) {
              const detection = detections[0]
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

              setFaceDetected(isInPosition)
            } else {
              setFaceDetected(false)
            }
          }
        }
      } catch (error) {
        console.error('Face detection error:', error)
      }

      animationFrameId = requestAnimationFrame(detectFace)
    }

    if (isFaceRegistering) {
      detectFace()
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isFaceRegistering, modelsLoaded])

  // 擷取人臉特徵
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isCapturing) return

    try {
      setIsCapturing(true)
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (detections.length === 0) {
        toast({
          title: "錯誤",
          description: "未偵測到人臉，請確保臉部在框框中",
          variant: "destructive",
        })
        return
      }

      if (detections.length > 1) {
        toast({
          title: "錯誤",
          description: "偵測到多個人臉，請確保畫面中只有一個人臉",
          variant: "destructive",
        })
        return
      }

      if (!faceDetected) {
        toast({
          title: "請調整位置",
          description: "請將臉部對準框框中心再試一次",
          variant: "destructive",
        })
        return
      }

      // 儲存人臉特徵
      setFaceDescriptor(detections[0].descriptor)
      setCaptureCount(prev => prev + 1)

      if (captureCount + 1 >= REQUIRED_CAPTURES) {
        toast({
          title: "成功",
          description: "已完成人臉特徵擷取",
        })
        stopFaceRegistration()
      } else {
        toast({
          title: "繼續擷取",
          description: `還需要 ${REQUIRED_CAPTURES - (captureCount + 1)} 張照片`,
        })
      }

    } catch (error) {
      console.error('Error capturing face:', error)
      toast({
        title: "錯誤",
        description: "擷取人臉特徵時發生錯誤",
        variant: "destructive",
      })
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRegister = async () => {
    console.log("⚡ 點擊註冊")

    if (!username || !email || !password || !confirmPassword || (userType === "restaurant" && !account)) {
      toast({
        title: "註冊失敗",
        description: "請填寫所有欄位",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "註冊失敗",
        description: "兩次輸入的密碼不一致",
        variant: "destructive",
      })
      return
    }

    const payload = {
      role:
        userType === "user"
          ? "member"
          : userType === "restaurant"
            ? "restaurant"
            : "deliveryman",
      account: userType === "restaurant" ? account : undefined,
      name: username,
      email,
      password,
      phonenumber: "0912345678",
      address: "暫時地址",
      description: "暫時描述",
    }

    try {
      // 註冊用戶
      const res = await fetch("/api/member", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || "註冊失敗")
      }

      // 如果是用戶且有人臉特徵，則儲存人臉特徵
      if (userType === "user" && faceDescriptor) {
        const faceRes = await fetch('/api/face-auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: data.userId, // 假設 API 回傳了用戶 ID
            faceDescriptor: Array.from(faceDescriptor),
          }),
        })

        if (!faceRes.ok) {
          console.error('儲存人臉特徵失敗')
        }
      }

      toast({
        title: "註冊成功",
        description: "請登入您的帳號",
      })

      router.push("/login")
    } catch (err: any) {
      toast({
        title: "註冊失敗",
        description: err.message,
        variant: "destructive",
      })
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
            <div className="mb-4">
              <BrandLogo size="lg" />
            </div>
            <h1 className="text-3xl font-bold">註冊帳號</h1>
            <p className="text-muted-foreground">加入我們的美食外送平台</p>
          </div>

          <Tabs defaultValue="user" className="w-full" onValueChange={setUserType}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="user">用戶</TabsTrigger>
              <TabsTrigger value="restaurant">店家</TabsTrigger>
              <TabsTrigger value="delivery">外送員</TabsTrigger>
            </TabsList>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>
                  {userType === "user"
                    ? "用戶註冊"
                    : userType === "restaurant"
                      ? "店家註冊"
                      : "外送員註冊"}
                </CardTitle>
                <CardDescription>
                  {userType === "user"
                    ? "創建您的用戶帳號以開始訂購美食"
                    : userType === "restaurant"
                      ? "創建您的店家帳號以開始銷售美食"
                      : "創建您的外送員帳號以開始接單"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isFaceRegistering ? (
                  <div className="space-y-4 mb-6">
                    <div className="relative w-full max-w-2xl mx-auto">
                      <div className="relative aspect-video">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <canvas
                          ref={canvasRef}
                          className="absolute top-0 left-0 w-full h-full"
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute top-4 left-0 w-full text-center z-10">
                          <div className="inline-block bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                            {faceDetected ? "✅ 人臉位置正確" : "請將臉部對準框框中心"}
                          </div>
                          <div className="mt-2 inline-block bg-black bg-opacity-50 text-white px-4 py-2 rounded-full">
                            已擷取: {captureCount} / {REQUIRED_CAPTURES} 張
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={captureFace}
                        className="flex-1"
                        disabled={!faceDetected || isCapturing}
                      >
                        {isCapturing ? "擷取中..." : (faceDetected ? "擷取人臉" : "請對準框框")}
                      </Button>
                      <Button
                        onClick={stopFaceRegistration}
                        variant="outline"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form className="space-y-4">
                    {userType === "restaurant" && (
                      <div className="space-y-2">
                        <Label htmlFor="account">店家帳號</Label>
                        <Input
                          id="account"
                          placeholder="請輸入店家帳號"
                          value={account}
                          onChange={(e) => setAccount(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="username">
                        {userType === "restaurant" ? "店家名稱" : "用戶名稱"}
                      </Label>
                      <Input
                        id="username"
                        placeholder={
                          userType === "restaurant"
                            ? "請輸入店家名稱"
                            : "請輸入用戶名稱"
                        }
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">電子郵件</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="請輸入電子郵件"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">確認密碼</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="請再次輸入密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                    {userType === "user" && (
                      <div className="space-y-2">
                        <Label>人臉辨識（選填）</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            onClick={startFaceRegistration}
                            variant="outline"
                            className="w-full"
                          >
                            {faceDescriptor ? "重新註冊人臉" : "註冊人臉"}
                          </Button>
                          {faceDescriptor && (
                            <div className="text-sm text-green-600">
                              ✓ 已註冊
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          註冊人臉特徵可以使用人臉辨識快速登入
                        </p>
                      </div>
                    )}
                    <Button type="button" onClick={handleRegister} className="w-full">
                      註冊
                    </Button>
                  </form>
                )}
              </CardContent>
              <CardFooter>
                <div className="text-sm text-muted-foreground">
                  已有帳號？{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    立即登入
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
