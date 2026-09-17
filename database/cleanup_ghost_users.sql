-- Omni-Astrology 清除歷史幽靈測試資料 SQL
-- 適用於 Supabase / PostgreSQL
-- 請在 Supabase Dashboard > SQL Editor 中複製貼上並執行此腳本，徹底自雲端資料庫抹除黃光隆測試資料

BEGIN;

-- 徹底刪除包含黃光隆、大隆精密工業等測試紀錄
DELETE FROM users 
WHERE email ILIKE '%huang.kl%' 
   OR email ILIKE '%omni-enterprise.tw%' 
   OR name LIKE '%黃光隆%' 
   OR company LIKE '%大隆精密%';

COMMIT;
