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

async function checkOrderExists() {
    try {
        console.log('🔍 檢查訂單是否存在...');

        // 檢查訂單ID 7
        const orderResult = await pool.query(`
      SELECT oid, mid, rid, status, order_time, total_amount
      FROM orders 
      WHERE oid = $1
    `, [7]);

        if (orderResult.rows.length === 0) {
            console.log('❌ 訂單ID 7 不存在');
        } else {
            const order = orderResult.rows[0];
            console.log('✅ 找到訂單:');
            console.log(`  OID: ${order.oid}`);
            console.log(`  MID: ${order.mid}`);
            console.log(`  RID: ${order.rid}`);
            console.log(`  狀態: ${order.status}`);
            console.log(`  訂單時間: ${order.order_time}`);
            console.log(`  總金額: ${order.total_amount}`);
        }

        // 檢查所有訂單
        const allOrdersResult = await pool.query(`
      SELECT oid, status, order_time
      FROM orders 
      ORDER BY oid DESC
      LIMIT 10
    `);

        console.log('\n📋 最近的10個訂單:');
        allOrdersResult.rows.forEach(order => {
            console.log(`  OID: ${order.oid}, 狀態: ${order.status}, 時間: ${order.order_time}`);
        });

        await pool.end();
    } catch (error) {
        console.error('❌ 錯誤:', error);
    }
}

checkOrderExists(); 