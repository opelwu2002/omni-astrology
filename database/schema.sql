-- Omni-Astrology 四合一全方位命理平台
-- 雲端資料庫 Schema 定義 (適用於 Supabase / PostgreSQL / Vercel Postgres)

-- 1. 啟用 UUID 擴充套件 (選用)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 會員使用者表 (users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'user', -- 'user' | 'admin'
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'suspended'
  unlocked_tiers JSONB DEFAULT '["free"]'::jsonb, -- ['free', 'level2', 'level3', 'synastry_addon']
  phone VARCHAR(50), -- 連絡電話
  company VARCHAR(255), -- 服務公司 / 學校
  tax_id VARCHAR(20), -- 統一編號 8 碼
  industry VARCHAR(100), -- 行業分類
  address TEXT, -- 憑證寄送通訊地址
  provider VARCHAR(50) DEFAULT 'credentials', -- 'credentials' | 'google' | 'github' | 'line'
  provider_id VARCHAR(255),
  created_at BIGINT NOT NULL,
  last_login_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_tax_id ON users (tax_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at DESC);

-- 3. 雲端命盤存檔表 (user_profiles)
CREATE TABLE IF NOT EXISTS user_profiles (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profiles JSONB DEFAULT '[]'::jsonb,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

-- 4. 交易訂單表 (orders)
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  user_id VARCHAR(100),
  user_email VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL,
  tier_name VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'credit_card' | 'line_pay' | 'jko_pay' | 'atm' | 'manual'
  status VARCHAR(30) NOT NULL, -- 'paid' | 'pending' | 'failed' | 'refunded'
  invoice JSONB, -- 紙本發票資料
  note TEXT,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON orders (user_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);

-- 5. 敏感操作稽核日誌 (audit_logs)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  admin_id VARCHAR(100),
  admin_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  target_id VARCHAR(100),
  target_type VARCHAR(50),
  details TEXT,
  ip VARCHAR(50),
  timestamp BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);

-- 6. 金流與系統設定表 (payment_config)
CREATE TABLE IF NOT EXISTS payment_config (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
  mode VARCHAR(20) DEFAULT 'sandbox', -- 'sandbox' | 'production'
  merchant_id VARCHAR(100) DEFAULT '3456197',
  hash_key VARCHAR(100) DEFAULT 'RttngL4823khpLRX',
  hash_iv VARCHAR(100) DEFAULT 'skQe3yMoSOuyMxRO',
  updated_at BIGINT NOT NULL
);

-- 7. 綠界 Webhook 金流回調紀錄 (webhook_logs)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id VARCHAR(100) PRIMARY KEY,
  merchant_trade_no VARCHAR(100),
  trade_no VARCHAR(100),
  rtn_code INTEGER,
  rtn_msg TEXT,
  trade_amt INTEGER,
  payment_date VARCHAR(50),
  raw_data JSONB,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs (created_at DESC);

-- 8. 預設系統設定資料初始化
INSERT INTO payment_config (id, mode, merchant_id, hash_key, hash_iv, updated_at)
VALUES ('default', 'sandbox', '3456197', 'RttngL4823khpLRX', 'skQe3yMoSOuyMxRO', EXTRACT(EPOCH FROM NOW())::BIGINT * 1000)
ON CONFLICT (id) DO NOTHING;
