import { Pool } from 'pg';

// 檢查是否為開發環境
const isDevelopment = process.env.NODE_ENV === 'development';

const dbConfig = {
  user: 'postgres',
  host: 'nozomi.proxy.rlwy.net',
  database: 'railway',
  password: 'YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE',
  port: 25558,
  ssl: {
    rejectUnauthorized: false
  }
};

export const pool = new Pool(dbConfig);

// 測試連線並輸出連線資訊
pool.on('connect', () => {
  console.log('✅ 資料庫連線成功');
  console.log('📊 資料庫連線資訊:', {
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
    user: dbConfig.user,
    ssl: '啟用'
  });
});

pool.on('error', (err) => {
  console.error('❌ 資料庫連線錯誤:', err);
});

// 導出單一連線實例
export default pool;
