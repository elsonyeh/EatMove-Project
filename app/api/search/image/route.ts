import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rid = url.searchParams.get("rid") // 可選：指定餐廳ID
    
    console.log("🔍 獲取餐點圖片用於圖像搜尋")

    let query = `
      SELECT 
        m.dishid as id,
        m.name,
        m.image as url,
        m.description,
        m.price,
        m.rid,
        r.rname as restaurant_name,
        r.address as restaurant_address
      FROM menu m
      JOIN restaurant r ON m.rid = r.rid
      WHERE m.image IS NOT NULL AND m.image != ''
    `
    
    const queryParams: any[] = []
    
    if (rid) {
      query += " AND m.rid = $1"
      queryParams.push(rid)
    }
    
    query += " ORDER BY m.rid, m.dishid"

    const result = await pool.query(query, queryParams)

    const menuItems = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      url: row.url,
      description: row.description || "",
      price: parseFloat(row.price),
      rid: row.rid,
      restaurantName: row.restaurant_name,
      restaurantAddress: row.restaurant_address
    }))

    console.log(`✅ 找到 ${menuItems.length} 個有圖片的餐點`)

    return NextResponse.json({
      success: true,
      data: menuItems,
      total: menuItems.length
    })

  } catch (err: any) {
    console.error("❌ 獲取餐點圖片失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取餐點圖片失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 