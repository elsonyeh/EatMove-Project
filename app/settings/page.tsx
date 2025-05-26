"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Script from 'next/script'

declare const faceapi: any

export default function SettingsPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [userData, setUserData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isFaceRegistering, setIsFaceRegistering] = useState(false)
    const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null)
    const [modelsLoaded, setModelsLoaded] = useState(false)
    const [stream, setStream] = useState<MediaStream | null>(null)
    const [faceDetected, setFaceDetected] = useState(false)
    const [isCapturing, setIsCapturing] = useState(false)
    const [captureCount, setCaptureCount] = useState(0)
    const REQUIRED_CAPTURES = 3
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    // 表單欄位
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [phonenumber, setPhoneNumber] = useState("")
    const [address, setAddress] = useState("")
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmNewPassword, setConfirmNewPassword] = useState("")
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

    // 載入用戶資料
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userId = localStorage.getItem("userId")
                const userRole = localStorage.getItem("userRole") || "member"

                if (!userId) {
                    router.push("/login")
                    return
                }

                const response = await fetch(`/api/settings/profile?userId=${userId}&role=${userRole}`)
                const data = await response.json()

                if (data.success) {
                    setUserData(data.data)
                    // 設置表單初始值
                    setName(data.data.name || data.data.dname || "")
                    setEmail(data.data.email || data.data.demail || "")
                    setPhoneNumber(data.data.phonenumber || data.data.dphonenumber || "")
                    setAddress(data.data.address || "")
                } else {
                    throw new Error(data.message)
                }
            } catch (error) {
                console.error("獲取用戶資料失敗:", error)
                toast({
                    title: "錯誤",
                    description: "獲取用戶資料失敗",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [router, toast])

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

    // 開始人臉註冊
    const startFaceRegistration = async () => {
        if (!modelsLoaded) {
            toast({
                title: "請稍候",
                description: "人臉辨識模型正在載入中",
            })
            return
        }

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('您的瀏覽器不支援攝影機功能')
            }

            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                setStream(null)
            }

            await new Promise(resolve => setTimeout(resolve, 0))

            if (!videoRef.current) {
                setIsFaceRegistering(true)
                await new Promise(resolve => setTimeout(resolve, 100))
            }

            if (!videoRef.current) {
                throw new Error('影片元素未準備就緒')
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user"
                }
            })

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
            toast({
                title: "錯誤",
                description: `無法啟動攝影機：${error.message}`,
                variant: "destructive",
            })

            if (stream) {
                stream.getTracks().forEach(track => track.stop())
                setStream(null)
            }
            setIsFaceRegistering(false)
        }
    }

    // 停止人臉註冊
    const stopFaceRegistration = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
        setIsFaceRegistering(false)
        setCaptureCount(0)
    }

    // 定期檢查人臉位置
    useEffect(() => {
        let animationFrameId: number
        let lastDetectionTime = 0
        const DETECTION_INTERVAL = 100

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
                    new faceapi.TinyFaceDetectorOptions()
                )

                if (canvas) {
                    canvas.width = video.videoWidth
                    canvas.height = video.videoHeight

                    const context = canvas.getContext('2d')
                    if (context) {
                        context.clearRect(0, 0, canvas.width, canvas.height)

                        const idealSize = Math.min(canvas.width, canvas.height) * 0.5
                        const idealX = (canvas.width - idealSize) / 2
                        const idealY = (canvas.height - idealSize) / 2

                        context.strokeStyle = '#ffffff'
                        context.lineWidth = 3
                        context.setLineDash([5, 5])
                        context.strokeRect(idealX, idealY, idealSize, idealSize)

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

                            const isInPosition = (
                                box.x > idealX &&
                                box.y > idealY &&
                                box.x + box.width < idealX + idealSize &&
                                box.y + box.height < idealY + idealSize
                            )

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

            setFaceDescriptor(detections[0].descriptor)
            setCaptureCount(prev => prev + 1)

            if (captureCount + 1 >= REQUIRED_CAPTURES) {
                // 儲存人臉特徵
                const userId = localStorage.getItem("userId")
                const userRole = localStorage.getItem("userRole") || "member"

                const response = await fetch('/api/settings/face-register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId,
                        role: userRole,
                        faceDescriptor: Array.from(detections[0].descriptor),
                    }),
                })

                if (!response.ok) {
                    throw new Error('儲存人臉特徵失敗')
                }

                toast({
                    title: "成功",
                    description: "人臉特徵註冊成功",
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

    // 更新個人資料
    const handleUpdateProfile = async () => {
        try {
            const userId = localStorage.getItem("userId")
            const userRole = localStorage.getItem("userRole") || "member"

            const response = await fetch('/api/settings/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    role: userRole,
                    name,
                    email,
                    phonenumber,
                    address,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || '更新失敗')
            }

            toast({
                title: "成功",
                description: "個人資料更新成功",
            })

            // 更新本地狀態
            setUserData(data.data)
        } catch (error: any) {
            toast({
                title: "錯誤",
                description: error.message || "更新個人資料失敗",
                variant: "destructive",
            })
        }
    }

    // 更新密碼
    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            toast({
                title: "錯誤",
                description: "請填寫所有密碼欄位",
                variant: "destructive",
            })
            return
        }

        if (newPassword !== confirmNewPassword) {
            toast({
                title: "錯誤",
                description: "新密碼與確認密碼不一致",
                variant: "destructive",
            })
            return
        }

        if (newPassword.length < 6) {
            toast({
                title: "錯誤",
                description: "新密碼長度必須至少為 6 個字元",
                variant: "destructive",
            })
            return
        }

        try {
            setIsUpdatingPassword(true)
            const userId = localStorage.getItem("userId")
            const userRole = localStorage.getItem("userRole") || "member"

            const response = await fetch('/api/settings/password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    role: userRole,
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || '更新密碼失敗')
            }

            toast({
                title: "成功",
                description: "密碼更新成功",
            })

            // 清空密碼欄位
            setCurrentPassword("")
            setNewPassword("")
            setConfirmNewPassword("")
        } catch (error: any) {
            toast({
                title: "錯誤",
                description: error.message || "更新密碼失敗",
                variant: "destructive",
            })
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">載入中...</div>
    }

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"
                strategy="beforeInteractive"
            />
            <div className="container mx-auto p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">設定</h1>
                    <Button onClick={() => router.back()} variant="outline">
                        返回
                    </Button>
                </div>

                <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="profile">個人資料</TabsTrigger>
                        <TabsTrigger value="face">人臉辨識</TabsTrigger>
                        <TabsTrigger value="security">安全設定</TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile">
                        <Card>
                            <CardHeader>
                                <CardTitle>個人資料</CardTitle>
                                <CardDescription>
                                    更新您的個人資訊
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">姓名</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="請輸入姓名"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">電子郵件</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="請輸入電子郵件"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">電話號碼</Label>
                                    <Input
                                        id="phone"
                                        value={phonenumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="請輸入電話號碼"
                                    />
                                </div>
                                {userData?.address !== undefined && (
                                    <div className="space-y-2">
                                        <Label htmlFor="address">地址</Label>
                                        <Input
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="請輸入地址"
                                        />
                                    </div>
                                )}
                                <Button onClick={handleUpdateProfile} className="w-full">
                                    更新資料
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="face">
                        <Card>
                            <CardHeader>
                                <CardTitle>人臉辨識</CardTitle>
                                <CardDescription>
                                    設定人臉辨識功能以快速登入
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isFaceRegistering ? (
                                    <div className="space-y-4">
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
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            {userData?.face_descriptor
                                                ? "您已設定人臉辨識，可以重新設定或移除。"
                                                : "您尚未設定人臉辨識，設定後可以使用人臉快速登入。"}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={startFaceRegistration}
                                                className="flex-1"
                                            >
                                                {userData?.face_descriptor ? "重新設定人臉辨識" : "設定人臉辨識"}
                                            </Button>
                                            {userData?.face_descriptor && (
                                                <Button
                                                    variant="destructive"
                                                    onClick={async () => {
                                                        try {
                                                            const userId = localStorage.getItem("userId")
                                                            const userRole = localStorage.getItem("userRole") || "member"

                                                            const response = await fetch('/api/settings/face-register', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Content-Type': 'application/json',
                                                                },
                                                                body: JSON.stringify({
                                                                    userId,
                                                                    role: userRole,
                                                                    faceDescriptor: null,
                                                                }),
                                                            })

                                                            if (!response.ok) {
                                                                throw new Error('移除人臉特徵失敗')
                                                            }

                                                            toast({
                                                                title: "成功",
                                                                description: "已移除人臉辨識設定",
                                                            })

                                                            // 更新本地狀態
                                                            setUserData({
                                                                ...userData,
                                                                face_descriptor: null
                                                            })
                                                        } catch (error) {
                                                            toast({
                                                                title: "錯誤",
                                                                description: "移除人臉辨識失敗",
                                                                variant: "destructive",
                                                            })
                                                        }
                                                    }}
                                                >
                                                    移除人臉辨識
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="security">
                        <Card>
                            <CardHeader>
                                <CardTitle>安全設定</CardTitle>
                                <CardDescription>
                                    管理您的帳號安全設定
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="current-password">目前密碼</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        placeholder="請輸入目前密碼"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">新密碼</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        placeholder="請輸入新密碼"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">確認新密碼</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        placeholder="請再次輸入新密碼"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleUpdatePassword}
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword ? "更新中..." : "更新密碼"}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    )
} 