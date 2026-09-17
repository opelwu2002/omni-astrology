-- Omni-Astrology 會員企業欄位擴充遷移 SQL
-- 適用於 Supabase / PostgreSQL
-- 請在 Supabase Dashboard > SQL Editor 中複製貼上並執行此腳本

BEGIN;

-- 擴充 users 資料表之企業與憑證寄送欄位
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- 建立輔助索引以加速手機與公司統編查詢
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_tax_id ON users (tax_id);

-- 通知 Supabase PostgREST 重新載入 Schema 快取
NOTIFY pgrst, 'reload schema';

COMMIT;
