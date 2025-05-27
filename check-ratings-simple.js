const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE@nozomi.proxy.rlwy.net:25558/railway',
    ssl: { rejectUnauthorized: false }
});

async function checkDatabase() {
    try {
        console.log('🔍 檢查ratings表中的評分記錄...');

        // 檢查評分記錄
        const ratingsResult = await pool.query('SELECT * FROM ratings ORDER BY created_at DESC LIMIT 5');
        console.log('📊 評分記錄數量:', ratingsResult.rows.length);

        ratingsResult.rows.forEach((row, index) => {
            console.log(`評分記錄 ${index + 1}:`, {
                rating_id: row.rating_id,
                oid: row.oid,
                uid: row.mid,
                rid: row.rid,
                did: row.did,
                restaurant_rating: row.restaurant_rating,
                delivery_rating: row.delivery_rating,
                created_at: row.created_at
            });
        });

        console.log('\n🔍 檢查訂單#23的詳細信息...');

        // 檢查訂單23的狀態
        const orderResult = await pool.query('SELECT * FROM orders WHERE oid = 23');
        if (orderResult.rows.length > 0) {
            const order = orderResult.rows[0];
            console.log('📋 訂單#23狀態:', {
                oid: order.oid,
                status: order.status,
                did: order.did,
                restaurant_rating: order.restaurant_rating,
                delivery_rating: order.delivery_rating,
                updated_at: order.updated_at
            });
        } else {
            console.log('❌ 找不到訂單#23');
        }

        console.log('\n🔍 檢查所有訂單的狀態分布...');

        // 檢查訂單狀態分布
        const statusResult = await pool.query('SELECT status, COUNT(*) as count FROM orders GROUP BY status ORDER BY count DESC');
        console.log('📊 訂單狀態分布:');
        statusResult.rows.forEach(row => {
            console.log(`  ${row.status}: ${row.count} 個訂單`);
        });

    } catch (error) {
        console.error('❌ 查詢錯誤:', error.message);
    } finally {
        await pool.end();
    }
}

checkDatabase(); 