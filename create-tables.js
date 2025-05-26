import { pool } from './lib/db.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createTables() {
    try {
        // 讀取 SQL 檔案
        const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf8');

        // 執行 SQL 語句
        await pool.query(sql);
        console.log('✅ 成功建立資料表');

        // 關閉資料庫連線
        await pool.end();
    } catch (error) {
        console.error('❌ 建立資料表時發生錯誤:', error);
        process.exit(1);
    }
}

createTables(); 