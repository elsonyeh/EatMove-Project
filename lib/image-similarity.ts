/**
 * 圖像相似度分析工具
 * 使用色彩直方圖和簡單的特徵提取來比較圖像相似度
 */

export interface ImageFeatures {
  colorHistogram: number[]
  brightness: number
  contrast: number
  dominantColors: string[]
  edgeDensity: number
}

export interface SimilarityResult {
  score: number // 0-1之間，1表示最相似
  features: ImageFeatures
}

/**
 * 從圖像文件提取特徵
 */
export async function extractImageFeatures(file: File): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      try {
        // 設置畫布大小
        const maxSize = 256
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        // 繪製圖像
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 獲取圖像數據
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // 提取特徵
        const features = analyzeImageData(data, canvas.width, canvas.height)
        resolve(features)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('無法載入圖像'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 從圖像URL提取特徵
 */
export async function extractImageFeaturesFromUrl(imageUrl: string): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.crossOrigin = 'anonymous' // 允許跨域
    
    img.onload = () => {
      try {
        // 設置畫布大小
        const maxSize = 256
        const scale = Math.min(maxSize / img.width, maxSize / img.height)
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        
        // 繪製圖像
        ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        // 獲取圖像數據
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        // 提取特徵
        const features = analyzeImageData(data, canvas.width, canvas.height)
        resolve(features)
      } catch (error) {
        reject(error)
      }
    }
    
    img.onerror = () => reject(new Error('無法載入圖像'))
    img.src = imageUrl
  })
}

/**
 * 分析圖像數據提取特徵
 */
function analyzeImageData(data: Uint8ClampedArray, width: number, height: number): ImageFeatures {
  const pixels = data.length / 4
  
  // 色彩直方圖 (RGB各64個bins)
  const colorHistogram = new Array(192).fill(0)
  
  // 亮度和對比度計算
  let totalBrightness = 0
  let brightnessSquareSum = 0
  
  // 邊緣檢測用的梯度計算
  let edgeSum = 0
  
  // 主色彩統計
  const colorCounts: { [key: string]: number } = {}
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    
    // 計算亮度
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
    totalBrightness += brightness
    brightnessSquareSum += brightness * brightness
    
    // 更新色彩直方圖
    const rBin = Math.floor(r / 4) // 0-63
    const gBin = Math.floor(g / 4) // 0-63
    const bBin = Math.floor(b / 4) // 0-63
    
    colorHistogram[rBin]++
    colorHistogram[64 + gBin]++
    colorHistogram[128 + bBin]++
    
    // 統計主色彩 (量化到16x16x16)
    const colorKey = `${Math.floor(r / 16)},${Math.floor(g / 16)},${Math.floor(b / 16)}`
    colorCounts[colorKey] = (colorCounts[colorKey] || 0) + 1
    
    // 簡單邊緣檢測 (計算相鄰像素的梯度)
    const pixelIndex = i / 4
    const x = pixelIndex % width
    const y = Math.floor(pixelIndex / width)
    
    if (x < width - 1 && y < height - 1) {
      const rightPixel = (y * width + x + 1) * 4
      const bottomPixel = ((y + 1) * width + x) * 4
      
      if (rightPixel < data.length && bottomPixel < data.length) {
        const gradientX = Math.abs(brightness - (data[rightPixel] * 0.299 + data[rightPixel + 1] * 0.587 + data[rightPixel + 2] * 0.114))
        const gradientY = Math.abs(brightness - (data[bottomPixel] * 0.299 + data[bottomPixel + 1] * 0.587 + data[bottomPixel + 2] * 0.114))
        edgeSum += Math.sqrt(gradientX * gradientX + gradientY * gradientY)
      }
    }
  }
  
  // 正規化直方圖
  const normalizedHistogram = colorHistogram.map(count => count / pixels)
  
  // 計算平均亮度和對比度
  const avgBrightness = totalBrightness / pixels
  const variance = (brightnessSquareSum / pixels) - (avgBrightness * avgBrightness)
  const contrast = Math.sqrt(variance)
  
  // 計算邊緣密度
  const edgeDensity = edgeSum / (width * height)
  
  // 找出主要色彩
  const sortedColors = Object.entries(colorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([color]) => {
      const [r, g, b] = color.split(',').map(Number)
      return `rgb(${r * 16}, ${g * 16}, ${b * 16})`
    })
  
  return {
    colorHistogram: normalizedHistogram,
    brightness: avgBrightness / 255, // 正規化到0-1
    contrast: contrast / 255, // 正規化到0-1
    dominantColors: sortedColors,
    edgeDensity: Math.min(edgeDensity / 50, 1) // 正規化到0-1
  }
}

/**
 * 比較兩個圖像的相似度
 */
export function calculateSimilarity(features1: ImageFeatures, features2: ImageFeatures): number {
  // 1. 色彩直方圖相似度 (權重: 60%)
  let histogramSimilarity = 0
  for (let i = 0; i < features1.colorHistogram.length; i++) {
    histogramSimilarity += Math.min(features1.colorHistogram[i], features2.colorHistogram[i])
  }
  
  // 2. 亮度相似度 (權重: 15%)
  const brightnessSimilarity = 1 - Math.abs(features1.brightness - features2.brightness)
  
  // 3. 對比度相似度 (權重: 15%)
  const contrastSimilarity = 1 - Math.abs(features1.contrast - features2.contrast)
  
  // 4. 邊緣密度相似度 (權重: 10%)
  const edgeSimilarity = 1 - Math.abs(features1.edgeDensity - features2.edgeDensity)
  
  // 加權平均
  const totalSimilarity = 
    histogramSimilarity * 0.6 +
    brightnessSimilarity * 0.15 +
    contrastSimilarity * 0.15 +
    edgeSimilarity * 0.1
  
  return Math.max(0, Math.min(1, totalSimilarity))
}

/**
 * 批量比較圖像相似度
 */
export async function findSimilarImages(
  queryFeatures: ImageFeatures,
  candidateImages: { id: string; url: string; name: string; description?: string }[],
  threshold: number = 0.3,
  maxResults: number = 10
): Promise<Array<{ id: string; url: string; name: string; description?: string; similarity: number }>> {
  const results: Array<{ id: string; url: string; name: string; description?: string; similarity: number }> = []
  
  for (const candidate of candidateImages) {
    try {
      const candidateFeatures = await extractImageFeaturesFromUrl(candidate.url)
      const similarity = calculateSimilarity(queryFeatures, candidateFeatures)
      
      if (similarity >= threshold) {
        results.push({
          ...candidate,
          similarity
        })
      }
    } catch (error) {
      console.warn(`無法分析圖像 ${candidate.url}:`, error)
    }
  }
  
  // 按相似度排序並返回前N個結果
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
}

/**
 * 生成圖像縮略圖用於預覽
 */
export function generateThumbnail(file: File, maxSize: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale
      
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    
    img.onerror = () => reject(new Error('無法生成縮略圖'))
    img.src = URL.createObjectURL(file)
  })
} 