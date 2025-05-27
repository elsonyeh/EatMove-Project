import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 獲取可用外送員列表
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const area = url.searchParams.get("area") || "高雄市"

    // 獲取目前沒有進行中訂單的外送員
    const result = await pool.query(`
      SELECT 
        d.did,
        d.dname,
        d.dphonenumber,
        d.demail,
        COUNT(o.oid) as active_orders
      FROM deliveryman d
      LEFT JOIN orders o ON d.did = o.did AND o.status IN ('delivering', 'ready')
      GROUP BY d.did, d.dname, d.dphonenumber, d.demail
      HAVING COUNT(o.oid) < 3
      ORDER BY COUNT(o.oid) ASC, d.dname ASC
    `)

    return NextResponse.json({
      success: true,
      deliverymen: result.rows
    })

  } catch (err: any) {
    console.error("❌ 獲取外送員失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取外送員失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 外送員接單
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { did, oid } = body

    console.log("🚚 外送員接單請求:", { did, oid })

    if (!did || !oid) {
      console.log("❌ 參數缺失:", { did, oid })
      return NextResponse.json({ 
        success: false, 
        message: "缺少外送員ID或訂單ID" 
      }, { status: 400 })
    }

    // 檢查訂單是否存在且狀態為preparing或ready
    const orderCheck = await pool.query(
      "SELECT oid, status, did, rid FROM orders WHERE oid = $1",
      [oid]
    )

    console.log("📋 訂單檢查結果:", orderCheck.rows)

    if (orderCheck.rows.length === 0) {
      console.log("❌ 訂單不存在:", oid)
      return NextResponse.json({ 
        success: false, 
        message: "訂單不存在" 
      }, { status: 400 })
    }

    const order = orderCheck.rows[0]
    
    if (!['preparing', 'ready'].includes(order.status)) {
      console.log("❌ 訂單狀態不符合接單條件:", order.status)
      return NextResponse.json({ 
        success: false, 
        message: `訂單狀態為 ${order.status}，無法接單` 
      }, { status: 400 })
    }

    if (order.did) {
      console.log("❌ 訂單已被其他外送員接單:", order.did)
      return NextResponse.json({ 
        success: false, 
        message: "此訂單已被其他外送員接單" 
      }, { status: 400 })
    }

    // 檢查外送員是否存在
    const deliverymanCheck = await pool.query(
      "SELECT did, dname FROM deliveryman WHERE did = $1",
      [did]
    )

    console.log("👤 外送員檢查結果:", deliverymanCheck.rows)

    if (deliverymanCheck.rows.length === 0) {
      console.log("❌ 外送員不存在:", did)
      return NextResponse.json({ 
        success: false, 
        message: "外送員不存在" 
      }, { status: 400 })
    }

    // 更新訂單狀態為delivering並分配外送員
    const result = await pool.query(`
      UPDATE orders 
      SET did = $1, status = 'delivering'
      WHERE oid = $2 AND did IS NULL
      RETURNING oid, rid, did, status, delivery_address, total_amount
    `, [did, oid])

    console.log("✅ 訂單更新結果:", result.rows)

    if (result.rows.length === 0) {
      console.log("❌ 訂單更新失敗，可能已被其他外送員接單")
      return NextResponse.json({ 
        success: false, 
        message: "接單失敗，訂單可能已被其他外送員接單" 
      }, { status: 400 })
    }

    const deliverymanName = deliverymanCheck.rows[0].dname

    console.log(`✅ 外送員 ${deliverymanName} (ID:${did}) 成功接單 #${oid}`)

    return NextResponse.json({
      success: true,
      message: "外送員接單成功",
      order: result.rows[0],
      deliveryman: {
        did: did,
        name: deliverymanName
      }
    })

  } catch (err: any) {
    console.error("❌ 外送員接單失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "外送員接單失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 