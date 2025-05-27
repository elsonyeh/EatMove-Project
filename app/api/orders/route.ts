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

    console.log("🔍 查詢訂單參數:", { uid, rid, did, status, available })

    let query = `
      SELECT 
        o.oid,
        o.mid,
        o.rid,
        o.did,
        o.delivery_address,
        o.total_amount,
        o.delivery_fee,
        o.status,
        o.notes,
        o.order_time as created_at,
        o.estimated_delivery_time,
        o.actual_delivery_time,
        o.payment_method,
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
      console.log("👤 查詢用戶訂單，用戶ID:", uid)
    }

    if (rid) {
      query += ` AND o.rid = $${paramIndex}`
      params.push(rid)
      paramIndex++
      console.log("🏪 查詢餐廳訂單，餐廳ID:", rid)
    }

    if (did) {
      query += ` AND o.did = $${paramIndex}`
      params.push(did)
      paramIndex++
      console.log("🚚 查詢外送員訂單，外送員ID:", did)
    }

    if (status) {
      // 如果同時有available=true，則忽略status參數，使用available邏輯
      if (available !== 'true') {
        query += ` AND o.status = $${paramIndex}`
        params.push(status)
        paramIndex++
        console.log("📊 查詢指定狀態訂單，狀態:", status)
      }
    }

    if (available === 'true') {
      query += ` AND o.status IN ('preparing', 'ready') AND o.did IS NULL`
      console.log("📋 查詢可接單的訂單 (preparing 或 ready 狀態，且未分配外送員)")
    }

    query += ` ORDER BY o.order_time DESC`

    const result = await pool.query(query, params)
    console.log("📊 查詢到訂單數量:", result.rows.length)

    // 為每個訂單獲取訂單項目
    const ordersWithItems = await Promise.all(
      result.rows.map(async (order) => {
        const itemsResult = await pool.query(`
          SELECT 
            oi.oid,
            oi.rid,
            oi.dishid,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            oi.special_instructions,
            m.name as menu_name,
            m.image as menu_image
          FROM order_items oi
          LEFT JOIN menu m ON oi.rid = m.rid AND oi.dishid = m.dishid
          WHERE oi.oid = $1
          ORDER BY oi.dishid
        `, [order.oid])

        return {
          oid: order.oid,
          mid: order.mid,
          rid: order.rid,
          did: order.did,
          restaurant_name: order.restaurant_name,
          restaurant_address: order.restaurant_address,
          restaurant_image: order.restaurant_image || '/images/restaurants/default.jpg',
          delivery_address: order.delivery_address,
          total_amount: parseFloat(order.total_amount),
          delivery_fee: parseFloat(order.delivery_fee),
          status: order.status,
          notes: order.notes || '',
          created_at: order.created_at,
          estimated_delivery_time: order.estimated_delivery_time,
          actual_delivery_time: order.actual_delivery_time,
          payment_method: order.payment_method,
          member_name: order.member_name,
          delivery_name: order.delivery_name,
          items: itemsResult.rows.map(item => ({
            mid: item.dishid, // 注意：這裡的mid實際上是menu item id (dishid)
            menu_name: item.menu_name,
            quantity: item.quantity,
            unit_price: parseFloat(item.unit_price),
            subtotal: parseFloat(item.subtotal),
            special_instructions: item.special_instructions || '',
            menu_image: item.menu_image || '/images/menu/default.jpg'
          }))
        }
      })
    )

    console.log("✅ 訂單查詢成功，返回數據數量:", ordersWithItems.length)

    return NextResponse.json({
      success: true,
      orders: ordersWithItems,
      total: ordersWithItems.length
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