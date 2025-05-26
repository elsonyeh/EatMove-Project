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
    const body = await req.json()
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
      rating,
      cuisine
    } = body

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE restaurant 
       SET 
         rname = $2,
         raddress = $3,
         description = $4,
         rphonenumber = $5,
         remail = $6,
         business_hours = $7,
         min_order = $8,
         is_open = $9,
         image = $10,
         delivery_area = $11,
         rating = $12,
         cuisine = $13
       WHERE rid = $1
       RETURNING rid, rname`,
      [
        rid,
        name,
        address,
        description,
        phone,
        email,
        business_hours,
        min_order,
        is_open,
        image,
        delivery_area,
        rating,
        cuisine
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