import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 創建新訂單
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📝 收到訂單資料:", JSON.stringify(body, null, 2))
    
    const { 
      uid, 
      rid, 
      items, 
      deliveryAddress, 
      totalAmount, 
      deliveryFee, 
      notes, 
      paymentMethod = 'cash' 
    } = body

    console.log("🔍 驗證參數:", {
      uid: uid,
      rid: rid,
      items: items?.length,
      deliveryAddress: deliveryAddress,
      totalAmount: totalAmount
    })

    if (!uid || !rid || !items || !deliveryAddress || !totalAmount) {
      const missingFields = []
      if (!uid) missingFields.push('uid')
      if (!rid) missingFields.push('rid')
      if (!items) missingFields.push('items')
      if (!deliveryAddress) missingFields.push('deliveryAddress')
      if (!totalAmount) missingFields.push('totalAmount')
      
      console.log("❌ 缺少必要欄位:", missingFields)
      return NextResponse.json({ 
        success: false, 
        message: `缺少必要的訂單資訊: ${missingFields.join(', ')}` 
      }, { status: 400 })
    }

    // 開始交易
    await pool.query('BEGIN')

    try {
      // 計算預計送達時間（30-45分鐘後）
      const estimatedDeliveryTime = new Date()
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + 35)

      // 創建訂單
      const orderResult = await pool.query(`
        INSERT INTO orders (mid, rid, delivery_address, total_amount, delivery_fee, notes, payment_method, estimated_delivery_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING oid, order_time
      `, [uid, rid, deliveryAddress, totalAmount, deliveryFee, notes, paymentMethod, estimatedDeliveryTime])

      const oid = orderResult.rows[0].oid

      // 創建訂單項目
      for (const item of items) {
        await pool.query(`
          INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal, special_instructions)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [oid, rid, item.dishId, item.quantity, item.unitPrice, item.subtotal, item.specialInstructions || null])
      }

      // 提交交易
      await pool.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: "訂單創建成功",
        orderId: oid,
        orderTime: orderResult.rows[0].order_time,
        estimatedDeliveryTime
      })

    } catch (error) {
      // 回滾交易
      await pool.query('ROLLBACK')
      throw error
    }

  } catch (err: any) {
    console.error("❌ 創建訂單失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "創建訂單失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 獲取訂單列表
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const uid = url.searchParams.get("uid")
    const rid = url.searchParams.get("rid")
    const did = url.searchParams.get("did")
    const status = url.searchParams.get("status")
    const available = url.searchParams.get("available")

    let query = `
      SELECT 
        o.*,
        r.rname as restaurant_name,
        r.raddress as restaurant_address,
        r.image as restaurant_image,
        m.name as member_name,
        d.dname as delivery_name
      FROM orders o
      LEFT JOIN restaurant r ON o.rid = r.rid
      LEFT JOIN member m ON o.mid = m.mid
      LEFT JOIN deliveryman d ON o.did = d.did
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (uid) {
      query += ` AND o.mid = $${paramIndex}`
      params.push(uid)
      paramIndex++
    }

    if (rid) {
      query += ` AND o.rid = $${paramIndex}`
      params.push(rid)
      paramIndex++
    }

    if (did) {
      query += ` AND o.did = $${paramIndex}`
      params.push(did)
      paramIndex++
    }

    if (status) {
      query += ` AND o.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (available === 'true') {
      query += ` AND o.status IN ('preparing', 'ready') AND o.did IS NULL`
    }

    query += ` ORDER BY o.order_time DESC`

    const result = await pool.query(query, params)

    // 為每個訂單獲取訂單項目
    const ordersWithItems = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await pool.query(`
          SELECT 
            oi.*,
            m.name as menu_name,
            m.image as menu_image
          FROM order_items oi
          LEFT JOIN menu m ON oi.rid = m.rid AND oi.dishid = m.dishid
          WHERE oi.oid = $1
        `, [order.oid])

        return {
          ...order,
          items: itemsResult.rows
        }
      })
    )

    return NextResponse.json({
      success: true,
      orders: ordersWithItems
    })

  } catch (err: any) {
    console.error("❌ 獲取訂單失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取訂單失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 