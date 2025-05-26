import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // 檢查現有餐廳資料
    const restaurantResult = await pool.query(`
      SELECT rid, name, address, phone, email, remail, rating, min_order, 
             image, business_hours, is_open, delivery_area, cuisine, description
      FROM restaurant 
      ORDER BY rid
    `);

    // 檢查menu資料
    const menuResult = await pool.query(`
      SELECT mid, rid, name, price, description, category
      FROM menu 
      ORDER BY rid, mid
    `);

    return NextResponse.json({
      success: true,
      restaurants: restaurantResult.rows,
      menus: menuResult.rows,
      restaurantCount: restaurantResult.rows.length,
      menuCount: menuResult.rows.length
    });
  } catch (error: any) {
    console.error("檢查資料失敗:", error);
    return NextResponse.json(
      { success: false, message: "檢查資料失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === "reorder_rid") {
      // 開始交易
      await pool.query('BEGIN');
      
      try {
        // 1. 創建臨時表來儲存新的rid對應關係
        await pool.query(`
          CREATE TEMP TABLE rid_mapping AS
          SELECT rid as old_rid, ROW_NUMBER() OVER (ORDER BY rid) as new_rid
          FROM restaurant
        `);
        
        // 2. 更新menu表的rid參考
        await pool.query(`
          UPDATE menu 
          SET rid = rm.new_rid
          FROM rid_mapping rm
          WHERE menu.rid = rm.old_rid
        `);
        
        // 3. 更新restaurant表的rid
        await pool.query(`
          UPDATE restaurant 
          SET rid = rm.new_rid
          FROM rid_mapping rm
          WHERE restaurant.rid = rm.old_rid
        `);
        
        // 4. 重置序列
        const maxRidResult = await pool.query('SELECT MAX(rid) as max_rid FROM restaurant');
        const maxRid = maxRidResult.rows[0].max_rid || 0;
        await pool.query(`ALTER SEQUENCE restaurant_rid_seq RESTART WITH ${maxRid + 1}`);
        
        // 提交交易
        await pool.query('COMMIT');
        
        // 檢查更新後的資料
        const updatedResult = await pool.query(`
          SELECT rid, name, address 
          FROM restaurant 
          ORDER BY rid
        `);
        
        return NextResponse.json({
          success: true,
          message: "餐廳rid重新排序成功",
          updatedRestaurants: updatedResult.rows
        });
        
      } catch (error) {
        // 回滾交易
        await pool.query('ROLLBACK');
        throw error;
      }
    }
    
    return NextResponse.json({
      success: false,
      message: "無效的操作"
    }, { status: 400 });
    
  } catch (error: any) {
    console.error("重新排序失敗:", error);
    return NextResponse.json(
      { success: false, message: "重新排序失敗", error: error.message },
      { status: 500 }
    );
  }
} 