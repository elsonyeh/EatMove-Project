import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // 檢查member表格結構
    const memberTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'member' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    // 檢查restaurant表格結構
    const restaurantTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'restaurant' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    // 檢查deliveryman表格結構
    const deliverymanTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'deliveryman' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    // 檢查menu表格結構
    const menuTableResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `)

    return NextResponse.json({
      success: true,
      tables: {
        member: {
          exists: memberTableResult.rows.length > 0,
          columns: memberTableResult.rows
        },
        restaurant: {
          exists: restaurantTableResult.rows.length > 0,
          columns: restaurantTableResult.rows
        },
        deliveryman: {
          exists: deliverymanTableResult.rows.length > 0,
          columns: deliverymanTableResult.rows
        },
        menu: {
          exists: menuTableResult.rows.length > 0,
          columns: menuTableResult.rows
        }
      }
    })

  } catch (error: any) {
    console.error("檢查表格結構失敗:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "檢查表格結構失敗", 
        error: error.message 
      },
      { status: 500 }
    )
  }
} 