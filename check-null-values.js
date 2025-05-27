const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'nozomi.proxy.rlwy.net',
    database: 'railway',
    password: 'YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE',
    port: 25558,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkNullValues() {
    try {
        console.log('🔍 檢查餐廳資料中的null值...');

        const result = await pool.query(`
      SELECT 
        rid,
        rname,
        description,
        business_hours,
        is_open,
        delivery_area,
        cuisine,
        min_order,
        rating
      FROM restaurant 
      WHERE rid = 6
    `);

        if (result.rows.length === 0) {
            console.log("❌ 餐廳不存在");
        } else {
            const restaurant = result.rows[0];
            console.log("✅ 餐廳資料檢查:");
            console.log("RID:", restaurant.rid);
            console.log("名稱:", restaurant.rname);
            console.log("描述:", restaurant.description === null ? "NULL" : restaurant.description);
            console.log("營業時間:", restaurant.business_hours === null ? "NULL" : restaurant.business_hours);
            console.log("是否營業:", restaurant.is_open === null ? "NULL" : restaurant.is_open);
            console.log("外送區域:", restaurant.delivery_area === null ? "NULL" : restaurant.delivery_area);
            console.log("料理類型:", restaurant.cuisine === null ? "NULL" : restaurant.cuisine);
            console.log("最低消費:", restaurant.min_order === null ? "NULL" : restaurant.min_order);
            console.log("評分:", restaurant.rating === null ? "NULL" : restaurant.rating);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

checkNullValues(); 