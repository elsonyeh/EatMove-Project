import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 更新購物車項目數量
export async function PUT(req: Request, { params }: { params: Promise<{ cart_item_id: string }> }) {
  try {
    const { cart_item_id: cartItemId } = await params
    const data = await req.json()
    const { quantity, specialInstructions } = data

    if (!cartItemId || quantity === undefined) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要參數" 
      }, { status: 400 })
    }

    console.log("🔄 更新購物車項目:", { cartItemId, quantity, specialInstructions })

    if (quantity <= 0) {
      // 如果數量為0或負數，刪除項目
      await pool.query(
        `DELETE FROM cart_items WHERE cart_item_id = $1`,
        [cartItemId]
      )
      console.log("🗑️ 刪除購物車項目")
    } else {
      // 更新數量和備註
      await pool.query(
        `UPDATE cart_items 
         SET quantity = $1, special_instructions = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE cart_item_id = $3`,
        [quantity, specialInstructions || "", cartItemId]
      )
      console.log("✅ 更新購物車項目成功")
    }

    return NextResponse.json({
      success: true,
      message: quantity <= 0 ? "項目已刪除" : "項目已更新"
    })

  } catch (err: any) {
    console.error("❌ 更新購物車項目失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "更新失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 刪除購物車項目
export async function DELETE(req: Request, { params }: { params: Promise<{ cart_item_id: string }> }) {
  try {
    const { cart_item_id: cartItemId } = await params

    if (!cartItemId) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少項目ID" 
      }, { status: 400 })
    }

    console.log("🗑️ 刪除購物車項目:", cartItemId)

    await pool.query(
      `DELETE FROM cart_items WHERE cart_item_id = $1`,
      [cartItemId]
    )

    console.log("✅ 購物車項目已刪除")

    return NextResponse.json({
      success: true,
      message: "項目已刪除"
    })

  } catch (err: any) {
    console.error("❌ 刪除購物車項目失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "刪除失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 