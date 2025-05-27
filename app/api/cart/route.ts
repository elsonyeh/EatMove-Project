import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 獲取用戶購物車
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")

    if (!mid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID" 
      }, { status: 400 })
    }

    console.log("🛒 獲取購物車，用戶ID:", mid)

    // 獲取用戶的購物車
    const cartResult = await pool.query(
      `SELECT cart_id FROM cart WHERE mid = $1 ORDER BY created_at DESC LIMIT 1`,
      [mid]
    )

    let cartId
    if (cartResult.rows.length === 0) {
      // 如果沒有購物車，創建一個新的
      const newCartResult = await pool.query(
        `INSERT INTO cart (mid, created_at, updated_at) 
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING cart_id`,
        [mid]
      )
      cartId = newCartResult.rows[0].cart_id
      console.log("🆕 創建新購物車，ID:", cartId)
    } else {
      cartId = cartResult.rows[0].cart_id
      console.log("📦 使用現有購物車，ID:", cartId)
    }

    // 獲取購物車項目
    const itemsResult = await pool.query(
      `SELECT 
        ci.cart_item_id,
        ci.cart_id,
        ci.rid,
        ci.dishid,
        ci.quantity,
        ci.special_instructions,
        ci.added_at,
        m.name as dishname,
        m.price,
        m.image,
        r.rname as restaurant_name
      FROM cart_items ci
      JOIN menu m ON ci.rid = m.rid AND ci.dishid = m.dishid
      JOIN restaurant r ON ci.rid = r.rid
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at DESC`,
      [cartId]
    )

    const cartItems = itemsResult.rows.map(row => ({
      cart_item_id: row.cart_item_id,
      cart_id: row.cart_id,
      rid: row.rid,
      dishId: row.dishid,
      dishName: row.dishname,
      price: parseFloat(row.price),
      quantity: row.quantity,
      specialInstructions: row.special_instructions || "",
      image: row.image,
      restaurantName: row.restaurant_name,
      addedAt: row.added_at
    }))

    console.log("✅ 購物車項目數量:", cartItems.length)

    return NextResponse.json({
      success: true,
      cartId: cartId,
      items: cartItems,
      totalItems: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      totalPrice: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    })

  } catch (err: any) {
    console.error("❌ 獲取購物車失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取購物車失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 添加商品到購物車
export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { mid, rid, dishId, quantity = 1, specialInstructions = "" } = data

    if (!mid || !rid || !dishId) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要參數" 
      }, { status: 400 })
    }

    console.log("➕ 添加商品到購物車:", { mid, rid, dishId, quantity })

    // 獲取或創建購物車
    let cartResult = await pool.query(
      `SELECT cart_id FROM cart WHERE mid = $1 ORDER BY created_at DESC LIMIT 1`,
      [mid]
    )

    let cartId
    if (cartResult.rows.length === 0) {
      // 創建新購物車
      const newCartResult = await pool.query(
        `INSERT INTO cart (mid, created_at, updated_at) 
         VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
         RETURNING cart_id`,
        [mid]
      )
      cartId = newCartResult.rows[0].cart_id
      console.log("🆕 創建新購物車，ID:", cartId)
    } else {
      cartId = cartResult.rows[0].cart_id
      console.log("📦 使用現有購物車，ID:", cartId)
    }

    // 檢查是否已存在相同商品
    const existingItemResult = await pool.query(
      `SELECT cart_item_id, quantity FROM cart_items 
       WHERE cart_id = $1 AND rid = $2 AND dishid = $3`,
      [cartId, rid, dishId]
    )

    if (existingItemResult.rows.length > 0) {
      // 更新數量
      const newQuantity = existingItemResult.rows[0].quantity + quantity
      await pool.query(
        `UPDATE cart_items 
         SET quantity = $1, special_instructions = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE cart_item_id = $3`,
        [newQuantity, specialInstructions, existingItemResult.rows[0].cart_item_id]
      )
      console.log("🔄 更新商品數量:", newQuantity)
    } else {
      // 添加新商品
      await pool.query(
        `INSERT INTO cart_items (cart_id, rid, dishid, quantity, special_instructions, added_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [cartId, rid, dishId, quantity, specialInstructions]
      )
      console.log("🆕 添加新商品到購物車")
    }

    return NextResponse.json({
      success: true,
      message: "商品已添加到購物車",
      cartId: cartId
    })

  } catch (err: any) {
    console.error("❌ 添加商品到購物車失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "添加商品失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 清空購物車
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")

    if (!mid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID" 
      }, { status: 400 })
    }

    console.log("🗑️ 清空購物車，用戶ID:", mid)

    // 獲取用戶的購物車
    const cartResult = await pool.query(
      `SELECT cart_id FROM cart WHERE mid = $1`,
      [mid]
    )

    if (cartResult.rows.length > 0) {
      const cartId = cartResult.rows[0].cart_id
      
      // 刪除購物車項目
      await pool.query(
        `DELETE FROM cart_items WHERE cart_id = $1`,
        [cartId]
      )
      
      // 刪除購物車
      await pool.query(
        `DELETE FROM cart WHERE cart_id = $1`,
        [cartId]
      )
      
      console.log("✅ 購物車已清空")
    }

    return NextResponse.json({
      success: true,
      message: "購物車已清空"
    })

  } catch (err: any) {
    console.error("❌ 清空購物車失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "清空購物車失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 