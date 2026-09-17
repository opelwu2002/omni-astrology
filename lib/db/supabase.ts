/**
 * Supabase 雲端資料庫連接層 (Serverless PostgreSQL)
 * 支援 Vercel 與各雲端邊緣環境
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

let cachedClient: SupabaseClient | null = null;
let hasLoggedCriticalMissing = false;

/**
 * 檢查目前是否有配置 Supabase 雲端環境變數
 */
export function isSupabaseConfigured(): boolean {
  const configured = Boolean(
    supabaseUrl &&
      supabaseKey &&
      supabaseUrl.startsWith('http') &&
      !supabaseUrl.includes('your-supabase')
  );

  if (!configured && !hasLoggedCriticalMissing) {
    console.error('[CRITICAL] Supabase 環境變數未配置，資料將無法持久化！');
    hasLoggedCriticalMissing = true;
  }

  return configured;
}

/**
 * 取得後端特權 Supabase 用戶端 (Service Role / Admin)
 * 若未配置則回傳 null，並於控制台輸出報警
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}

