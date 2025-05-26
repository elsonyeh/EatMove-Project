import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: { oid: string } }
) {
  try {
    const { status } = await req.json()
    const orderId = params.oid

    if (!orderId || !status) {
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

    // 更新訂單狀態
    const updateResult = await pool.query(`
      UPDATE orders 
      SET 
        status = $1,
        updated_at = CURRENT_TIMESTAMP,
        accepted_at = CASE WHEN $1 = 'accepted' AND accepted_at IS NULL THEN CURRENT_TIMESTAMP ELSE accepted_at END,
        completed_at = CASE WHEN $1 = 'completed' AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END
      WHERE oid = $2
      RETURNING *
    `, [status, orderId])

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "找不到指定的訂單" 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "訂單狀態更新成功",
      data: updateResult.rows[0]
    })

  } catch (error) {
    console.error('更新訂單狀態錯誤:', error)
    return NextResponse.json({ 
      success: false, 
      message: "伺服器錯誤" 
    }, { status: 500 })
  }
} 