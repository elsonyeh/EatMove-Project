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
        updated_at = CURRENT_TIMESTAMP
      WHERE oid = $2
      RETURNING *
    `, [status, orderId])

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "找不到指定的訂單" 
      }, { status: 404 })
    }

    const updatedOrder = updateResult.rows[0]

    // 如果狀態變為ready，表示餐點已準備完成，可以通知外送員
    if (status === 'ready') {
      console.log(`📦 訂單 #${orderId} 已準備完成，可供外送員接單`)
      
      // 這裡可以添加推送通知邏輯
      // 例如：發送WebSocket通知給線上的外送員
      // 或者：發送推播通知
      
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
          WHERE d.status = 'online'
          GROUP BY d.did, d.dname, d.demail
          HAVING COUNT(o.oid) < 3
          ORDER BY COUNT(o.oid) ASC, d.dname ASC
        `)

        console.log(`📱 通知 ${availableDeliverymen.rows.length} 位可用外送員有新訂單`)
        
        // 這裡可以實作實際的通知邏輯
        // 例如：WebSocket、推播通知、簡訊等
        
      } catch (notifyError) {
        console.error('通知外送員失敗:', notifyError)
        // 不影響主要的狀態更新流程
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "訂單狀態更新成功",
      data: updatedOrder,
      notified: status === 'ready' ? true : false
    })

  } catch (error) {
    console.error('更新訂單狀態錯誤:', error)
    return NextResponse.json({ 
      success: false, 
      message: "伺服器錯誤" 
    }, { status: 500 })
  }
} 