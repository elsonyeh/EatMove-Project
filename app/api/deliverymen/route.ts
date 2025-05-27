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

    if (!did || !oid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少外送員ID或訂單ID" 
      }, { status: 400 })
    }

    // 檢查訂單是否存在且狀態為preparing或ready
    const orderCheck = await pool.query(
      "SELECT oid, status FROM orders WHERE oid = $1 AND status IN ('preparing', 'ready') AND did IS NULL",
      [oid]
    )

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "訂單不存在、狀態不正確或已被其他外送員接單" 
      }, { status: 400 })
    }

    // 檢查外送員是否存在
    const deliverymanCheck = await pool.query(
      "SELECT did FROM deliveryman WHERE did = $1",
      [did]
    )

    if (deliverymanCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "外送員不存在" 
      }, { status: 400 })
    }

    // 更新訂單狀態為delivering並分配外送員
    const result = await pool.query(`
      UPDATE orders 
      SET did = $1, status = 'delivering', updated_at = CURRENT_TIMESTAMP
      WHERE oid = $2
      RETURNING *
    `, [did, oid])

    return NextResponse.json({
      success: true,
      message: "外送員接單成功",
      order: result.rows[0]
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