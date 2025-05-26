import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 獲取購物車內容
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")
    const rid = url.searchParams.get("rid")

    if (!mid || !rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID或餐廳ID" 
      }, { status: 400 })
    }

    // 獲取購物車
    const cartResult = await pool.query(`
      SELECT cart_id FROM cart 
      WHERE mid = $1 AND rid = $2
    `, [mid, rid])

    if (cartResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          total: 0,
          itemCount: 0
        }
      })
    }

    const cartId = cartResult.rows[0].cart_id

    // 獲取購物車項目
    const itemsResult = await pool.query(`
      SELECT 
        ci.*,
        m.name as menu_name,
        m.price as menu_price,
        m.image as menu_image,
        m.description as menu_description
      FROM cart_items ci
      LEFT JOIN menu m ON ci.rid = m.rid AND ci.dishid = m.dishid
      WHERE ci.cart_id = $1
      ORDER BY ci.added_at ASC
    `, [cartId])

    const items = itemsResult.rows.map(item => ({
      cart_item_id: item.cart_item_id,
      rid: item.rid,
      dishid: item.dishid,
      name: item.menu_name,
      price: parseFloat(item.menu_price),
      quantity: item.quantity,
      image: item.menu_image || '/images/menu/default.jpg',
      description: item.menu_description,
      specialInstructions: item.special_instructions,
      subtotal: parseFloat(item.menu_price) * item.quantity
    }))

    const total = items.reduce((sum, item) => sum + item.subtotal, 0)
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

    return NextResponse.json({
      success: true,
      cart: {
        cart_id: cartId,
        items,
        total,
        itemCount
      }
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
    const body = await req.json()
    const { mid, rid, dishid, quantity = 1, specialInstructions } = body

    if (!mid || !rid || !dishid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要參數" 
      }, { status: 400 })
    }

    // 開始交易
    await pool.query('BEGIN')

    try {
      // 獲取或創建購物車
      let cartResult = await pool.query(`
        SELECT cart_id FROM cart 
        WHERE mid = $1 AND rid = $2
      `, [mid, rid])

      let cartId
      if (cartResult.rows.length === 0) {
        // 創建新購物車
        const newCartResult = await pool.query(`
          INSERT INTO cart (mid, rid) 
          VALUES ($1, $2) 
          RETURNING cart_id
        `, [mid, rid])
        cartId = newCartResult.rows[0].cart_id
      } else {
        cartId = cartResult.rows[0].cart_id
      }

      // 檢查商品是否已在購物車中
      const existingItemResult = await pool.query(`
        SELECT cart_item_id, quantity 
        FROM cart_items 
        WHERE cart_id = $1 AND rid = $2 AND dishid = $3
      `, [cartId, rid, dishid])

      if (existingItemResult.rows.length > 0) {
        // 更新現有商品數量
        const newQuantity = existingItemResult.rows[0].quantity + quantity
        await pool.query(`
          UPDATE cart_items 
          SET quantity = $1, updated_at = CURRENT_TIMESTAMP
          WHERE cart_id = $2 AND rid = $3 AND dishid = $4
        `, [newQuantity, cartId, rid, dishid])
      } else {
        // 添加新商品
        await pool.query(`
          INSERT INTO cart_items (cart_id, rid, dishid, quantity, special_instructions)
          VALUES ($1, $2, $3, $4, $5)
        `, [cartId, rid, dishid, quantity, specialInstructions])
      }

      // 更新購物車時間
      await pool.query(`
        UPDATE cart 
        SET updated_at = CURRENT_TIMESTAMP 
        WHERE cart_id = $1
      `, [cartId])

      // 提交交易
      await pool.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: "商品已加入購物車"
      })

    } catch (error) {
      // 回滾交易
      await pool.query('ROLLBACK')
      throw error
    }

  } catch (err: any) {
    console.error("❌ 添加到購物車失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "添加到購物車失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 清空購物車
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url)
    const mid = url.searchParams.get("mid")
    const rid = url.searchParams.get("rid")

    if (!mid || !rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少用戶ID或餐廳ID" 
      }, { status: 400 })
    }

    // 刪除購物車（會自動刪除相關的購物車項目）
    await pool.query(`
      DELETE FROM cart 
      WHERE mid = $1 AND rid = $2
    `, [mid, rid])

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