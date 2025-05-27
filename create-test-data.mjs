import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
    user: 'postgres',
    host: 'nozomi.proxy.rlwy.net',
    database: 'railway',
    password: 'YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE',
    port: 25558,
    ssl: {
        rejectUnauthorized: false
    }
})

async function createTestData() {
    try {
        console.log('🔧 開始創建測試數據...')

        // 1. 確保有用戶數據
        const userCheck = await pool.query('SELECT mid FROM member WHERE mid = $1', ['M000010'])
        if (userCheck.rows.length === 0) {
            await pool.query(`
        INSERT INTO member (mid, name, phonenumber, email, password, birthday, address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['M000010', '測試用戶', '0912345678', 'test@example.com', 'password123', '1990-01-01', '高雄市鹽埕區大仁路107號'])
            console.log('✅ 創建測試用戶')
        }

        // 2. 確保有外送員數據
        const deliverymanCheck = await pool.query('SELECT did FROM deliveryman WHERE did = $1', [1])
        if (deliverymanCheck.rows.length === 0) {
            await pool.query(`
        INSERT INTO deliveryman (did, dname, dphonenumber, demail, dpassword, status)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [1, '測試外送員', '0987654321', 'delivery@example.com', 'password123', 'online'])
            console.log('✅ 創建測試外送員')
        }

        // 3. 創建測試訂單
        const existingOrders = await pool.query('SELECT COUNT(*) FROM orders WHERE mid = $1', ['M000010'])
        const orderCount = parseInt(existingOrders.rows[0].count)

        if (orderCount < 3) {
            // 創建準備中的訂單（可接單）
            const order1 = await pool.query(`
        INSERT INTO orders (mid, rid, delivery_address, total_amount, delivery_fee, status, notes, estimated_delivery_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING oid
      `, ['M000010', 23, '高雄市鹽埕區大仁路107號', 525, 60, 'preparing', '不要辣', new Date(Date.now() + 30 * 60000)])

            const oid1 = order1.rows[0].oid

            // 添加訂單項目
            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid1, 23, 1748285964, 2, 75, 150])

            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid1, 23, 1748285989, 1, 40, 40])

            console.log(`✅ 創建準備中訂單 #${oid1}`)

            // 創建已完成的訂單
            const order2 = await pool.query(`
        INSERT INTO orders (mid, rid, delivery_address, total_amount, delivery_fee, status, notes, estimated_delivery_time, actual_delivery_time, did)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING oid
      `, ['M000010', 7, '高雄市鹽埕區大仁路107號', 615, 60, 'completed', '', new Date(Date.now() - 60 * 60000), new Date(Date.now() - 30 * 60000), 1])

            const oid2 = order2.rows[0].oid

            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid2, 7, 1748282986, 1, 175, 175])

            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid2, 7, 1748282901, 2, 200, 400])

            console.log(`✅ 創建已完成訂單 #${oid2}`)

            // 創建準備完成的訂單（可接單）
            const order3 = await pool.query(`
        INSERT INTO orders (mid, rid, delivery_address, total_amount, delivery_fee, status, notes, estimated_delivery_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING oid
      `, ['M000010', 23, '高雄市前金區中正四路211號', 335, 60, 'ready', '請提早送達', new Date(Date.now() + 25 * 60000)])

            const oid3 = order3.rows[0].oid

            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid3, 23, 1748286015, 1, 55, 55])

            await pool.query(`
        INSERT INTO order_items (oid, rid, dishid, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [oid3, 23, 1748286038, 1, 35, 35])

            console.log(`✅ 創建準備完成訂單 #${oid3}`)
        }

        console.log('🎉 測試數據創建完成！')

    } catch (error) {
        console.error('❌ 創建測試數據失敗:', error)
    } finally {
        await pool.end()
    }
}

createTestData() 