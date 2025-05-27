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

async function checkRestaurantData() {
    try {
        console.log('🔍 檢查餐廳資料...');
        const result = await pool.query('SELECT rid, rname, raddress, description, rphonenumber, remail, cuisine FROM restaurant LIMIT 5');
        console.log('📊 餐廳資料:');
        result.rows.forEach(row => {
            console.log(`RID: ${row.rid}, 名稱: ${row.rname}, 地址: ${row.raddress}, 描述: ${row.description}, 電話: ${row.rphonenumber}, 信箱: ${row.remail}, 料理類型: ${row.cuisine}`);
        });

        // 檢查欄位是否存在
        console.log('\n🔍 檢查資料表結構...');
        const columns = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'restaurant' ORDER BY ordinal_position");
        console.log('📋 restaurant表的欄位:', columns.rows.map(row => row.column_name).join(', '));

        await pool.end();
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

checkRestaurantData(); 