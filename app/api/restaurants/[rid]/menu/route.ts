import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await params
    const url = new URL(req.url)
    const category = url.searchParams.get("category") || ""
    const search = url.searchParams.get("search") || ""

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    // 首先獲取餐廳資訊
    const restaurantResult = await pool.query(
      "SELECT rid, rname, raddress, description FROM restaurant WHERE rid = $1",
      [rid]
    )

    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "餐廳不存在" 
      }, { status: 404 })
    }

    const restaurant = restaurantResult.rows[0]

    // 構建菜單查詢 - 使用正確的欄位名稱
    let menuQuery = `
      SELECT 
        mid,
        name,
        description,
        price,
        image,
        category
      FROM menu 
      WHERE rid = $1
    `

    const queryParams: any[] = [rid]
    let paramIndex = 2

    // 類別過濾
    if (category) {
      menuQuery += ` AND LOWER(category) LIKE LOWER($${paramIndex})`
      queryParams.push(`%${category}%`)
      paramIndex++
    }

    // 搜尋過濾
    if (search) {
      menuQuery += ` AND (
        LOWER(name) LIKE LOWER($${paramIndex}) OR 
        LOWER(description) LIKE LOWER($${paramIndex}) OR
        LOWER(category) LIKE LOWER($${paramIndex})
      )`
      queryParams.push(`%${search}%`)
      paramIndex++
    }

    menuQuery += ` ORDER BY category ASC, name ASC`

    const menuResult = await pool.query(menuQuery, queryParams)

    // 按類別分組菜單項目
    const menuByCategory: { [key: string]: any[] } = {}
    const categories = new Set<string>()

    menuResult.rows.forEach((item) => {
      const cat = item.category || "其他"
      categories.add(cat)
      
      if (!menuByCategory[cat]) {
        menuByCategory[cat] = []
      }
      
      menuByCategory[cat].push({
        id: `${rid}-${item.mid}`,
        dishId: item.mid,
        name: item.name,
        description: item.description || '',
        price: parseFloat(item.price),
        image: item.image || '/images/menu/default.jpg',
        category: item.category,
        isPopular: false, // 預設值，因為資料庫中沒有這個欄位
        isAvailable: true // 預設值，因為資料庫中沒有這個欄位
      })
    })

    return NextResponse.json({
      success: true,
      restaurant: {
        id: restaurant.rid,
        name: restaurant.rname,
        address: restaurant.raddress,
        description: restaurant.description
      },
      menu: menuByCategory,
      categories: Array.from(categories).sort(),
      totalItems: menuResult.rows.length
    })

  } catch (err: any) {
    console.error("❌ 獲取菜單失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "資料庫讀取失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 