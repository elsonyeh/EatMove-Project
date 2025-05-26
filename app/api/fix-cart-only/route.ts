import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    console.log('🔧 開始修復購物車表格...')

    // 先刪除現有的購物車表格（如果存在）
    await pool.query(`DROP TABLE IF EXISTS cart_items CASCADE;`)
    console.log('✅ 刪除舊的cart_items表格')
    
    await pool.query(`DROP TABLE IF EXISTS cart CASCADE;`)
    console.log('✅ 刪除舊的cart表格')

    // 重新創建購物車表格 - 使用mid作為member主鍵
    await pool.query(`
      CREATE TABLE cart (
        cart_id SERIAL PRIMARY KEY,
        mid INTEGER REFERENCES member(mid),
        rid INTEGER REFERENCES restaurant(rid),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mid, rid)
      );
    `)
    console.log('✅ 創建新的cart表格')

    await pool.query(`
      CREATE TABLE cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES cart(cart_id) ON DELETE CASCADE,
        mid INTEGER REFERENCES menu(mid),
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        special_instructions TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, mid)
      );
    `)
    console.log('✅ 創建新的cart_items表格')

    // 創建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_mid ON cart(mid);
      CREATE INDEX IF NOT EXISTS idx_cart_rid ON cart(rid);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_mid ON cart_items(mid);
    `)
    console.log('✅ 創建索引')

    return NextResponse.json({
      success: true,
      message: "購物車表格修復成功！現在使用mid作為member表格的主鍵"
    })

  } catch (error: any) {
    console.error("❌ 修復購物車表格失敗:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "修復購物車表格失敗", 
        error: error.message 
      },
      { status: 500 }
    )
  }
} 