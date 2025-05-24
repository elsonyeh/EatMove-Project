"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Bell, Moon, Sun, Shield } from "lucide-react"
import * as faceapi from 'face-api.js'

export default function UserSettingsPage() {
  const { toast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [modelsLoaded, setModelsLoaded] = useState(false)

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
    loadModels()
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStream(stream)
      }
      setIsRegistering(true)
    } catch (error) {
      console.error('Error accessing camera:', error)
      toast({
        title: "錯誤",
        description: "無法存取攝影機",
        variant: "destructive",
      })
    }
  }

  // 停止註冊人臉
  const stopFaceRegistration = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsRegistering(false)
  }

  // 註冊人臉特徵
  const registerFace = async () => {
    if (!videoRef.current || !modelsLoaded) return

    try {
      const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()

      if (detections.length === 0) {
        toast({
          title: "錯誤",
          description: "未偵測到人臉，請確保臉部在攝影機畫面中",
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

      // 取得人臉特徵
      const faceDescriptor = detections[0].descriptor

      // 儲存人臉特徵到資料庫
      const response = await fetch('/api/face-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user-id', // 這裡需要替換成實際的使用者 ID
          faceDescriptor: Array.from(faceDescriptor),
        }),
      })

      if (!response.ok) {
        throw new Error('儲存人臉特徵失敗')
      }

      toast({
        title: "成功",
        description: "已成功註冊人臉特徵",
      })

      stopFaceRegistration()
    } catch (error) {
      console.error('Error registering face:', error)
      toast({
        title: "錯誤",
        description: "註冊人臉特徵時發生錯誤",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">安全設定</h1>
        <p className="text-muted-foreground">管理您的登入和安全選項</p>
      </div>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>人臉辨識</CardTitle>
            <CardDescription>設定人臉辨識登入功能</CardDescription>
          </CardHeader>
          <CardContent>
            {isRegistering ? (
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
                <div className="flex gap-2">
                  <Button
                    onClick={registerFace}
                    className="flex-1"
                  >
                    註冊人臉
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
                  註冊您的人臉特徵以啟用人臉辨識登入功能。請確保在明亮的環境下進行註冊，並保持臉部在攝影機畫面中央。
                </p>
                <Button onClick={startFaceRegistration}>
                  開始註冊人臉
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
