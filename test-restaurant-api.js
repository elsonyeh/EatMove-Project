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

async function testRestaurantAPI() {
    try {
        console.log('🔍 測試餐廳API...');

        // 測試獲取餐廳資料 (模擬API查詢)
        const rid = 6; // 使用長腳麵的ID
        console.log(`\n📊 查詢餐廳 RID: ${rid}`);

        const result = await pool.query(
            `SELECT 
        rid,
        rname as name,
        raddress as address,
        description,
        rphonenumber as phone,
        remail as email,
        rating,
        min_order,
        image,
        business_hours,
        is_open,
        delivery_area,
        cuisine
      FROM restaurant 
      WHERE rid = $1`,
            [rid]
        );

        if (result.rows.length === 0) {
            console.log("❌ 餐廳不存在");
        } else {
            const restaurant = result.rows[0];
            console.log("✅ 餐廳資料:");
            console.log("名稱:", restaurant.name);
            console.log("地址:", restaurant.address);
            console.log("描述:", restaurant.description);
            console.log("電話:", restaurant.phone);
            console.log("信箱:", restaurant.email);
            console.log("料理類型:", restaurant.cuisine);
            console.log("營業時間:", restaurant.business_hours);
            console.log("是否營業:", restaurant.is_open);
            console.log("外送區域:", restaurant.delivery_area);
            console.log("最低消費:", restaurant.min_order);
            console.log("評分:", restaurant.rating);
            console.log("圖片:", restaurant.image);
        }

        await pool.end();
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

testRestaurantAPI(); 