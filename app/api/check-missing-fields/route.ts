import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // 檢查各表的欄位
    const memberColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'member'
    `);
    
    const deliverymanColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'deliveryman'
    `);
    
    const restaurantColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'restaurant'
    `);
    
    const menuColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'menu'
    `);

    // 定義需要的欄位
    const requiredFields = {
      member: ['mid', 'name', 'email', 'phonenumber', 'address', 'wallet', 'password', 'face_descriptor'],
      deliveryman: ['did', 'dname', 'demail', 'dphonenumber', 'dpassword', 'face_descriptor'],
      restaurant: ['rid', 'name', 'description', 'address', 'phone', 'email', 'remail', 'rpassword', 'rating', 'min_order', 'image', 'business_hours', 'is_open', 'delivery_area', 'cuisine'],
      menu: ['mid', 'rid', 'name', 'price', 'description', 'category', 'image']
    };

    // 檢查缺少的欄位
    const existingFields = {
      member: memberColumns.rows.map(r => r.column_name),
      deliveryman: deliverymanColumns.rows.map(r => r.column_name),
      restaurant: restaurantColumns.rows.map(r => r.column_name),
      menu: menuColumns.rows.map(r => r.column_name)
    };

    const missingFields = {
      member: requiredFields.member.filter(field => !existingFields.member.includes(field)),
      deliveryman: requiredFields.deliveryman.filter(field => !existingFields.deliveryman.includes(field)),
      restaurant: requiredFields.restaurant.filter(field => !existingFields.restaurant.includes(field)),
      menu: requiredFields.menu.filter(field => !existingFields.menu.includes(field))
    };

    // 檢查餐廳資料
    const restaurantData = await pool.query(`
      SELECT rid, name, address, phone, email, remail, rating, min_order, 
             image, business_hours, is_open, delivery_area, cuisine
      FROM restaurant 
      ORDER BY rid
    `);

    // 檢查菜單資料
    const menuData = await pool.query(`
      SELECT m.mid, m.rid, m.name, m.price, m.description, m.category, r.name as restaurant_name
      FROM menu m
      LEFT JOIN restaurant r ON m.rid = r.rid
      ORDER BY m.rid, m.mid
    `);

    return NextResponse.json({
      success: true,
      existingFields,
      requiredFields,
      missingFields,
      restaurantData: restaurantData.rows,
      menuData: menuData.rows,
      summary: {
        totalRestaurants: restaurantData.rows.length,
        totalMenuItems: menuData.rows.length,
        hasMissingFields: Object.values(missingFields).some(fields => fields.length > 0)
      }
    });
  } catch (error: any) {
    console.error("檢查欄位失敗:", error);
    return NextResponse.json(
      { success: false, message: "檢查欄位失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === "add_missing_fields") {
      // 添加缺少的欄位
      await pool.query(`
        DO $$ 
        BEGIN 
          -- 為menu表添加image欄位
          BEGIN
            ALTER TABLE menu ADD COLUMN image VARCHAR(255) DEFAULT '/images/menu/default.jpg';
          EXCEPTION 
            WHEN duplicate_column THEN 
              NULL;
          END;

          -- 確保restaurant表有description欄位
          BEGIN
            ALTER TABLE restaurant ADD COLUMN description TEXT DEFAULT '';
          EXCEPTION 
            WHEN duplicate_column THEN 
              NULL;
          END;
        END $$;
      `);

      return NextResponse.json({
        success: true,
        message: "已添加缺少的欄位"
      });
    }
    
    if (action === "reorder_restaurant_rid") {
      // 開始交易
      await pool.query('BEGIN');
      
      try {
        // 檢查現有的rid
        const currentRids = await pool.query(`
          SELECT rid FROM restaurant ORDER BY rid
        `);
        
        // 如果rid已經是連續的，就不需要重新排序
        const rids = currentRids.rows.map(r => r.rid);
        const isSequential = rids.every((rid, index) => rid === index + 1);
        
        if (isSequential) {
          await pool.query('ROLLBACK');
          return NextResponse.json({
            success: true,
            message: "餐廳rid已經是連續的，無需重新排序",
            currentRids: rids
          });
        }
        
        // 創建臨時表來處理重新排序
        await pool.query(`
          CREATE TEMP TABLE temp_restaurant AS 
          SELECT *, ROW_NUMBER() OVER (ORDER BY rid) as new_rid 
          FROM restaurant
        `);
        
        await pool.query(`
          CREATE TEMP TABLE temp_menu AS 
          SELECT m.*, tr.new_rid as new_rid 
          FROM menu m
          JOIN temp_restaurant tr ON m.rid = tr.rid
        `);
        
        // 清空原表
        await pool.query('DELETE FROM menu');
        await pool.query('DELETE FROM restaurant');
        
        // 重新插入資料
        await pool.query(`
          INSERT INTO restaurant (rid, name, description, address, phone, email, remail, rpassword, rating, min_order, image, business_hours, is_open, delivery_area, cuisine)
          SELECT new_rid, name, description, address, phone, email, remail, rpassword, rating, min_order, image, business_hours, is_open, delivery_area, cuisine
          FROM temp_restaurant
          ORDER BY new_rid
        `);
        
        await pool.query(`
          INSERT INTO menu (mid, rid, name, price, description, category, image)
          SELECT ROW_NUMBER() OVER (ORDER BY new_rid, mid), new_rid, name, price, description, category, COALESCE(image, '/images/menu/default.jpg')
          FROM temp_menu
          ORDER BY new_rid, mid
        `);
        
        // 重置序列
        const maxRid = rids.length;
        await pool.query(`SELECT setval('restaurant_rid_seq', $1, true)`, [maxRid]);
        
        const maxMid = await pool.query('SELECT MAX(mid) as max_mid FROM menu');
        const maxMenuId = maxMid.rows[0].max_mid || 0;
        await pool.query(`SELECT setval('menu_mid_seq', $1, true)`, [maxMenuId]);
        
        // 提交交易
        await pool.query('COMMIT');
        
        // 檢查更新後的資料
        const updatedRestaurants = await pool.query(`
          SELECT rid, name FROM restaurant ORDER BY rid
        `);
        
        const updatedMenus = await pool.query(`
          SELECT rid, COUNT(*) as menu_count 
          FROM menu 
          GROUP BY rid 
          ORDER BY rid
        `);
        
        return NextResponse.json({
          success: true,
          message: "餐廳rid重新排序成功",
          oldRids: rids,
          newRids: updatedRestaurants.rows.map(r => r.rid),
          updatedRestaurants: updatedRestaurants.rows,
          menuCounts: updatedMenus.rows
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
    console.error("操作失敗:", error);
    return NextResponse.json(
      { success: false, message: "操作失敗", error: error.message },
      { status: 500 }
    );
  }
} 