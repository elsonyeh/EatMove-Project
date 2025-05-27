import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 獲取用戶近期瀏覽
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")

    if (!mid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID" 
      }, { status: 400 })
    }

    console.log("📚 獲取近期瀏覽，用戶ID:", mid)

    const result = await pool.query(`
      SELECT 
        rv.*,
        r.rname as current_restaurant_name,
        r.image as current_restaurant_image,
        r.rating as current_restaurant_rating
      FROM recent_views rv
      LEFT JOIN restaurant r ON rv.rid = r.rid
      WHERE rv.mid = $1
      ORDER BY rv.viewed_at DESC
      LIMIT 10
    `, [mid])

    const recentViews = result.rows.map(row => ({
      id: row.rid.toString(),
      name: row.current_restaurant_name || row.restaurant_name,
      description: row.restaurant_description || '',
      coverImage: row.current_restaurant_image || row.restaurant_image || '/images/restaurants/default.jpg',
      rating: parseFloat(row.current_restaurant_rating || row.restaurant_rating || 0),
      deliveryTime: row.delivery_time || '30-45 分鐘',
      deliveryFee: row.delivery_fee || 60,
      minimumOrder: row.minimum_order || 300,
      address: row.restaurant_address || '',
      phone: row.restaurant_phone || '',
      cuisine: row.cuisine || '綜合料理',
      isNew: false,
      distance: row.distance || '未知距離',
      viewedAt: row.viewed_at
    }))

    console.log("✅ 近期瀏覽數量:", recentViews.length)

    return NextResponse.json({
      success: true,
      recentViews: recentViews
    })

  } catch (err: any) {
    console.error("❌ 獲取近期瀏覽失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取近期瀏覽失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 添加餐廳到近期瀏覽
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      mid, 
      rid, 
      name, 
      description, 
      coverImage, 
      rating, 
      deliveryTime, 
      deliveryFee, 
      minimumOrder, 
      address, 
      phone, 
      cuisine, 
      distance 
    } = body

    if (!mid || !rid || !name) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要參數" 
      }, { status: 400 })
    }

    console.log("➕ 添加近期瀏覽:", { mid, rid, name })

    await pool.query(`
      INSERT INTO recent_views (
        mid, rid, restaurant_name, restaurant_description, restaurant_image,
        restaurant_rating, delivery_time, delivery_fee, minimum_order,
        restaurant_address, restaurant_phone, cuisine, distance, viewed_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      ON CONFLICT (mid, rid) 
      DO UPDATE SET 
        restaurant_name = EXCLUDED.restaurant_name,
        restaurant_description = EXCLUDED.restaurant_description,
        restaurant_image = EXCLUDED.restaurant_image,
        restaurant_rating = EXCLUDED.restaurant_rating,
        delivery_time = EXCLUDED.delivery_time,
        delivery_fee = EXCLUDED.delivery_fee,
        minimum_order = EXCLUDED.minimum_order,
        restaurant_address = EXCLUDED.restaurant_address,
        restaurant_phone = EXCLUDED.restaurant_phone,
        cuisine = EXCLUDED.cuisine,
        distance = EXCLUDED.distance,
        viewed_at = CURRENT_TIMESTAMP
    `, [
      mid, rid, name, description || '', coverImage || '',
      rating || 0, deliveryTime || '30-45 分鐘', deliveryFee || 60, minimumOrder || 300,
      address || '', phone || '', cuisine || '綜合料理', distance || '未知距離'
    ])

    console.log("✅ 近期瀏覽已更新")

    return NextResponse.json({
      success: true,
      message: "近期瀏覽已更新"
    })

  } catch (err: any) {
    console.error("❌ 添加近期瀏覽失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "添加近期瀏覽失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 清除用戶近期瀏覽
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")

    if (!mid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID" 
      }, { status: 400 })
    }

    console.log("🗑️ 清除近期瀏覽，用戶ID:", mid)

    const result = await pool.query(`
      DELETE FROM recent_views WHERE mid = $1
    `, [mid])

    console.log(`✅ 已清除 ${result.rowCount} 筆近期瀏覽記錄`)

    return NextResponse.json({
      success: true,
      message: `已清除 ${result.rowCount} 筆近期瀏覽記錄`
    })

  } catch (err: any) {
    console.error("❌ 清除近期瀏覽失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "清除近期瀏覽失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 