import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 更新購物車項目
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ cart_item_id: string }> }
) {
  try {
    const { cart_item_id: cartItemId } = await params
    const body = await req.json()
    const { quantity, specialInstructions } = body

    if (!cartItemId) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少購物車項目ID" 
      }, { status: 400 })
    }

    if (quantity !== undefined && quantity <= 0) {
      return NextResponse.json({ 
        success: false, 
        message: "數量必須大於0" 
      }, { status: 400 })
    }

    let updateQuery = `UPDATE cart_items SET updated_at = CURRENT_TIMESTAMP`
    const queryParams: any[] = []
    let paramIndex = 1

    if (quantity !== undefined) {
      updateQuery += `, quantity = $${paramIndex}`
      queryParams.push(quantity)
      paramIndex++
    }

    if (specialInstructions !== undefined) {
      updateQuery += `, special_instructions = $${paramIndex}`
      queryParams.push(specialInstructions)
      paramIndex++
    }

    updateQuery += ` WHERE cart_item_id = $${paramIndex} RETURNING *`
    queryParams.push(cartItemId)

    const result = await pool.query(updateQuery, queryParams)

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "購物車項目不存在" 
      }, { status: 404 })
    }

    // 更新購物車的更新時間
    await pool.query(`
      UPDATE cart 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE cart_id = (
        SELECT cart_id FROM cart_items WHERE cart_item_id = $1
      )
    `, [cartItemId])

    return NextResponse.json({
      success: true,
      message: "購物車項目更新成功",
      item: result.rows[0]
    })

  } catch (err: any) {
    console.error("❌ 更新購物車項目失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "更新購物車項目失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 刪除購物車項目
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ cart_item_id: string }> }
) {
  try {
    const { cart_item_id: cartItemId } = await params

    if (!cartItemId) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少購物車項目ID" 
      }, { status: 400 })
    }

    // 獲取購物車ID（用於後續更新購物車時間）
    const cartResult = await pool.query(`
      SELECT cart_id FROM cart_items WHERE cart_item_id = $1
    `, [cartItemId])

    if (cartResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "購物車項目不存在" 
      }, { status: 404 })
    }

    const cartId = cartResult.rows[0].cart_id

    // 刪除購物車項目
    await pool.query(`
      DELETE FROM cart_items WHERE cart_item_id = $1
    `, [cartItemId])

    // 更新購物車的更新時間
    await pool.query(`
      UPDATE cart 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE cart_id = $1
    `, [cartId])

    // 檢查購物車是否為空，如果為空則刪除購物車
    const remainingItemsResult = await pool.query(`
      SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1
    `, [cartId])

    if (parseInt(remainingItemsResult.rows[0].count) === 0) {
      await pool.query(`
        DELETE FROM cart WHERE cart_id = $1
      `, [cartId])
    }

    return NextResponse.json({
      success: true,
      message: "購物車項目已刪除"
    })

  } catch (err: any) {
    console.error("❌ 刪除購物車項目失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "刪除購物車項目失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 