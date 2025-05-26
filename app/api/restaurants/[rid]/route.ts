import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { calculateRestaurantDistance } from "@/lib/distance"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ rid: string }> }
) {
  try {
    const { rid } = await params
    const url = new URL(req.url)
    const userLat = parseFloat(url.searchParams.get("lat") || "0")
    const userLng = parseFloat(url.searchParams.get("lng") || "0")
    const userAddress = url.searchParams.get("address") || "高雄市"

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    // 獲取餐廳詳細資訊
    const restaurantResult = await pool.query(
      `SELECT 
        r.rid,
        r.rname as name,
        r.raddress as address,
        r.description,
        r.rphonenumber as phone,
        r.remail as email,
        r.rating,
        r.min_order,
        r.image,
        r.cuisine
      FROM restaurant r
      WHERE r.rid = $1`,
      [rid]
    )

    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "餐廳不存在" 
      }, { status: 404 })
    }

    const restaurant = restaurantResult.rows[0]

    // 計算距離和送達時間
    const distanceInfo = calculateRestaurantDistance(
      userAddress,
      restaurant.address || "高雄市",
      userLat || undefined,
      userLng || undefined
    )

    // 格式化餐廳資料
    const formattedRestaurant = {
      id: restaurant.rid,
      name: restaurant.name,
      address: restaurant.address,
      description: restaurant.description,
      phone: restaurant.phone,
      email: restaurant.email,
      rating: parseFloat(restaurant.rating) || 4.5,
      minimumOrder: restaurant.min_order || 300,
      image: restaurant.image || '/images/restaurants/default.jpg',
      cuisine: restaurant.cuisine || '綜合料理',
      distance: distanceInfo.distanceText,
      deliveryTime: distanceInfo.deliveryTime,
      deliveryFee: distanceInfo.deliveryFee
    }

    return NextResponse.json({
      success: true,
      restaurant: formattedRestaurant
    })

  } catch (err: any) {
    console.error("❌ 獲取餐廳詳細資料失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "資料庫讀取失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 