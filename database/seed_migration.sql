--
-- Omni-Astrology 現有資料遷移 SQL (自動生成)
-- 可直接於 Supabase Dashboard > SQL Editor 複製貼上執行
--
BEGIN;

-- 1. 匯入歷史使用者 (保留密碼雜湊與已解鎖權限)
INSERT INTO users (id, email, password_hash, name, role, status, unlocked_tiers, created_at, last_login_at) VALUES ('admin-master-001', 'admin@omni-astrology.com', '$2b$10$gI5VlqXhNdNALVp1.OSHI.aFNnz/waxl3/XkWhupz7n8WXsty1zGy', '系統最高管理員', 'admin', 'active', '["free"]'::jsonb, 1786868793061, 1789529341654) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, unlocked_tiers = EXCLUDED.unlocked_tiers, last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at);
INSERT INTO users (id, email, password_hash, name, role, status, unlocked_tiers, created_at, last_login_at) VALUES ('user-sample-002', 'vip@omni-astrology.com', '$2b$10$YnZpvphI6UcShjCcAVTRMugrMLAKXSlRxysu9S3z7qb1QHqY0h.K.', '陳雅婷 VIP', 'user', 'active', '["free"]'::jsonb, 1788855993061, 1789457193061) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, unlocked_tiers = EXCLUDED.unlocked_tiers, last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at);
INSERT INTO users (id, email, password_hash, name, role, status, unlocked_tiers, created_at, last_login_at) VALUES ('user-1789518932653-wba48', 'opelwu2002@gmail.com', '$2b$10$DfBfP/p6oDTS/fi2AVbgLOPNtxDWJIo9rogtPSFp32IpOIvw/DmXq', '吳俊彥', 'user', 'active', '["free","level2","level3"]'::jsonb, 1789518932653, 1789534958686) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, unlocked_tiers = EXCLUDED.unlocked_tiers, last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at);
INSERT INTO users (id, email, password_hash, name, role, status, unlocked_tiers, created_at, last_login_at) VALUES ('user-1789534817649-jdbso', 'google.user@vip-omni.com', '$2b$10$J7.3m3Mko6zHYCTXVzlaf.i8KmkpuqJ84rtJaCdBDF/6gRfXtrlKK', 'Google命主體驗用戶', 'user', 'active', '["free"]'::jsonb, 1789534817649, NULL) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name, unlocked_tiers = EXCLUDED.unlocked_tiers, last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at);

-- 2. 匯入歷史訂單
INSERT INTO orders (id, order_number, user_id, user_email, tier, tier_name, amount, payment_method, status, invoice, note, created_at) VALUES ('ord-1789519464183-Z9RW', 'ORD-20260916-Z9RW', 'user-1789518932653-wba48', 'opelwu2002@gmail.com', 'level3', '高階終身全盤與未來三年流年時間線', 699, 'line_pay', 'paid', NULL, NULL, 1789519464183) ON CONFLICT (order_number) DO NOTHING;
INSERT INTO orders (id, order_number, user_id, user_email, tier, tier_name, amount, payment_method, status, invoice, note, created_at) VALUES ('ord-1789519455190-WUXC', 'ORD-20260916-WUXC', 'user-1789518932653-wba48', 'opelwu2002@gmail.com', 'level2', '初階人生痛點解鎖報告（事業財富・情感健康）', 199, 'line_pay', 'paid', NULL, NULL, 1789519455190) ON CONFLICT (order_number) DO NOTHING;
INSERT INTO orders (id, order_number, user_id, user_email, tier, tier_name, amount, payment_method, status, invoice, note, created_at) VALUES ('ord-init-001', 'ORD-20260910-8831', 'user-sample-002', 'vip@omni-astrology.com', 'level3', '高階終身全盤與三年運勢曲線報告', 699, 'line_pay', 'paid', NULL, NULL, 1789087455189) ON CONFLICT (order_number) DO NOTHING;
INSERT INTO orders (id, order_number, user_id, user_email, tier, tier_name, amount, payment_method, status, invoice, note, created_at) VALUES ('ord-init-002', 'ORD-20260912-4521', 'user-sample-002', 'vip@omni-astrology.com', 'level2', '初階事業與情感財富深度解析', 199, 'credit_card', 'paid', NULL, NULL, 1789260255189) ON CONFLICT (order_number) DO NOTHING;

COMMIT;
