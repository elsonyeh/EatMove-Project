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
import Script from 'next/script'
import { FACE_CONFIG, calculateCosineSimilarity, assessFaceQuality, MultiVerificationManager, drawFaceDetectionOverlay, checkFacePosition } from "@/lib/face-config"

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
  const [faceStatusMessage, setFaceStatusMessage] = useState("等待開始辨識...")
  const [lastDistance, setLastDistance] = useState<number | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const verificationManagerRef = useRef<MultiVerificationManager>(new MultiVerificationManager())

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
    verificationManagerRef.current.reset()  // 重置驗證管理器
    localStorage.removeItem('tempUserId')
    localStorage.removeItem('tempEmail')
  }

  // 處理人臉辨識
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !isFaceLoginMode || !isEmailVerified || !modelsLoaded) return

    const video = videoRef.current
    const canvas = canvasRef.current

    let animationFrameId: number
    let lastDetectionTime = 0
    const DETECTION_INTERVAL = FACE_CONFIG.DETECTION_INTERVAL

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
        setFaceStatusMessage("等待攝影機準備就緒...")
        animationFrameId = requestAnimationFrame(detectFace)
        return
      }

      try {
        // 使用更精準的檢測選項
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options(
          FACE_CONFIG.DETECTOR_OPTIONS.SSD_MOBILENET
        ))
          .withFaceLandmarks()
          .withFaceDescriptors()

        // 設定 canvas 尺寸並繪製檢測框
        drawFaceDetectionOverlay(canvas, video.videoWidth, video.videoHeight, detections)

        console.log(`檢測到 ${detections.length} 個人臉`)

        if (detections.length === 0) {
          setFaceDetected(false)
          setFaceStatusMessage("未偵測到人臉，請確保：1.光線充足 2.臉部完整在畫面中 3.摘下口罩")
        } else if (detections.length > 1) {
          setFaceDetected(false)
          setFaceStatusMessage("偵測到多個人臉，請確保畫面中只有一個人臉")
        } else if (detections.length === 1) {
          const detection = detections[0]
          console.log('檢測結果:', detection)

          // 檢查檢測結果的完整性
          if (!detection) {
            setFaceDetected(false)
            setFaceStatusMessage("人臉檢測結果無效，請重新對準")
            console.log('檢測結果為空')
            animationFrameId = requestAnimationFrame(detectFace)
            return
          }

          // 嘗試多種方式取得邊界框
          let box = null
          if (detection.box) {
            box = detection.box
          } else if (detection.detection && detection.detection.box) {
            box = detection.detection.box
          } else if (detection.detection && detection.detection._box) {
            box = detection.detection._box
          } else if (detection._box) {
            box = detection._box
          }

          console.log('檢測到的人臉box:', box)
          console.log('檢測到的landmarks:', detection.landmarks ? '存在' : '不存在')
          console.log('檢測到的descriptor:', detection.descriptor ? `存在，長度: ${detection.descriptor.length}` : '不存在')
          console.log('完整檢測物件結構:', Object.keys(detection))

          // 評估人臉品質
          const qualityAssessment = assessFaceQuality(detection)
          console.log('人臉品質評估:', qualityAssessment)

          if (!box) {
            // 如果沒有邊界框，嘗試從 landmarks 計算
            if (detection.landmarks && detection.landmarks.positions) {
              const positions = detection.landmarks.positions
              const xs = positions.map((p: any) => p.x)
              const ys = positions.map((p: any) => p.y)
              const minX = Math.min(...xs)
              const maxX = Math.max(...xs)
              const minY = Math.min(...ys)
              const maxY = Math.max(...ys)

              // 添加一些邊距
              const margin = 20
              box = {
                x: Math.max(0, minX - margin),
                y: Math.max(0, minY - margin),
                width: maxX - minX + 2 * margin,
                height: maxY - minY + 2 * margin
              }
              console.log('從 landmarks 計算的邊界框:', box)
            } else {
              setFaceDetected(false)
              setFaceStatusMessage("無法取得人臉位置資訊，請調整光線或角度")
              console.log('無法取得人臉邊界框，也無法從 landmarks 計算')
              animationFrameId = requestAnimationFrame(detectFace)
              return
            }
          }

          console.log('人臉位置詳細:', {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height
          })

          // 使用新的位置檢查函數
          const positionCheck = checkFacePosition(box, canvas.width, canvas.height)
          const isInPosition = positionCheck.isInPosition

          console.log('位置檢查結果:', {
            isInPosition,
            message: positionCheck.message,
            qualityScore: qualityAssessment.score
          })

          // 設定人臉檢測狀態
          setFaceDetected(isInPosition && qualityAssessment.score > FACE_CONFIG.MULTI_VERIFICATION.MIN_QUALITY_SCORE)

          // 設定狀態訊息
          if (!isInPosition || qualityAssessment.score <= FACE_CONFIG.MULTI_VERIFICATION.MIN_QUALITY_SCORE) {
            if (qualityAssessment.score <= FACE_CONFIG.MULTI_VERIFICATION.MIN_QUALITY_SCORE) {
              setFaceStatusMessage(`人臉品質不足 (${(qualityAssessment.score * 100).toFixed(0)}%)：${qualityAssessment.issues.join(', ')}`)
            } else {
              setFaceStatusMessage(positionCheck.message)
            }
            console.log('位置或品質不正確:', positionCheck.message, '品質:', qualityAssessment.score)
          } else {
            console.log('位置正確，開始檢查特徵')

            // 檢查是否有人臉特徵點
            if (!detection.landmarks) {
              setFaceStatusMessage('正在分析人臉特徵點...')
              console.log('landmarks不存在，等待下一幀')
              animationFrameId = requestAnimationFrame(detectFace)
              return
            }

            // 檢查是否有人臉描述符
            if (!detection.descriptor) {
              setFaceStatusMessage('正在提取人臉特徵，請保持不動...')
              console.log('descriptor不存在，等待下一幀')
              animationFrameId = requestAnimationFrame(detectFace)
              return
            }

            setFaceStatusMessage('位置正確！正在進行人臉比對...')
            console.log('開始人臉比對')

            const currentFaceDescriptor = detection.descriptor
            console.log('人臉描述符詳細:', {
              length: currentFaceDescriptor.length,
              type: typeof currentFaceDescriptor,
              isFloat32Array: currentFaceDescriptor instanceof Float32Array
            })

            try {
              // 從資料庫取得已儲存的人臉特徵
              console.log('發送請求到 face-auth API')
              const response = await fetch(`/api/face-auth?userId=${localStorage.getItem('tempUserId')}&role=${role}`)
              console.log('face-auth API 回應狀態:', response.status)

              if (!response.ok) {
                setFaceStatusMessage('無法連接到伺服器，請檢查網路連線')
                console.log('API 請求失敗:', response.status, response.statusText)
                animationFrameId = requestAnimationFrame(detectFace)
                return
              }

              const data = await response.json()
              console.log('face-auth API 回應資料:', data)

              if (!data.success) {
                setFaceStatusMessage(data.error || '找不到已註冊的人臉資料，請先註冊人臉')
                console.log('API 回應失敗:', data.error)
                animationFrameId = requestAnimationFrame(detectFace)
                return
              }

              // 將已儲存的特徵轉換為 Float32Array
              const storedDescriptor = new Float32Array(data.data.faceDescriptor)
              console.log('儲存的描述符詳細:', {
                length: storedDescriptor.length,
                type: typeof storedDescriptor,
                isFloat32Array: storedDescriptor instanceof Float32Array
              })

              // 計算特徵相似度 - 使用更精準的方法
              const distance = faceapi.euclideanDistance(currentFaceDescriptor, storedDescriptor)

              // 使用餘弦相似度作為輔助判斷
              const cosineSimilarity = calculateCosineSimilarity(currentFaceDescriptor, storedDescriptor)

              const similarity = (1 - distance) * 100
              const cosinePercent = cosineSimilarity * 100
              setLastDistance(distance)

              console.log('相似度計算結果:', {
                euclideanDistance: distance,
                euclideanSimilarity: similarity.toFixed(1) + '%',
                cosineSimilarity: cosineSimilarity.toFixed(3),
                cosinePercent: cosinePercent.toFixed(1) + '%',
                qualityScore: qualityAssessment.score,
                thresholds: {
                  euclidean: FACE_CONFIG.SIMILARITY_THRESHOLDS.EUCLIDEAN_STRICT,
                  cosine: FACE_CONFIG.SIMILARITY_THRESHOLDS.COSINE_STRICT
                }
              })

              // 使用多重驗證系統
              const verificationManager = verificationManagerRef.current
              const isVerified = verificationManager.addMatch(distance, cosineSimilarity, qualityAssessment.score)

              if (isVerified) {
                const averageScores = verificationManager.getAverageScores()
                setFaceStatusMessage('多重驗證成功！正在登入...')
                console.log('多重驗證成功，平均分數:', averageScores)
                handleFaceLoginSuccess(data.data.userId)
                return
              } else {
                const matchCount = verificationManager.getMatchCount()
                const required = FACE_CONFIG.MULTI_VERIFICATION.REQUIRED_CONSECUTIVE_MATCHES

                if (distance < FACE_CONFIG.SIMILARITY_THRESHOLDS.EUCLIDEAN_NORMAL &&
                  cosineSimilarity > FACE_CONFIG.SIMILARITY_THRESHOLDS.COSINE_NORMAL) {
                  setFaceStatusMessage(`驗證進度 ${matchCount}/${required} - 相似度良好，請保持位置`)
                  console.log('相似度良好，繼續驗證')
                } else {
                  setFaceStatusMessage(`相似度不足 (歐氏: ${similarity.toFixed(1)}%, 餘弦: ${cosinePercent.toFixed(1)}%, 品質: ${(qualityAssessment.score * 100).toFixed(0)}%)`)
                  console.log('相似度不足')
                }
              }
            } catch (error) {
              console.error('人臉比對過程發生錯誤:', error)
              setFaceStatusMessage('人臉比對過程發生錯誤，請重試')
            }
          }
        }

        animationFrameId = requestAnimationFrame(detectFace)
      } catch (error) {
        console.error('Face detection error:', error)
        setFaceStatusMessage('人臉辨識引擎錯誤，請重新整理頁面')
        animationFrameId = requestAnimationFrame(detectFace)
      }
    }

    detectFace()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [isFaceLoginMode, isEmailVerified, modelsLoaded, userType])

  // 人臉登入成功處理
  const handleFaceLoginSuccess = async (userId: string) => {
    try {
      // 先取得 tempEmail，避免被 stopFaceLogin 清除
      const tempEmail = localStorage.getItem('tempEmail')

      if (!tempEmail) {
        toast({
          title: "錯誤",
          description: "無法取得用戶電子郵件，請重新開始人臉辨識",
          variant: "destructive",
        })
        stopFaceLogin()
        return
      }

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
          toast({
            title: "錯誤",
            description: "不支援此用戶類型的人臉辨識登入",
            variant: "destructive",
          })
          stopFaceLogin()
          return
      }

      // 使用人臉辨識結果進行登入
      const requestData = {
        username: tempEmail,
        role: role,
        faceDescriptor: true // 表示這是人臉辨識登入
      }

      console.log("=== 前端發送登入請求 ===");
      console.log("requestData:", requestData);
      console.log("tempEmail from localStorage:", tempEmail);
      console.log("========================");

      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const loginData = await loginResponse.json()

      if (loginData.success) {
        // 登入成功後才清理資源
        stopFaceLogin()

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
        // 登入失敗時不清理資源，讓用戶可以重試
      }
    } catch (error) {
      console.error('人臉登入失敗:', error)
      toast({
        title: "錯誤",
        description: "人臉辨識登入失敗",
        variant: "destructive",
      })
      // 發生錯誤時不清理資源，讓用戶可以重試
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
        // 使用 API 進行餐廳登入
        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username,
              password,
              role: "restaurant",
              plaintext: true
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || "登入失敗")
          }

          const data = await response.json()

          if (data.success) {
            // 儲存餐廳資訊到 localStorage
            const restaurantData = {
              id: data.data.mid.toString(),
              username: data.data.email,
              restaurantId: data.data.mid,
              restaurantName: data.data.name,
              email: data.data.email,
              address: data.data.address,
              description: data.data.description || "暫無描述",
              phonenumber: data.data.phonenumber
            }
            localStorage.setItem("restaurantAccount", JSON.stringify(restaurantData))

            toast({
              title: "登入成功",
              description: `歡迎回來，${data.data.name}`,
            })
            router.push("/restaurant/dashboard")
            return
          } else {
            setError(data.message || "帳號或密碼錯誤")
          }
        } catch (error: any) {
          console.error("餐廳登入失敗:", error)
          setError(error.message || "登入時發生錯誤，請稍後再試")
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
                              <div className="text-sm text-gray-600">
                                {faceStatusMessage}
                              </div>
                              {lastDistance && (
                                <div className="text-xs text-blue-600">
                                  相似度: {((1 - lastDistance) * 100).toFixed(1)}%
                                  {lastDistance < 0.75 ? " ✓" : lastDistance < 0.9 ? " ~" : " ✗"}
                                </div>
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
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={stopFaceLogin}
                        variant="outline"
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
