-- EatMove 資料庫清理 SQL
-- 生成時間: 2025/5/28
-- 警告: 執行前請先備份資料庫!

-- 步驟 1: 備份要刪除的表格 (可選，如果需要保留數據)
-- CREATE TABLE chat_backup AS SELECT * FROM chat;
-- CREATE TABLE favoriteentry_backup AS SELECT * FROM favoriteentry;
-- CREATE TABLE favoritelist_backup AS SELECT * FROM favoritelist;
-- CREATE TABLE payment_backup AS SELECT * FROM payment;

-- 步驟 2: 刪除空表格 (按安全順序)
-- 這些表格都是空的且沒有外鍵依賴，可以安全刪除

-- 刪除 favoriteentry 表格 (收藏項目表 - 未使用)
DROP TABLE IF EXISTS favoriteentry CASCADE;

-- 刪除 favoritelist 表格 (收藏清單表 - 未使用)
DROP TABLE IF EXISTS favoritelist CASCADE;

-- 刪除 chat 表格 (聊天表 - 使用模擬數據)
DROP TABLE IF EXISTS chat CASCADE;

-- 刪除 payment 表格 (付款表 - 使用模擬數據)
DROP TABLE IF EXISTS payment CASCADE;

-- 步驟 3: 清理相關的序列 (如果存在)
DROP SEQUENCE IF EXISTS chat_cid_seq CASCADE;
DROP SEQUENCE IF EXISTS favoriteentry_listid_seq CASCADE;
DROP SEQUENCE IF EXISTS favoritelist_listid_seq CASCADE;
DROP SEQUENCE IF EXISTS payment_pid_seq CASCADE;

-- 步驟 4: 驗證清理結果
-- 檢查剩餘的表格
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 檢查剩餘的序列
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
ORDER BY sequence_name; 