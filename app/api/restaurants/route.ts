import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { calculateRestaurantDistance } from "@/lib/distance"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const search = url.searchParams.get("search") || ""
    const category = url.searchParams.get("category") || ""
    const userLat = parseFloat(url.searchParams.get("lat") || "0")
    const userLng = parseFloat(url.searchParams.get("lng") || "0")
    const userAddress = url.searchParams.get("address") || "高雄市"

    let query = `
      SELECT 
        r.rid,
        r.rname as name,
        r.raddress as address,
        r.description,
        r.rphonenumber as phone,
        r.remail as email,
        r.rating,
        r.min_order,
        r.image,
        r.business_hours,
        r.is_open,
        r.delivery_area,
        r.cuisine
      FROM restaurant r
      WHERE r.is_open = true
    `

    const params: any[] = []
    let paramIndex = 1

    // 搜尋過濾（包含地區搜尋）
    if (search) {
      query += ` AND (
        LOWER(r.rname) LIKE LOWER($${paramIndex}) OR 
        LOWER(r.description) LIKE LOWER($${paramIndex}) OR
        LOWER(r.raddress) LIKE LOWER($${paramIndex}) OR
        LOWER(r.delivery_area) LIKE LOWER($${paramIndex}) OR
        LOWER(r.cuisine) LIKE LOWER($${paramIndex}) OR
        EXISTS (
          SELECT 1 FROM menu m 
          WHERE m.rid = r.rid AND (
            LOWER(m.name) LIKE LOWER($${paramIndex}) OR 
            LOWER(m.description) LIKE LOWER($${paramIndex}) OR
            LOWER(m.category) LIKE LOWER($${paramIndex})
          )
        )
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    // 類別過濾（根據資料庫中的cuisine欄位）
    if (category && category !== "all") {
      const categoryMap: { [key: string]: string } = {
        "chinese": "中式料理",
        "japanese": "日式料理", 
        "korean": "韓式料理",
        "western": "西式料理",
        "thai": "泰式料理",
        "italian": "義式料理",
        "american": "美式料理",
        "taiwanese": "台式料理",
        "vegetarian": "素食",
        "dessert": "甜點",
        "beverage": "飲料"
      }
      
      const cuisineType = categoryMap[category]
      if (cuisineType) {
        query += ` AND LOWER(r.cuisine) LIKE LOWER($${paramIndex})`
        params.push(`%${cuisineType}%`)
        paramIndex++
      }
    }

    query += ` ORDER BY r.rating DESC, r.rname ASC`

    const result = await pool.query(query, params)

    // 為每個餐廳計算距離和添加菜單預覽
    const restaurants = await Promise.all(
      result.rows.map(async (restaurant) => {
        try {
          // 計算距離和送達時間
          const distanceInfo = calculateRestaurantDistance(
            userAddress,
            restaurant.address || "高雄市",
            userLat || undefined,
            userLng || undefined
          )

          // 獲取菜單預覽
          const menuResult = await pool.query(
            `SELECT name, price, image, category, ispopular 
             FROM menu 
             WHERE rid = $1 AND isavailable = true 
             ORDER BY ispopular DESC, price ASC 
             LIMIT 3`,
            [restaurant.rid]
          )

          return {
            id: restaurant.rid,
            name: restaurant.name,
            cuisine: restaurant.cuisine || '綜合料理',
            rating: parseFloat(restaurant.rating) || 4.5,
            image: restaurant.image || '/images/restaurants/default.jpg',
            description: restaurant.description,
            minOrder: restaurant.min_order || 300,
            deliveryFee: distanceInfo.deliveryFee,
            distance: distanceInfo.distanceText,
            address: restaurant.address,
            phone: restaurant.phone,
            businessHours: restaurant.business_hours,
            isOpen: restaurant.is_open,
            deliveryArea: restaurant.delivery_area,
            menuPreview: menuResult.rows
          }
        } catch (error) {
          console.error(`處理餐廳 ${restaurant.rid} 時發生錯誤:`, error)
          // 返回基本資訊，使用預設距離
          return {
            id: restaurant.rid,
            name: restaurant.name,
            cuisine: restaurant.cuisine || '綜合料理',
            rating: parseFloat(restaurant.rating) || 4.5,
            image: restaurant.image || '/images/restaurants/default.jpg',
            description: restaurant.description,
            minOrder: restaurant.min_order || 300,
            deliveryFee: 60, // 預設外送費
            distance: "計算中", // 預設距離
            address: restaurant.address,
            phone: restaurant.phone,
            businessHours: restaurant.business_hours,
            isOpen: restaurant.is_open,
            deliveryArea: restaurant.delivery_area,
            menuPreview: []
          }
        }
      })
    )

    // 按距離排序（使用數值距離）
    restaurants.sort((a, b) => {
      try {
        // 安全地解析距離字符串
        const parseDistance = (distanceStr: string): number => {
          if (!distanceStr) return 999999 // 如果沒有距離，排到最後
          
          const numStr = distanceStr.replace(/[km|m]/g, '')
          const num = parseFloat(numStr)
          
          if (isNaN(num)) return 999999 // 如果解析失敗，排到最後
          
          // 如果是公尺，轉換為公里
          return distanceStr.includes('m') && !distanceStr.includes('km') ? num / 1000 : num
        }
        
        const aDistance = parseDistance(a.distance)
        const bDistance = parseDistance(b.distance)
        
        return aDistance - bDistance
      } catch (error) {
        console.error("排序錯誤:", error)
        return 0 // 如果排序出錯，保持原順序
      }
    })

    return NextResponse.json({ 
      success: true, 
      restaurants,
      total: restaurants.length 
    })

  } catch (err: any) {
    console.error("❌ 獲取餐廳資料失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "資料庫讀取失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 