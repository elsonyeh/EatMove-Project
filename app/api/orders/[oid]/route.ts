import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 更新訂單狀態
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid } = await params
    const body = await req.json()
    const { status, did, notes, actualDeliveryTime } = body

    if (!oid || !status) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少訂單ID或狀態" 
      }, { status: 400 })
    }

    // 驗證狀態值
    const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'delivering', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        success: false, 
        message: "無效的訂單狀態" 
      }, { status: 400 })
    }

    let updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `
    const queryParams: any[] = [status]
    let paramIndex = 2

    // 如果分配外送員
    if (did) {
      updateQuery += `, did = $${paramIndex}`
      queryParams.push(did)
      paramIndex++
    }

    // 如果有備註
    if (notes) {
      updateQuery += `, notes = $${paramIndex}`
      queryParams.push(notes)
      paramIndex++
    }

    // 如果是完成狀態，記錄實際送達時間
    if (status === 'completed' && actualDeliveryTime) {
      updateQuery += `, actual_delivery_time = $${paramIndex}`
      queryParams.push(actualDeliveryTime)
      paramIndex++
    }

    updateQuery += ` WHERE oid = $${paramIndex} RETURNING *`
    queryParams.push(oid)

    const result = await pool.query(updateQuery, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "訂單不存在" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "訂單狀態更新成功",
      order: result.rows[0]
    })

  } catch (err: any) {
    console.error("❌ 更新訂單狀態失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "更新訂單狀態失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 獲取單一訂單詳情
export async function GET(
  req: Request,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { oid } = await params

    if (!oid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少訂單ID" 
      }, { status: 400 })
    }

    // 獲取訂單基本資訊
    const orderResult = await pool.query(`
      SELECT 
        o.*,
        r.rname as restaurant_name,
        r.image as restaurant_image,
        r.rphonenumber as restaurant_phone,
        r.raddress as restaurant_address,
        m.name as member_name,
        m.phonenumber as member_phone,
        d.dname as delivery_name,
        d.dphonenumber as delivery_phone
      FROM orders o
      LEFT JOIN restaurant r ON o.rid = r.rid
      LEFT JOIN member m ON o.mid = m.mid
      LEFT JOIN deliveryman d ON o.did = d.did
      WHERE o.oid = $1
    `, [oid])

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "訂單不存在" 
      }, { status: 404 })
    }

    // 獲取訂單項目
    const itemsResult = await pool.query(`
      SELECT 
        oi.*,
        m.name as menu_name,
        m.image as menu_image,
        m.description as menu_description
      FROM order_items oi
      LEFT JOIN menu m ON oi.rid = m.rid AND oi.dishid = m.dishid
      WHERE oi.oid = $1
      ORDER BY oi.item_id
    `, [oid])

    const order = {
      ...orderResult.rows[0],
      items: itemsResult.rows
    }

    return NextResponse.json({
      success: true,
      order
    })

  } catch (err: any) {
    console.error("❌ 獲取訂單詳情失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取訂單詳情失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 