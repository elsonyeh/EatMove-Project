import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // 檢查所有表格
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    // 檢查購物車表格結構
    const cartTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cart' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    const cartItemsTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'cart_items' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    // 檢查購物車資料數量
    let cartCount = 0
    let cartItemsCount = 0
    
    try {
      const cartCountResult = await pool.query('SELECT COUNT(*) as count FROM cart')
      cartCount = parseInt(cartCountResult.rows[0].count)
      
      const cartItemsCountResult = await pool.query('SELECT COUNT(*) as count FROM cart_items')
      cartItemsCount = parseInt(cartItemsCountResult.rows[0].count)
    } catch (error) {
      console.log("購物車表格可能不存在")
    }

    return NextResponse.json({
      success: true,
      tables: tablesResult.rows.map(row => row.table_name),
      cartTable: {
        exists: cartTableResult.rows.length > 0,
        columns: cartTableResult.rows,
        recordCount: cartCount
      },
      cartItemsTable: {
        exists: cartItemsTableResult.rows.length > 0,
        columns: cartItemsTableResult.rows,
        recordCount: cartItemsCount
      }
    })

  } catch (error: any) {
    console.error("檢查表格失敗:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "檢查表格失敗", 
        error: error.message 
      },
      { status: 500 }
    )
  }
} 