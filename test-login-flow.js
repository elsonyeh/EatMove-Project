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

async function testLoginFlow() {
    try {
        console.log('🔍 測試餐廳登入流程...');

        // 模擬登入API查詢
        const email = "store6@store.com"; // 長腳麵的信箱
        console.log(`\n📧 測試登入信箱: ${email}`);

        const result = await pool.query(
            "SELECT rid as mid, rname as name, remail as email, rpassword as password, rphonenumber as phonenumber, raddress as address FROM restaurant WHERE remail = $1",
            [email]
        );

        if (result.rows.length === 0) {
            console.log("❌ 餐廳不存在");
        } else {
            const user = result.rows[0];
            console.log("✅ 登入API回傳資料:");
            console.log("mid (實際是rid):", user.mid);
            console.log("name:", user.name);
            console.log("email:", user.email);
            console.log("phonenumber:", user.phonenumber);
            console.log("address:", user.address);

            // 模擬前端設定的 restaurantAccount
            const restaurantData = {
                id: user.mid.toString(),
                username: user.email,
                restaurantId: user.mid,
                restaurantName: user.name,
                email: user.email,
                address: user.address,
                description: "暫無描述",
                phonenumber: user.phonenumber
            };

            console.log("\n📱 前端設定的 restaurantAccount:");
            console.log(JSON.stringify(restaurantData, null, 2));

            // 測試用這個 restaurantId 查詢餐廳資料
            console.log(`\n🔍 用 restaurantId: ${restaurantData.restaurantId} 查詢餐廳資料...`);

            const profileResult = await pool.query(
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
                [restaurantData.restaurantId]
            );

            if (profileResult.rows.length === 0) {
                console.log("❌ 用 restaurantId 查詢不到餐廳資料");
            } else {
                console.log("✅ 成功查詢到餐廳資料:");
                const restaurant = profileResult.rows[0];
                console.log("名稱:", restaurant.name);
                console.log("地址:", restaurant.address);
                console.log("描述:", restaurant.description);
                console.log("電話:", restaurant.phone);
                console.log("信箱:", restaurant.email);
            }
        }

        await pool.end();
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

testLoginFlow(); 