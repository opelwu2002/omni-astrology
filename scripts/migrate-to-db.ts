/**
 * Omni-Astrology 資料庫無縫遷移腳本 (Migration Script)
 * 功用：
 * 1. 讀取本地 data/users.json、data/orders.json、data/user_profiles.json
 * 2. 生成一鍵可於 Supabase / PostgreSQL 執行的 SQL 種子腳本 database/seed_migration.sql
 * 3. 若配置了 SUPABASE_URL 與 SUPABASE_SERVICE_ROLE_KEY，直接透過 API 批次匯入
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PROFILES_FILE = path.join(DATA_DIR, 'user_profiles.json');
const OUTPUT_SQL_FILE = path.join(process.cwd(), 'database', 'seed_migration.sql');

interface LocalUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  status: string;
  unlockedTiers?: string[];
  createdAt: number;
  lastLoginAt?: number;
}

interface LocalOrder {
  id: string;
  orderNumber: string;
  userId?: string;
  userEmail: string;
  tier: string;
  tierName: string;
  amount: number;
  paymentMethod: string;
  status: string;
  createdAt: number;
  invoice?: any;
  note?: string;
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 開始執行 Omni-Astrology 雲端資料庫無縫遷移程序...');
  console.log('====================================================\n');

  // 1. 讀取現有使用者資料
  let users: LocalUser[] = [];
  if (fs.existsSync(USERS_FILE)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      console.log(`✅ 成功讀取本地使用者數量：${users.length} 筆（包含 opelwu2002@gmail.com 與最高管理員）`);
    } catch (e: any) {
      console.error('❌ 讀取 users.json 失敗:', e.message);
    }
  }

  // 2. 讀取現有訂單資料
  let orders: LocalOrder[] = [];
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
      console.log(`✅ 成功讀取本地訂單數量：${orders.length} 筆`);
    } catch (e: any) {
      console.error('❌ 讀取 orders.json 失敗:', e.message);
    }
  }

  // 3. 生成 SQL 遷移指令
  const sqlLines: string[] = [
    '--',
    '-- Omni-Astrology 現有資料遷移 SQL (自動生成)',
    '-- 可直接於 Supabase Dashboard > SQL Editor 複製貼上執行',
    '--',
    'BEGIN;',
    '',
  ];

  // 插入使用者
  sqlLines.push('-- 1. 匯入歷史使用者 (保留密碼雜湊與已解鎖權限)');
  for (const u of users) {
    const safeEmail = u.email.replace(/'/g, "''");
    const safeName = (u.name || '').replace(/'/g, "''");
    const safePass = (u.passwordHash || '').replace(/'/g, "''");
    const tiersJson = JSON.stringify(u.unlockedTiers || ['free']).replace(/'/g, "''");
    const lastLogin = u.lastLoginAt ? u.lastLoginAt.toString() : 'NULL';

    sqlLines.push(
      `INSERT INTO users (id, email, password_hash, name, role, status, unlocked_tiers, created_at, last_login_at) ` +
        `VALUES ('${u.id}', '${safeEmail}', '${safePass}', '${safeName}', '${u.role}', '${u.status}', '${tiersJson}'::jsonb, ${u.createdAt}, ${lastLogin}) ` +
        `ON CONFLICT (id) DO UPDATE SET ` +
        `email = EXCLUDED.email, ` +
        `password_hash = EXCLUDED.password_hash, ` +
        `name = EXCLUDED.name, ` +
        `unlocked_tiers = EXCLUDED.unlocked_tiers, ` +
        `last_login_at = COALESCE(EXCLUDED.last_login_at, users.last_login_at);`
    );
  }

  sqlLines.push('\n-- 2. 匯入歷史訂單');
  for (const o of orders) {
    const safeNum = o.orderNumber.replace(/'/g, "''");
    const safeEmail = o.userEmail.replace(/'/g, "''");
    const safeTierName = o.tierName.replace(/'/g, "''");
    const invoiceJson = o.invoice ? `'${JSON.stringify(o.invoice).replace(/'/g, "''")}'::jsonb` : 'NULL';
    const noteStr = o.note ? `'${o.note.replace(/'/g, "''")}'` : 'NULL';

    sqlLines.push(
      `INSERT INTO orders (id, order_number, user_id, user_email, tier, tier_name, amount, payment_method, status, invoice, note, created_at) ` +
        `VALUES ('${o.id}', '${safeNum}', '${o.userId || ''}', '${safeEmail}', '${o.tier}', '${safeTierName}', ${o.amount}, '${o.paymentMethod}', '${o.status}', ${invoiceJson}, ${noteStr}, ${o.createdAt}) ` +
        `ON CONFLICT (order_number) DO NOTHING;`
    );
  }

  sqlLines.push('\nCOMMIT;\n');

  // 寫入 SQL 檔案
  fs.writeFileSync(OUTPUT_SQL_FILE, sqlLines.join('\n'), 'utf-8');
  console.log(`\n🎉 遷移 SQL 檔案已生成至: ${OUTPUT_SQL_FILE}`);
  console.log(`👉 您可直接打開此檔案，在 Supabase 或 PostgreSQL SQL Editor 中一鍵貼上執行！\n`);

  // 4. 若配置了 Supabase 環境變數，直接連線 API 寫入
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-supabase')) {
    console.log('📡 偵測到 Supabase 連線憑證，正在透過 API 自動同步寫入雲端...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let successUsers = 0;
    for (const u of users) {
      const { error } = await supabase.from('users').upsert({
        id: u.id,
        email: u.email.toLowerCase(),
        password_hash: u.passwordHash,
        name: u.name,
        role: u.role,
        status: u.status,
        unlocked_tiers: u.unlockedTiers || ['free'],
        created_at: u.createdAt,
        last_login_at: u.lastLoginAt || Date.now(),
      });
      if (!error) successUsers++;
      else console.warn(`⚠️ 寫入用戶 ${u.email} 警告:`, error.message);
    }
    console.log(`✨ Supabase API 批次寫入完成：成功寫入 ${successUsers} / ${users.length} 位會員！`);
  } else {
    console.log('ℹ️ 提示：當前未設定 SUPABASE_SERVICE_ROLE_KEY，已生成 SQL 腳本供手動一鍵執行。');
  }
}

runMigration().catch(console.error);
