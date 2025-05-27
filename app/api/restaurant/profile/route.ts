import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 獲取餐廳資料
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rid = url.searchParams.get("rid")

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    const result = await pool.query(
      `SELECT 
        rid,
        rname as name,
        raddress as address,
        description,
        rphonenumber as phone,
        remail as email,
        rating,
        min_order,
        image,
        business_hours,
        is_open,
        delivery_area,
        cuisine
      FROM restaurant 
      WHERE rid = $1`,
      [rid]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "餐廳不存在" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      restaurant: result.rows[0]
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

// 更新餐廳資料
export async function PUT(req: Request) {
  try {
    const data = await req.json()
    const {
      rid,
      name,
      description,
      address,
      phone,
      email,
      business_hours,
      min_order,
      is_open,
      image,
      delivery_area,
      cuisine
    } = data

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    // 更新餐廳資料
    const result = await pool.query(
      `UPDATE restaurant 
       SET 
         rname = $1,
         description = $2,
         raddress = $3,
         rphonenumber = $4,
         remail = $5,
         business_hours = $6,
         min_order = $7,
         is_open = $8,
         image = $9,
         delivery_area = $10,
         cuisine = $11,
         updated_at = CURRENT_TIMESTAMP
       WHERE rid = $12
       RETURNING *`,
      [
        name,
        description,
        address,
        phone,
        email,
        business_hours,
        min_order,
        is_open,
        image,
        delivery_area,
        cuisine,
        rid
      ]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "餐廳不存在或更新失敗" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "餐廳資料更新成功",
      restaurant: result.rows[0]
    })

  } catch (err: any) {
    console.error("❌ 更新餐廳資料失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "資料庫更新失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 