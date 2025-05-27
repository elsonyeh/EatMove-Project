import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ oid: string }> }
) {
  try {
    const { status } = await req.json()
    const { oid } = await params
    const orderId = oid

    console.log("🔄 更新訂單狀態:", { orderId, newStatus: status })

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

    // 檢查訂單是否存在
    const orderCheck = await pool.query(
      "SELECT oid, status, did FROM orders WHERE oid = $1",
      [orderId]
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
    let updateParams = [status, orderId]

    // 如果是完成狀態，記錄實際送達時間
    if (status === 'completed') {
      updateQuery += `, actual_delivery_time = CURRENT_TIMESTAMP`
    }

    updateQuery += ` WHERE oid = $2 RETURNING *`

    const updateResult = await pool.query(updateQuery, updateParams)

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "更新訂單狀態失敗" 
      }, { status: 500 })
    }

    const updatedOrder = updateResult.rows[0]
    console.log("✅ 訂單狀態更新成功:", updatedOrder)

    // 如果狀態變為ready，表示餐點已準備完成，可以通知外送員
    if (status === 'ready') {
      console.log(`📦 訂單 #${orderId} 已準備完成，可供外送員接單`)
      
      // 獲取可用的外送員列表（線上且訂單數量少於3的外送員）
      try {
        const availableDeliverymen = await pool.query(`
          SELECT 
            d.did,
            d.dname,
            d.demail,
            COUNT(o.oid) as active_orders
          FROM deliveryman d
          LEFT JOIN orders o ON d.did = o.did AND o.status IN ('delivering', 'ready')
          GROUP BY d.did, d.dname, d.demail
          HAVING COUNT(o.oid) < 3
          ORDER BY COUNT(o.oid) ASC, d.dname ASC
        `)

        console.log(`📱 通知 ${availableDeliverymen.rows.length} 位可用外送員有新訂單`)
        
      } catch (notifyError) {
        console.error('通知外送員失敗:', notifyError)
      }
    }

    // 如果狀態變為delivering，記錄外送開始時間
    if (status === 'delivering') {
      console.log(`🚚 訂單 #${orderId} 開始外送`)
    }

    // 如果狀態變為completed，記錄完成時間並可能觸發評分通知
    if (status === 'completed') {
      console.log(`✅ 訂單 #${orderId} 已完成送達`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `訂單狀態已更新為 ${status}`,
      order: {
        oid: updatedOrder.oid,
        status: updatedOrder.status,
        actual_delivery_time: updatedOrder.actual_delivery_time,
        updated_at: updatedOrder.updated_at
      },
      notified: status === 'ready' ? true : false
    })

  } catch (error: any) {
    console.error('❌ 更新訂單狀態錯誤:', error)
    return NextResponse.json({ 
      success: false, 
      message: "更新訂單狀態失敗", 
      error: error.message 
    }, { status: 500 })
  }
} 