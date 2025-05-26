// 臉部辨識配置
export const FACE_CONFIG = {
  // 檢測器選項
  DETECTOR_OPTIONS: {
    // SSD MobileNet v1 - 更精準但較慢
    SSD_MOBILENET: {
      minConfidence: 0.8,
      maxResults: 1
    },
    // Tiny Face Detector - 較快但精準度較低
    TINY_FACE: {
      inputSize: 416,
      scoreThreshold: 0.5
    }
  },

  // 相似度閾值
  SIMILARITY_THRESHOLDS: {
    // 歐氏距離閾值（越小越相似）
    EUCLIDEAN_STRICT: 0.4,      // 嚴格模式
    EUCLIDEAN_NORMAL: 0.55,     // 一般模式
    EUCLIDEAN_LOOSE: 0.8,       // 寬鬆模式
    
    // 餘弦相似度閾值（越大越相似）
    COSINE_STRICT: 0.8,         // 嚴格模式
    COSINE_NORMAL: 0.7,         // 一般模式
    COSINE_LOOSE: 0.6           // 寬鬆模式
  },

  // 檢測間隔（毫秒）
  DETECTION_INTERVAL: 80,

  // 攝影機設定
  CAMERA_CONSTRAINTS: [
    // 高品質設定
    {
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: 'user',
        frameRate: { ideal: 30 }
      }
    },
    // 中等品質設定
    {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
        frameRate: { ideal: 30 }
      }
    },
    // 基本設定
    {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      }
    }
  ],

  // 位置檢測參數
  POSITION_CHECK: {
    MARGIN: 15,           // 位置容忍度
    MIN_FACE_SIZE: 80,    // 最小人臉尺寸
    IDEAL_FACE_RATIO: 0.5 // 理想人臉佔畫面比例
  },

  // 註冊參數
  REGISTRATION: {
    REQUIRED_CAPTURES: 5,  // 需要擷取的照片數量
    CAPTURE_DELAY: 2000    // 擷取間隔（毫秒）
  },

  // 模型載入超時
  MODEL_LOAD_TIMEOUT: 30000,

  // 攝影機啟動超時
  CAMERA_TIMEOUT: 15000,

  // 新增：多重驗證參數
  MULTI_VERIFICATION: {
    REQUIRED_CONSECUTIVE_MATCHES: 3,  // 需要連續3次成功匹配
    VERIFICATION_WINDOW: 5000,        // 5秒內完成驗證
    MIN_QUALITY_SCORE: 0.7           // 最低品質分數
  }
}

// 計算餘弦相似度
export function calculateCosineSimilarity(descriptor1: Float32Array, descriptor2: Float32Array): number {
  const dotProduct = descriptor1.reduce((sum: number, val: number, i: number) => sum + val * descriptor2[i], 0)
  const normA = Math.sqrt(descriptor1.reduce((sum: number, val: number) => sum + val * val, 0))
  const normB = Math.sqrt(descriptor2.reduce((sum: number, val: number) => sum + val * val, 0))
  return dotProduct / (normA * normB)
}

// 評估人臉品質
export function assessFaceQuality(detection: any): { score: number; issues: string[] } {
  const issues: string[] = []
  let score = 1.0

  // 檢查檢測信心度
  if (detection.detection && detection.detection.score) {
    const confidence = detection.detection.score
    if (confidence < 0.9) {
      issues.push('檢測信心度較低')
      score *= confidence
    }
  }

  // 檢查人臉大小
  const box = detection.box || detection.detection?.box
  if (box) {
    const faceArea = box.width * box.height
    if (faceArea < 10000) { // 100x100 像素
      issues.push('人臉太小')
      score *= 0.7
    }
    
    // 檢查長寬比
    const aspectRatio = box.width / box.height
    if (aspectRatio < 0.7 || aspectRatio > 1.3) {
      issues.push('人臉角度不佳')
      score *= 0.8
    }
  }

  // 檢查特徵點品質
  if (detection.landmarks) {
    const landmarks = detection.landmarks.positions || detection.landmarks._positions
    if (landmarks && landmarks.length < 68) {
      issues.push('特徵點不完整')
      score *= 0.6
    }
  }

  // 檢查描述符品質
  if (detection.descriptor) {
    const descriptor = detection.descriptor
    const variance = calculateDescriptorVariance(descriptor)
    if (variance < 0.01) {
      issues.push('特徵描述符變異度過低')
      score *= 0.7
    }
  }

  return { score, issues }
}

// 計算描述符變異度
function calculateDescriptorVariance(descriptor: Float32Array): number {
  const mean = descriptor.reduce((sum: number, val: number) => sum + val, 0) / descriptor.length
  const variance = descriptor.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / descriptor.length
  return variance
}

// 多重驗證管理器
export class MultiVerificationManager {
  private matches: { timestamp: number; euclidean: number; cosine: number; quality: number }[] = []
  private readonly config = FACE_CONFIG.MULTI_VERIFICATION

