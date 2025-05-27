import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 更新訂單狀態
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { status } = body

    console.log("🔄 更新訂單狀態:", { orderId: id, newStatus: status })

    if (!id || !status) {
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

    // 檢查訂單是否存在
    const orderCheck = await pool.query(
      "SELECT oid, status, did FROM orders WHERE oid = $1",
      [id]
    )

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "訂單不存在" 
      }, { status: 404 })
    }

    const currentOrder = orderCheck.rows[0]
    console.log("📋 當前訂單狀態:", currentOrder)

    // 根據狀態更新邏輯
    let updateQuery = `
      UPDATE orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
    `
    let updateParams = [status, id]

    // 如果是完成狀態，記錄實際送達時間
    if (status === 'completed') {
      updateQuery += `, actual_delivery_time = CURRENT_TIMESTAMP`
    }

    updateQuery += ` WHERE oid = $2 RETURNING *`

    const result = await pool.query(updateQuery, updateParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "更新訂單狀態失敗" 
      }, { status: 500 })
    }

    const updatedOrder = result.rows[0]
    console.log("✅ 訂單狀態更新成功:", updatedOrder)

    return NextResponse.json({
      success: true,
      message: `訂單狀態已更新為 ${status}`,
      order: {
        oid: updatedOrder.oid,
        status: updatedOrder.status,
        actual_delivery_time: updatedOrder.actual_delivery_time,
        updated_at: updatedOrder.updated_at
      }
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