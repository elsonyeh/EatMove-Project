import { pool } from '@/lib/db';

async function fixTables() {
    try {
        // 刪除不需要的表格
        await pool.query(`
            DROP TABLE IF EXISTS restaurants, users;
        `);
        console.log('✅ 已刪除不需要的表格');

        // 清空現有資料
        await pool.query(`
            TRUNCATE TABLE member, deliveryman, restaurant CASCADE;
        `);
        console.log('✅ 已清空現有資料');

        // 修改 member 表格
        await pool.query(`
            ALTER TABLE member
            DROP COLUMN IF EXISTS introducer,
            ALTER COLUMN mid TYPE VARCHAR(7),
            ADD COLUMN IF NOT EXISTS password VARCHAR(100) NOT NULL DEFAULT 'default_password',
            ALTER COLUMN email SET NOT NULL,
            ADD CONSTRAINT member_email_unique UNIQUE (email);
        `);
        console.log('✅ 已修改 member 表格結構');

        // 修改 deliveryman 表格
        await pool.query(`
            ALTER TABLE deliveryman
            ADD COLUMN IF NOT EXISTS dpassword VARCHAR(100) NOT NULL DEFAULT 'default_password',
            ADD COLUMN IF NOT EXISTS demail VARCHAR(100) UNIQUE NOT NULL DEFAULT 'temp@email.com',
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'offline';
        `);
        console.log('✅ 已修改 deliveryman 表格結構');

        // 修改 restaurant 表格
        await pool.query(`
            ALTER TABLE restaurant
            ALTER COLUMN account SET NOT NULL,
            ALTER COLUMN remail SET NOT NULL,
            ADD CONSTRAINT restaurant_account_unique UNIQUE (account),
            ADD CONSTRAINT restaurant_email_unique UNIQUE (remail);
        `);
        console.log('✅ 已修改 restaurant 表格結構');

        await pool.end();
        console.log('✅ 所有修改完成');
    } catch (error) {
        console.error('❌ 修改資料表時發生錯誤:', error);
        console.error(error);
        process.exit(1);
    }
}

fixTables(); 