  addMatch(euclideanDistance: number, cosineSimilarity: number, qualityScore: number): boolean {
    const now = Date.now()
    
    // 清理過期的匹配記錄
    this.matches = this.matches.filter(match => 
      now - match.timestamp < this.config.VERIFICATION_WINDOW
    )

    // 檢查是否符合品質要求
    if (qualityScore < this.config.MIN_QUALITY_SCORE) {
      return false
    }

    // 檢查是否符合相似度要求
    const { EUCLIDEAN_STRICT, COSINE_STRICT } = FACE_CONFIG.SIMILARITY_THRESHOLDS
    if (euclideanDistance < EUCLIDEAN_STRICT && cosineSimilarity > COSINE_STRICT) {
      this.matches.push({
        timestamp: now,
        euclidean: euclideanDistance,
        cosine: cosineSimilarity,
        quality: qualityScore
      })

      // 檢查是否達到連續匹配要求
      return this.matches.length >= this.config.REQUIRED_CONSECUTIVE_MATCHES
    }

    return false
  }

  reset(): void {
    this.matches = []
  }

  getMatchCount(): number {
    return this.matches.length
  }

  getAverageScores(): { euclidean: number; cosine: number; quality: number } {
    if (this.matches.length === 0) {
      return { euclidean: 1, cosine: 0, quality: 0 }
    }

    const totals = this.matches.reduce((acc, match) => ({
      euclidean: acc.euclidean + match.euclidean,
      cosine: acc.cosine + match.cosine,
      quality: acc.quality + match.quality
    }), { euclidean: 0, cosine: 0, quality: 0 })

    return {
      euclidean: totals.euclidean / this.matches.length,
      cosine: totals.cosine / this.matches.length,
      quality: totals.quality / this.matches.length
    }
  }
}

// 檢查人臉是否在理想位置
export function checkFacePosition(
  box: { x: number; y: number; width: number; height: number },
  canvasWidth: number,
  canvasHeight: number
): { isInPosition: boolean; message: string } {
  const { MARGIN, MIN_FACE_SIZE, IDEAL_FACE_RATIO } = FACE_CONFIG.POSITION_CHECK
  
  const idealSize = Math.min(canvasWidth, canvasHeight) * IDEAL_FACE_RATIO
  const idealX = (canvasWidth - idealSize) / 2
  const idealY = (canvasHeight - idealSize) / 2

  const isInPosition = (
    box.x > (idealX - MARGIN) &&
    box.y > (idealY - MARGIN) &&
    box.x + box.width < (idealX + idealSize + MARGIN) &&
    box.y + box.height < (idealY + idealSize + MARGIN) &&
    box.width > MIN_FACE_SIZE && 
    box.height > MIN_FACE_SIZE
  )

  let message = ''
  if (!isInPosition) {
    if (box.x <= (idealX - MARGIN)) {
      message = '請向右移動一些'
    } else if (box.x + box.width >= (idealX + idealSize + MARGIN)) {
      message = '請向左移動一些'
    } else if (box.y <= (idealY - MARGIN)) {
      message = '請向下移動一些'
    } else if (box.y + box.height >= (idealY + idealSize + MARGIN)) {
      message = '請向上移動一些'
    } else if (box.width > idealSize * 1.2 || box.height > idealSize * 1.2) {
      message = '請後退一些，臉部太大'
    } else if (box.width < MIN_FACE_SIZE || box.height < MIN_FACE_SIZE) {
      message = '請靠近一些，臉部太小'
    } else {
      message = '請微調位置到框框中心'
    }
  } else {
    message = '位置正確！'
  }

  return { isInPosition, message }
}

// 繪製人臉檢測框
export function drawFaceDetectionOverlay(
  canvas: HTMLCanvasElement,
  videoWidth: number,
  videoHeight: number,
  detections: any[] = []
): void {
  const context = canvas.getContext('2d')
  if (!context) return

  canvas.width = videoWidth
  canvas.height = videoHeight
  context.clearRect(0, 0, canvas.width, canvas.height)

  const { IDEAL_FACE_RATIO } = FACE_CONFIG.POSITION_CHECK
  const idealSize = Math.min(canvas.width, canvas.height) * IDEAL_FACE_RATIO
  const idealX = (canvas.width - idealSize) / 2
  const idealY = (canvas.height - idealSize) / 2

  // 繪製理想位置框
  context.strokeStyle = '#ffffff'
  context.lineWidth = 3
  context.setLineDash([5, 5])
  context.strokeRect(idealX, idealY, idealSize, idealSize)

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

  // 繪製檢測到的人臉
  detections.forEach(detection => {
    let box = detection.box || detection.detection?.box || detection._box
    if (box) {
      const { isInPosition } = checkFacePosition(box, canvas.width, canvas.height)
      const quality = assessFaceQuality(detection)
      
      // 根據品質調整顏色
      let color = '#ff0000' // 紅色：不合格
      if (isInPosition && quality.score > 0.8) {
        color = '#00ff00' // 綠色：優秀
      } else if (isInPosition && quality.score > 0.6) {
        color = '#ffff00' // 黃色：良好
      } else if (isInPosition) {
        color = '#ff8800' // 橙色：可接受
      }
      
      context.strokeStyle = color
      context.lineWidth = 3
      context.setLineDash([])
      context.strokeRect(box.x, box.y, box.width, box.height)
      
      // 顯示品質分數
      context.fillStyle = color
      context.font = '16px Arial'
      context.fillText(
        `品質: ${(quality.score * 100).toFixed(0)}%`,
        box.x,
        box.y - 10
      )
    }
  })
} 