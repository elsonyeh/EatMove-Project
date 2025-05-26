import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // 檢查member表結構
    const memberColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'member' 
      ORDER BY ordinal_position
    `);

    // 檢查deliveryman表結構
    const deliverymanColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'deliveryman' 
      ORDER BY ordinal_position
    `);

    // 檢查restaurant表結構
    const restaurantColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'restaurant' 
      ORDER BY ordinal_position
    `);

    // 檢查menu表結構
    const menuColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menu' 
      ORDER BY ordinal_position
    `);

    // 檢查現有餐廳資料
    const restaurantData = await pool.query(`
      SELECT rid, name, address, phone, email, remail
      FROM restaurant 
      ORDER BY rid
      LIMIT 5
    `);

    // 檢查menu與restaurant的關聯
    const menuRestaurantRelation = await pool.query(`
      SELECT r.rid, r.name as restaurant_name, COUNT(m.mid) as menu_count
      FROM restaurant r
      LEFT JOIN menu m ON r.rid = m.rid
      GROUP BY r.rid, r.name
      ORDER BY r.rid
      LIMIT 10
    `);

    // 用戶設定頁面需要的欄位
    const userSettingsFields = {
      member: ['mid', 'name', 'email', 'phonenumber', 'address', 'wallet', 'face_descriptor'],
      deliveryman: ['did', 'dname', 'demail', 'dphonenumber', 'face_descriptor']
    };

    // 餐廳設定頁面需要的欄位
    const restaurantSettingsFields = {
      restaurant: [
        'rid', 'name', 'description', 'address', 'phone', 'email', 'remail',
        'rating', 'min_order', 'image', 'business_hours', 'is_open', 
        'delivery_area', 'cuisine'
      ],
      menu: ['mid', 'rid', 'name', 'price', 'description', 'category']
    };

    return NextResponse.json({
      success: true,
      tableStructures: {
        member: memberColumns.rows,
        deliveryman: deliverymanColumns.rows,
        restaurant: restaurantColumns.rows,
        menu: menuColumns.rows
      },
      requiredFields: {
        userSettings: userSettingsFields,
        restaurantSettings: restaurantSettingsFields
      },
      sampleData: {
        restaurants: restaurantData.rows,
        menuRestaurantRelation: menuRestaurantRelation.rows
      }
    });
  } catch (error: any) {
    console.error("檢查資料庫欄位失敗:", error);
    return NextResponse.json(
      { success: false, message: "檢查資料庫欄位失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === "reorder_restaurant_rid") {
      // 開始交易
      await pool.query('BEGIN');
      
      try {
        // 1. 檢查現有的rid
        const currentRids = await pool.query(`
          SELECT rid FROM restaurant ORDER BY rid
        `);
        
        console.log("現有的rid:", currentRids.rows.map(r => r.rid));
        
        // 2. 創建新的rid映射（從1開始連續編號）
        const ridMapping = currentRids.rows.map((row, index) => ({
          oldRid: row.rid,
          newRid: index + 1
        }));
        
        // 3. 先更新menu表的外鍵參考
        for (const mapping of ridMapping) {
          if (mapping.oldRid !== mapping.newRid) {
            await pool.query(`
              UPDATE menu SET rid = $1 WHERE rid = $2
            `, [mapping.newRid + 1000, mapping.oldRid]); // 先用臨時值避免衝突
          }
        }
        
        // 4. 更新restaurant表的主鍵
        for (const mapping of ridMapping) {
          if (mapping.oldRid !== mapping.newRid) {
            await pool.query(`
              UPDATE restaurant SET rid = $1 WHERE rid = $2
            `, [mapping.newRid + 1000, mapping.oldRid]); // 先用臨時值避免衝突
          }
        }
        
        // 5. 將臨時值改為最終值
        for (const mapping of ridMapping) {
          if (mapping.oldRid !== mapping.newRid) {
            await pool.query(`
              UPDATE menu SET rid = $1 WHERE rid = $2
            `, [mapping.newRid, mapping.newRid + 1000]);
            
            await pool.query(`
              UPDATE restaurant SET rid = $1 WHERE rid = $2
            `, [mapping.newRid, mapping.newRid + 1000]);
          }
        }
        
        // 6. 重置序列
        const maxRid = ridMapping.length;
        await pool.query(`
          SELECT setval('restaurant_rid_seq', $1, true)
        `, [maxRid]);
        
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
          ridMapping: ridMapping,
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