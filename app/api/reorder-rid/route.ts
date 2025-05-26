import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    console.log("開始重新排序餐廳rid...");
    
    // 開始交易
    await pool.query('BEGIN');
    
    try {
      // 1. 檢查現有的rid
      const currentRids = await pool.query(`
        SELECT rid, name FROM restaurant ORDER BY rid
      `);
      
      console.log("現有餐廳數量:", currentRids.rows.length);
      console.log("現有的rid:", currentRids.rows.map(r => r.rid));
      
      // 如果rid已經是連續的，就不需要重新排序
      const rids = currentRids.rows.map(r => r.rid);
      const isSequential = rids.every((rid, index) => rid === index + 1);
      
      if (isSequential) {
        await pool.query('ROLLBACK');
        return NextResponse.json({
          success: true,
          message: "餐廳rid已經是連續的，無需重新排序",
          currentRids: rids,
          restaurants: currentRids.rows
        });
      }
      
      // 2. 創建臨時表來處理重新排序
      await pool.query(`DROP TABLE IF EXISTS temp_restaurant_reorder`);
      await pool.query(`DROP TABLE IF EXISTS temp_menu_reorder`);
      
      await pool.query(`
        CREATE TEMP TABLE temp_restaurant_reorder AS 
        SELECT *, ROW_NUMBER() OVER (ORDER BY rid) as new_rid 
        FROM restaurant
      `);
      
      await pool.query(`
        CREATE TEMP TABLE temp_menu_reorder AS 
        SELECT m.*, tr.new_rid as new_rid 
        FROM menu m
        JOIN temp_restaurant_reorder tr ON m.rid = tr.rid
      `);
      
      // 3. 備份原始資料
      const originalRestaurants = await pool.query(`SELECT * FROM restaurant ORDER BY rid`);
      const originalMenus = await pool.query(`SELECT * FROM menu ORDER BY rid, mid`);
      
      // 4. 清空原表
      await pool.query('DELETE FROM menu');
      await pool.query('DELETE FROM restaurant');
      
      // 5. 重新插入資料
      await pool.query(`
        INSERT INTO restaurant (rid, name, description, address, phone, email, remail, rpassword, rating, min_order, image, business_hours, is_open, delivery_area, cuisine)
        SELECT new_rid, name, COALESCE(description, ''), address, phone, email, remail, rpassword, rating, min_order, image, business_hours, is_open, delivery_area, cuisine
        FROM temp_restaurant_reorder
        ORDER BY new_rid
      `);
      
      await pool.query(`
        INSERT INTO menu (mid, rid, name, price, description, category, image)
        SELECT ROW_NUMBER() OVER (ORDER BY new_rid, mid), new_rid, name, price, description, category, COALESCE(image, '/images/menu/default.jpg')
        FROM temp_menu_reorder
        ORDER BY new_rid, mid
      `);
      
      // 6. 重置序列
      const maxRid = currentRids.rows.length;
      await pool.query(`SELECT setval('restaurant_rid_seq', $1, true)`, [maxRid]);
      
      const maxMid = await pool.query('SELECT MAX(mid) as max_mid FROM menu');
      const maxMenuId = maxMid.rows[0].max_mid || 0;
      await pool.query(`SELECT setval('menu_mid_seq', $1, true)`, [maxMenuId]);
      
      // 提交交易
      await pool.query('COMMIT');
      
      // 7. 檢查更新後的資料
      const updatedRestaurants = await pool.query(`
        SELECT rid, name FROM restaurant ORDER BY rid
      `);
      
      const updatedMenus = await pool.query(`
        SELECT rid, COUNT(*) as menu_count 
        FROM menu 
        GROUP BY rid 
        ORDER BY rid
      `);
      
      console.log("重新排序完成!");
      console.log("新的rid:", updatedRestaurants.rows.map(r => r.rid));
      
      return NextResponse.json({
        success: true,
        message: `餐廳rid重新排序成功，已將 ${currentRids.rows.length} 家餐廳的rid重新排序為1-${currentRids.rows.length}`,
        oldRids: rids,
        newRids: updatedRestaurants.rows.map(r => r.rid),
        updatedRestaurants: updatedRestaurants.rows,
        menuCounts: updatedMenus.rows,
        totalRestaurants: updatedRestaurants.rows.length,
        totalMenuItems: updatedMenus.rows.reduce((sum, item) => sum + parseInt(item.menu_count), 0)
      });
      
    } catch (error) {
      // 回滾交易
      await pool.query('ROLLBACK');
      throw error;
    }
    
  } catch (error: any) {
    console.error("重新排序失敗:", error);
    return NextResponse.json(
      { success: false, message: "重新排序失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    // 檢查當前餐廳rid狀況
    const restaurants = await pool.query(`
      SELECT rid, name FROM restaurant ORDER BY rid
    `);
    
    const rids = restaurants.rows.map(r => r.rid);
    const isSequential = rids.every((rid, index) => rid === index + 1);
    
    return NextResponse.json({
      success: true,
      currentRids: rids,
      isSequential,
      totalRestaurants: restaurants.rows.length,
      restaurants: restaurants.rows,
      message: isSequential ? "餐廳rid已經是連續的" : "餐廳rid不是連續的，需要重新排序"
    });
  } catch (error: any) {
    console.error("檢查失敗:", error);
    return NextResponse.json(
      { success: false, message: "檢查失敗", error: error.message },
      { status: 500 }
    );
  }
} 