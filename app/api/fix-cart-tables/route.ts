import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // 首先檢查member表格的主鍵欄位
    const memberPrimaryKeyResult = await pool.query(`
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'member' 
        AND table_schema = 'public'
        AND constraint_name LIKE '%pkey%';
    `)

    // 檢查restaurant表格的主鍵欄位
    const restaurantPrimaryKeyResult = await pool.query(`
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'restaurant' 
        AND table_schema = 'public'
        AND constraint_name LIKE '%pkey%';
    `)

    // 檢查menu表格的主鍵欄位
    const menuPrimaryKeyResult = await pool.query(`
      SELECT column_name
      FROM information_schema.key_column_usage
      WHERE table_name = 'menu' 
        AND table_schema = 'public'
        AND constraint_name LIKE '%pkey%';
    `)

    const memberPK = memberPrimaryKeyResult.rows[0]?.column_name || 'uid'
    const restaurantPK = restaurantPrimaryKeyResult.rows[0]?.column_name || 'rid'
    const menuPK = menuPrimaryKeyResult.rows[0]?.column_name || 'mid'

    console.log('檢測到的主鍵欄位:', { memberPK, restaurantPK, menuPK })

    // 刪除現有的購物車表格（如果存在）
    await pool.query(`DROP TABLE IF EXISTS cart_items CASCADE;`)
    await pool.query(`DROP TABLE IF EXISTS cart CASCADE;`)

    // 重新創建購物車表格，使用正確的主鍵欄位名稱
    await pool.query(`
      CREATE TABLE cart (
        cart_id SERIAL PRIMARY KEY,
        ${memberPK} INTEGER REFERENCES member(${memberPK}),
        ${restaurantPK} INTEGER REFERENCES restaurant(${restaurantPK}),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(${memberPK}, ${restaurantPK})
      );
    `)

    await pool.query(`
      CREATE TABLE cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES cart(cart_id) ON DELETE CASCADE,
        ${menuPK} INTEGER REFERENCES menu(${menuPK}),
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        special_instructions TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, ${menuPK})
      );
    `)

    // 創建索引
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_cart_${memberPK} ON cart(${memberPK});
      CREATE INDEX IF NOT EXISTS idx_cart_${restaurantPK} ON cart(${restaurantPK});
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_${menuPK} ON cart_items(${menuPK});
    `)

    return NextResponse.json({
      success: true,
      message: "購物車表格修復成功",
      primaryKeys: {
        member: memberPK,
        restaurant: restaurantPK,
        menu: menuPK
      }
    })

  } catch (error: any) {
    console.error("修復購物車表格失敗:", error)
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