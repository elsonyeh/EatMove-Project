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
import { FACE_CONFIG, drawFaceDetectionOverlay, checkFacePosition } from "@/lib/face-config"

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
  const REQUIRED_CAPTURES = FACE_CONFIG.REGISTRATION.REQUIRED_CAPTURES
  const [faceDescriptors, setFaceDescriptors] = useState<Float32Array[]>([])
  const [phonenumber, setPhoneNumber] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [address, setAddress] = useState("")
  const [description, setDescription] = useState("")
  const [registrationError, setRegistrationError] = useState<{
    message: string
    suggestion?: string
    errorType?: string
    field?: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 設定 canvas 的 willReadFrequently 屬性
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', {
        willReadFrequently: true
      })
    }
  }, [])

  // 載入人臉辨識模型
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ])
        setModelsLoaded(true)
        console.log("✅ 人臉辨識模型載入成功")
      } catch (error) {
        console.error('Error loading models:', error)
        toast({
          title: "錯誤",
          description: "無法載入人臉辨識模型",
          variant: "destructive",
        })
      }
    }

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

      // 設定影片來源並等待載入
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
      setIsFaceRegistering(true)

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
      } else if (error.name === 'NotReadableError') {
        toast({
          title: "無法存取攝影機",
          description: "請確認沒有其他程式正在使用攝影機，並重新整理頁面",
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

      // 清理任何可能的殘留資源
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

  // 擷取人臉特徵
  const captureFace = async () => {
    if (!videoRef.current || !modelsLoaded || isCapturing) return

    try {
      setIsCapturing(true)

      // 使用更精準的檢測選項
      const detections = await faceapi.detectAllFaces(
        videoRef.current,
        new faceapi.SsdMobilenetv1Options(FACE_CONFIG.DETECTOR_OPTIONS.SSD_MOBILENET)
      )
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (detections.length === 0) {
        toast({
          title: "錯誤",
          description: "未偵測到人臉，請確保臉部在框框中且光線充足",
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

      const detection = detections[0]
      if (!detection.descriptor) {
        toast({
          title: "錯誤",
          description: "無法提取人臉特徵，請重試",
          variant: "destructive",
        })
        return
      }

      // 儲存人臉特徵
      const newDescriptors = [...faceDescriptors, detection.descriptor]
      setFaceDescriptors(newDescriptors)
      setCaptureCount(prev => prev + 1)

      if (captureCount + 1 >= REQUIRED_CAPTURES) {
        // 計算平均特徵向量
        const avgDescriptor = new Float32Array(128)  // face-api.js 的描述符長度是 128

        for (let i = 0; i < 128; i++) {
          let sum = 0
          for (const descriptor of newDescriptors) {
            sum += descriptor[i]
          }
          avgDescriptor[i] = sum / newDescriptors.length
        }

        setFaceDescriptor(avgDescriptor)

        toast({
          title: "成功",
          description: "已完成人臉特徵擷取，使用了多張照片提高準確度",
        })
        stopFaceRegistration()
      } else {
        toast({
          title: "繼續擷取",
          description: `已擷取 ${captureCount + 1}/${REQUIRED_CAPTURES} 張照片，請稍微調整角度後繼續`,
        })

        // 給用戶一些時間調整位置
        setTimeout(() => {
          setIsCapturing(false)
        }, 1500)
        return
      }

    } catch (error) {
      console.error('Error capturing face:', error)
      toast({
        title: "錯誤",
        description: "擷取人臉特徵時發生錯誤",
        variant: "destructive",
      })
    } finally {
      if (captureCount + 1 < REQUIRED_CAPTURES) {
        // 如果還沒完成所有擷取，延遲重置狀態
        setTimeout(() => {
          setIsCapturing(false)
        }, 1500)
      } else {
        setIsCapturing(false)
      }
    }
  }

  // 重置人臉註冊狀態
  const resetFaceRegistration = () => {
    setCaptureCount(0)
    setFaceDescriptors([])
    setFaceDescriptor(null)
  }

  // 停止註冊人臉
  const stopFaceRegistration = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsFaceRegistering(false)
    // 不要重置 captureCount 和 faceDescriptors，保留已擷取的資料
  }

  // 定期檢查人臉位置
  useEffect(() => {
    let animationFrameId: number
    let lastDetectionTime = 0
    const DETECTION_INTERVAL = FACE_CONFIG.DETECTION_INTERVAL

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

        if (video.videoWidth === 0 || video.videoHeight === 0) {
          animationFrameId = requestAnimationFrame(detectFace)
          return
        }

        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.SsdMobilenetv1Options(FACE_CONFIG.DETECTOR_OPTIONS.SSD_MOBILENET)
        )

        if (canvas) {
          // 使用新的繪製函數
          drawFaceDetectionOverlay(canvas, video.videoWidth, video.videoHeight, detections)

          if (detections.length === 1) {
            const detection = detections[0]
            const box = detection.box

            const positionCheck = checkFacePosition(box, canvas.width, canvas.height)
            setFaceDetected(positionCheck.isInPosition)
          } else {
            setFaceDetected(false)
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

  // 檢查電子郵件格式
  const validateEmail = (email: string) => {
    if (email.length === 0) {
      setEmailError(null)
      return
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      setEmailError("請輸入有效的電子郵件地址")
      return
    }
    setEmailError(null)
  }

  // 監聽電子郵件變更
  useEffect(() => {
    validateEmail(email)
  }, [email])

  // 檢查密碼規則
  const checkPassword = (value: string) => {
    if (value.length === 0) {
      setPasswordError(null)
      return
    }
    if (value.length < 6) {
      setPasswordError("密碼長度必須至少為 6 個字元")
      return
    }
    setPasswordError(null)
  }

  // 監聽密碼變更
  useEffect(() => {
    checkPassword(password)
  }, [password])

  const handleRegister = async () => {
    console.log("🔍 開始註冊流程...");
    console.log("📊 當前狀態:", {
      email,
      password,
      confirmPassword,
      username,
      phonenumber,
      userType,
      address,
      description
    });

    // 清除之前的錯誤
    setRegistrationError(null)
    setIsSubmitting(true)

    // 基本驗證
    if (!email || !password || !confirmPassword || !username || !phonenumber) {
      console.log("❌ 基本驗證失敗 - 缺少必要欄位");
      setRegistrationError({
        message: "請填寫所有必要欄位",
        field: "required"
      })
      setIsSubmitting(false)
      return
    }

    // 驗證密碼確認
    if (password !== confirmPassword) {
      console.log("❌ 密碼確認失敗");
      setRegistrationError({
        message: "密碼與確認密碼不符",
        field: "password"
      })
      setIsSubmitting(false)
      return
    }

    // 驗證email格式
    if (emailError) {
      setRegistrationError({
        message: "請輸入有效的電子郵件地址",
        field: "email"
      })
      setIsSubmitting(false)
      return
    }

    // 驗證密碼強度
    if (passwordError) {
      setRegistrationError({
        message: passwordError,
        field: "password"
      })
      setIsSubmitting(false)
      return
    }

    try {
      // 準備註冊資料
      const registrationData = {
        name: username,
        email,
        password,
        phonenumber,
        role: userType === "user" ? "member" : userType === "delivery" ? "deliveryman" : "restaurant",
        face_descriptor: faceDescriptor ? Array.from(faceDescriptor) : null,
        plaintext: true, // 添加明文密碼標記
        address,
        description
      }

      console.log("📤 準備發送的註冊資料:", registrationData);

      // 發送註冊請求
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      console.log("📊 API回應狀態:", response.status);

      const data = await response.json()
      console.log("📊 API回應資料:", data);

      if (data.success) {
        console.log("✅ 註冊成功");
        toast({
          title: "註冊成功！",
          description: data.message || "請使用新帳號登入",
        })
        router.push("/login")
      } else {
        console.log("❌ 註冊失敗:", data.message);

        // 設置詳細的錯誤資訊
        setRegistrationError({
          message: data.message,
          suggestion: data.suggestion,
          errorType: data.errorType,
          field: data.errorType === "EMAIL_EXISTS" ? "email" :
            data.errorType === "PHONE_EXISTS" ? "phone" :
              data.errorType === "ACCOUNT_EXISTS" ? "account" : "general"
        })

        // 不顯示toast，改為在表單中顯示錯誤
      }
    } catch (error) {
      console.error("❌ 註冊過程發生錯誤:", error)
      setRegistrationError({
        message: "網路連線錯誤，請檢查網路連線後再試",
        suggestion: "請確認網路連線正常，或稍後再試",
        field: "network"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 清除註冊錯誤的函數
  const clearRegistrationError = () => {
    setRegistrationError(null)
  }

  // 當用戶修改相關欄位時，清除對應的錯誤
  useEffect(() => {
    if (registrationError?.field === "email") {
      clearRegistrationError()
    }
  }, [email])

  useEffect(() => {
    if (registrationError?.field === "phone") {
      clearRegistrationError()
    }
  }, [phonenumber])

  useEffect(() => {
    if (registrationError?.field === "password") {
      clearRegistrationError()
    }
  }, [password, confirmPassword])

  useEffect(() => {
    if (registrationError?.field === "account") {
      clearRegistrationError()
    }
  }, [account])

  useEffect(() => {
    if (registrationError?.field === "required") {
      clearRegistrationError()
    }
  }, [email, password, confirmPassword, username, phonenumber])

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
                  <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* 左側指引區域 */}
                      <div className="md:w-1/3 space-y-4">
                        <div className="bg-slate-100 p-4 rounded-lg">
                          <h3 className="text-lg font-semibold mb-2">註冊步驟</h3>
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
                              <span>保持不動，等待擷取</span>
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
                            <div className="text-sm">
                              已擷取: {captureCount} / {REQUIRED_CAPTURES} 張
                            </div>
                            {captureCount > 0 && (
                              <button
                                onClick={resetFaceRegistration}
                                className="text-xs text-blue-600 hover:text-blue-800 underline"
                              >
                                重新開始擷取
                              </button>
                            )}
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

                    {/* 底部按鈕區域 */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={captureFace}
                        className="flex-1"
                        disabled={!faceDetected || isCapturing}
                        variant={faceDetected ? "default" : "secondary"}
                      >
                        {isCapturing ? (
                          <>
                            <span className="animate-spin mr-2">⭮</span>
                            擷取中...
                          </>
                        ) : (
                          faceDetected ? "擷取人臉" : "請對準框框"
                        )}
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
                    {/* 錯誤提示區域 */}
                    {registrationError && (
                      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-red-800">
                              {registrationError.message}
                            </h3>
                            {registrationError.suggestion && (
                              <div className="mt-2 text-sm text-red-700">
                                <p>{registrationError.suggestion}</p>
                              </div>
                            )}
                            <div className="mt-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={clearRegistrationError}
                                className="text-red-800 border-red-300 hover:bg-red-100"
                              >
                                我知道了
                              </Button>
                            </div>
                          </div>
                        </div>
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
                        className={registrationError?.field === "required" && !username ? "border-red-300" : ""}
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
                        className={
                          (emailError || (registrationError?.field === "email") || (registrationError?.field === "required" && !email))
                            ? "border-red-300" : ""
                        }
                      />
                      {emailError && (
                        <p className="text-sm text-red-500">{emailError}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        請輸入有效的電子郵件地址，例如：example@domain.com
                      </p>
                      {registrationError?.field === "email" && (
                        <p className="text-sm text-amber-600">
                          💡 提示：不同角色（用戶、店家、外送員）可以使用相同的電子郵件
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phonenumber">電話號碼</Label>
                      <Input
                        id="phonenumber"
                        type="tel"
                        placeholder="請輸入電話號碼"
                        value={phonenumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className={
                          (registrationError?.field === "phone" || (registrationError?.field === "required" && !phonenumber))
                            ? "border-red-300" : ""
                        }
                      />
                      {registrationError?.field === "phone" && (
                        <p className="text-sm text-amber-600">
                          💡 提示：不同角色（用戶、店家、外送員）可以使用相同的電話號碼
                        </p>
                      )}
                    </div>
                    {userType === "restaurant" && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="account">帳號名稱（選填）</Label>
                          <Input
                            id="account"
                            placeholder="請輸入帳號名稱，留空則使用電子郵件"
                            value={account}
                            onChange={(e) => setAccount(e.target.value)}
                            className={registrationError?.field === "account" ? "border-red-300" : ""}
                          />
                          {registrationError?.field === "account" && (
                            <p className="text-sm text-amber-600">
                              💡 提示：請嘗試其他帳號名稱
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            如果不填寫，系統將使用您的電子郵件作為帳號
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">餐廳地址</Label>
                          <Input
                            id="address"
                            placeholder="請輸入餐廳地址"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">餐廳描述</Label>
                          <Input
                            id="description"
                            placeholder="請輸入餐廳描述"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="password">密碼</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="請輸入密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={
                          (passwordError || (registrationError?.field === "password") || (registrationError?.field === "required" && !password))
                            ? "border-red-300" : ""
                        }
                      />
                      {passwordError && (
                        <p className="text-sm text-red-500">{passwordError}</p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        密碼長度必須至少為 6 個字元
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">確認密碼</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="請再次輸入密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={
                          (registrationError?.field === "password" || (registrationError?.field === "required" && !confirmPassword))
                            ? "border-red-300" : ""
                        }
                      />
                    </div>
                    {(userType === "user" || userType === "delivery") && (
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
                          您可以現在註冊人臉特徵，或在登入後的設定中再進行註冊
                        </p>
                      </div>
                    )}
                    <Button type="button" onClick={handleRegister} className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <span className="animate-spin mr-2">⭮</span>
                          註冊中...
                        </>
                      ) : (
                        "註冊"
                      )}
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
