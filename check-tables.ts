import { pool } from '@/lib/db';

async function checkTables() {
    try {
        // 查詢所有資料表
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('📊 現有資料表:');
        result.rows.forEach((row) => {
            console.log(`- ${row.table_name}`);
        });

        // 檢查每個資料表的結構
        for (const row of result.rows) {
            const tableInfo = await pool.query(`
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position;
            `, [row.table_name]);

            console.log(`\n📋 ${row.table_name} 表格結構:`);
            tableInfo.rows.forEach((col) => {
                const type = col.character_maximum_length 
                    ? `${col.data_type}(${col.character_maximum_length})`
                    : col.data_type;
                console.log(`  - ${col.column_name}: ${type}`);
            });
        }

        await pool.end();
    } catch (error) {
        console.error('❌ 查詢資料表時發生錯誤:', error);
        process.exit(1);
    }
}

checkTables(); 