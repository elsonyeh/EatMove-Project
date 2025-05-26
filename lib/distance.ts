// 計算兩點間的距離（使用 Haversine 公式）
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  try {
    // 輸入驗證
    if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
      console.warn("距離計算：無效的座標輸入", { lat1, lng1, lat2, lng2 })
      return 1.0 // 返回預設距離
    }
    
    // 檢查座標範圍是否合理
    if (Math.abs(lat1) > 90 || Math.abs(lat2) > 90 || Math.abs(lng1) > 180 || Math.abs(lng2) > 180) {
      console.warn("距離計算：座標超出有效範圍", { lat1, lng1, lat2, lng2 })
      return 1.0 // 返回預設距離
    }
    
    const R = 6371 // 地球半徑（公里）
    const dLat = toRadians(lat2 - lat1)
    const dLng = toRadians(lng2 - lng1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c
    
    const result = Math.round(distance * 1000) / 1000 // 四捨五入到小數點後三位，提高精確度
    
    // 確保結果是有效數字
    return isNaN(result) || result < 0 ? 1.0 : result
  } catch (error) {
    console.error("距離計算錯誤:", error)
    return 1.0 // 返回預設距離
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// 格式化距離顯示（小於1公里顯示公尺，更精確的數字）
export function formatDistance(distance: number): string {
  try {
    // 輸入驗證
    if (isNaN(distance) || distance < 0) {
      return "1.0km" // 返回預設值
    }
    
    if (distance < 0.01) {
      // 小於10公尺時，顯示精確到1公尺
      const meters = Math.round(distance * 1000)
      return `${Math.max(meters, 1)}m` // 最小顯示1公尺
    } else if (distance < 0.1) {
      // 10-100公尺時，顯示精確到5公尺
      const meters = Math.round(distance * 1000 / 5) * 5
      return `${meters}m`
    } else if (distance < 1) {
      // 100公尺到1公里時，顯示精確到10公尺
      const meters = Math.round(distance * 1000 / 10) * 10
      return `${meters}m`
    } else if (distance < 3) {
      // 1-3公里時，顯示到小數點後一位
      return `${distance.toFixed(1)}km`
    } else if (distance < 10) {
      // 3-10公里時，顯示到小數點後一位
      return `${distance.toFixed(1)}km`
    } else if (distance < 50) {
      // 10-50公里時，顯示到小數點後一位或整數（根據精確度）
      const rounded = Math.round(distance * 10) / 10
      return rounded % 1 === 0 ? `${Math.round(distance)}km` : `${rounded}km`
    } else {
      // 大於50公里時，顯示整數
      return `${Math.round(distance)}km`
    }
  } catch (error) {
    console.error("距離格式化錯誤:", error)
    return "1.0km" // 返回預設值
  }
}

// 根據距離計算預估送達時間
export function calculateDeliveryTime(distance: number): string {
  if (distance <= 1) {
    return "15-25"
  } else if (distance <= 2) {
    return "20-30"
  } else if (distance <= 3) {
    return "25-35"
  } else if (distance <= 5) {
    return "30-45"
  } else if (distance <= 8) {
    return "40-55"
  } else {
    return "50-70"
  }
}

// 根據距離計算外送費
export function calculateDeliveryFee(distance: number): number {
  const baseFee = 50
  
  if (distance <= 1) {
    return baseFee
  } else if (distance <= 3) {
    return baseFee + 20
  } else if (distance <= 5) {
    return baseFee + 40
  } else {
    return baseFee + 60
  }
}

// 台灣主要城市/區域的座標（用於地址轉換）
export const taiwanDistricts: { [key: string]: { lat: number; lng: number } } = {
  // 台北市
  "信義區": { lat: 25.0330, lng: 121.5654 },
  "大安區": { lat: 25.0267, lng: 121.5436 },
  "中山區": { lat: 25.0636, lng: 121.5264 },
  "松山區": { lat: 25.0497, lng: 121.5746 },
  "內湖區": { lat: 25.0820, lng: 121.5947 },
  "士林區": { lat: 25.0883, lng: 121.5258 },
  "北投區": { lat: 25.1316, lng: 121.5017 },
  "中正區": { lat: 25.0320, lng: 121.5081 },
  "萬華區": { lat: 25.0340, lng: 121.5000 },
  "文山區": { lat: 24.9889, lng: 121.5706 },
  "南港區": { lat: 25.0554, lng: 121.6078 },
  "大同區": { lat: 25.0633, lng: 121.5130 },
  
  // 高雄市
  "新興區": { lat: 22.6273, lng: 120.3014 },
  "前金區": { lat: 22.6278, lng: 120.2873 },
  "苓雅區": { lat: 22.6228, lng: 120.3308 },
  "鹽埕區": { lat: 22.6255, lng: 120.2816 },
  "鼓山區": { lat: 22.6578, lng: 120.2769 },
  "旗津區": { lat: 22.6158, lng: 120.2675 },
  "前鎮區": { lat: 22.5892, lng: 120.3308 },
  "三民區": { lat: 22.6392, lng: 120.3125 },
  "左營區": { lat: 22.6892, lng: 120.2942 },
  "楠梓區": { lat: 22.7331, lng: 120.3278 },
  "小港區": { lat: 22.5642, lng: 120.3308 },
  "鳳山區": { lat: 22.6270, lng: 120.3570 },
  "林園區": { lat: 22.5042, lng: 120.4114 },
  "大寮區": { lat: 22.5653, lng: 120.3953 },
  "大樹區": { lat: 22.6892, lng: 120.4281 },
  "大社區": { lat: 22.7281, lng: 120.3531 },
  "仁武區": { lat: 22.7089, lng: 120.3478 },
  "鳥松區": { lat: 22.6642, lng: 120.3642 },
  "岡山區": { lat: 22.7978, lng: 120.2953 },
  "橋頭區": { lat: 22.7578, lng: 120.3058 },
  "燕巢區": { lat: 22.7892, lng: 120.3614 },
  "田寮區": { lat: 22.8642, lng: 120.4031 },
  "阿蓮區": { lat: 22.8831, lng: 120.3281 },
  "路竹區": { lat: 22.8578, lng: 120.2642 },
  "湖內區": { lat: 22.9031, lng: 120.2142 },
  "茄萣區": { lat: 22.9031, lng: 120.1831 },
  "永安區": { lat: 22.8231, lng: 120.2331 },
  "彌陀區": { lat: 22.7831, lng: 120.2481 },
  "梓官區": { lat: 22.7531, lng: 120.2531 },
  "旗山區": { lat: 22.8892, lng: 120.4831 },
  "美濃區": { lat: 22.8831, lng: 120.5431 },
  "六龜區": { lat: 22.9992, lng: 120.6331 },
  "甲仙區": { lat: 23.0831, lng: 120.5831 },
  "杉林區": { lat: 22.9692, lng: 120.5531 },
  "內門區": { lat: 22.9331, lng: 120.4631 },
  "茂林區": { lat: 22.8892, lng: 120.6631 },
  "桃源區": { lat: 23.1531, lng: 120.7431 },
  "那瑪夏區": { lat: 23.2131, lng: 120.7031 }
}

// 從地址提取區域並獲取座標
export function getCoordinatesFromAddress(address: string): { lat: number; lng: number } | null {
  for (const [district, coords] of Object.entries(taiwanDistricts)) {
    if (address.includes(district)) {
      return coords
    }
  }
  
  // 如果找不到特定區域，檢查是否包含高雄市，返回高雄市中心座標
  if (address.includes("高雄")) {
    return { lat: 22.6273, lng: 120.3014 } // 高雄市新興區（市中心）
  }
  
  // 如果找不到特定區域，返回台北市中心座標
  return { lat: 25.0330, lng: 121.5654 }
}

// 根據用戶位置和餐廳地址計算距離和送達時間
export function calculateRestaurantDistance(
  userAddress: string,
  restaurantAddress: string,
  userLat?: number,
  userLng?: number
): {
  distance: number
  distanceText: string
  deliveryTime: string
  deliveryFee: number
} {
  try {
    let userCoords: { lat: number; lng: number }
    
    // 如果有提供用戶座標，直接使用
    if (userLat && userLng && !isNaN(userLat) && !isNaN(userLng)) {
      userCoords = { lat: userLat, lng: userLng }
    } else {
      // 否則從地址推斷座標
      userCoords = getCoordinatesFromAddress(userAddress || "高雄市") || { lat: 22.6273, lng: 120.3014 }
    }
    
    const restaurantCoords = getCoordinatesFromAddress(restaurantAddress || "高雄市") || { lat: 22.6273, lng: 120.3014 }
    
    const distance = calculateDistance(
      userCoords.lat,
      userCoords.lng,
      restaurantCoords.lat,
      restaurantCoords.lng
    )
    
    // 確保距離是有效數字
    const validDistance = isNaN(distance) || distance < 0 ? 1.0 : distance
    
    return {
      distance: validDistance,
      distanceText: formatDistance(validDistance),
      deliveryTime: calculateDeliveryTime(validDistance),
      deliveryFee: calculateDeliveryFee(validDistance)
    }
  } catch (error) {
    console.error("距離計算錯誤:", error)
    // 返回預設值
    return {
      distance: 1.0,
      distanceText: "1.0km",
      deliveryTime: "20-30",
      deliveryFee: 60
    }
  }
}

// 測試距離顯示效果的函數
export function testDistanceDisplay() {
  const testDistances = [
    0.001,  // 1公尺
    0.005,  // 5公尺
    0.015,  // 15公尺
    0.025,  // 25公尺
    0.045,  // 45公尺
    0.08,   // 80公尺
    0.15,   // 150公尺
    0.25,   // 250公尺
    0.35,   // 350公尺
    0.55,   // 550公尺
    0.75,   // 750公尺
    0.95,   // 950公尺
    1.2,    // 1.2公里
    1.8,    // 1.8公里
    2.3,    // 2.3公里
    2.8,    // 2.8公里
    4.5,    // 4.5公里
    7.2,    // 7.2公里
    9.8,    // 9.8公里
    12.0,   // 12.0公里
    15.7,   // 15.7公里
    25.3,   // 25.3公里
    45.8,   // 45.8公里
    67.2    // 67.2公里
  ]

  console.log("距離顯示測試（更精確版本）：")
  console.log("原始距離 -> 顯示格式")
  console.log("─".repeat(25))
  testDistances.forEach(distance => {
    console.log(`${distance.toFixed(3)}km -> ${formatDistance(distance)}`)
  })
} 