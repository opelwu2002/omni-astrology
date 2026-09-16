/**
 * Omni-Astrology 全端認證與會員資料安全存取層 (lib/auth-users.ts)
 * 功用：
 * 1. 啟動時安全唯讀載入 data/users.json 作為基礎種子資料 (Seed Users)
 * 2. 封殺所有本機寫入，徹底杜絕 Vercel Serverless EROFS 唯讀檔案系統錯誤
 * 3. 完美相容舊會員（包含 opelwu2002@gmail.com 之 bcrypt 密碼與已解鎖權限）
 * 4. 硬性保證最高管理員 (admin / Opel6439) 絕對通行
 * 5. 雲端資料庫優先適配（配置 Supabase 則雙向同步）
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { getSupabaseAdmin } from './db/supabase';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  unlockedTiers: string[];
  createdAt: number;
  lastLoginAt?: number;
  provider?: string;
  providerId?: string;
}

export type SafeAuthUser = Omit<AuthUser, 'passwordHash'>;

// 系統預設最高管理者身分
const MASTER_ADMIN_USER: AuthUser = {
  id: 'admin-master-001',
  email: 'admin@omni-astrology.com',
  passwordHash: bcrypt.hashSync('Opel6439', 10),
  name: '系統最高管理員',
  role: 'admin',
  status: 'active',
  unlockedTiers: ['free', 'level2', 'level3', 'synastry_addon'],
  createdAt: 1786868793061,
  lastLoginAt: Date.now(),
};

// 記憶體會員資料庫（在 Serverless 生命週期內持續存在，絕不拋出 EROFS）
let inMemoryUsers: Map<string, AuthUser> = new Map();
let isInitialized = false;

/**
 * 載入基礎種子資料 (唯讀模式，絕不寫入磁碟)
 */
function initializeUsers(): void {
  if (isInitialized) return;

  // 1. 加入預設最高管理者
  inMemoryUsers.set(MASTER_ADMIN_USER.email.toLowerCase(), { ...MASTER_ADMIN_USER });

  // 2. 唯讀嘗試讀取本地 data/users.json
  try {
    const usersFilePath = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(usersFilePath)) {
      const fileData = fs.readFileSync(usersFilePath, 'utf-8');
      const jsonUsers: any[] = JSON.parse(fileData);

      for (const u of jsonUsers) {
        if (!u.email) continue;
        const cleanEmail = u.email.trim().toLowerCase();
        inMemoryUsers.set(cleanEmail, {
          id: u.id || `user-${Date.now()}`,
          email: cleanEmail,
          passwordHash: u.passwordHash || '',
          name: u.name || cleanEmail.split('@')[0],
          role: u.role === 'admin' ? 'admin' : 'user',
          status: u.status === 'suspended' ? 'suspended' : 'active',
          unlockedTiers: Array.isArray(u.unlockedTiers)
            ? u.unlockedTiers
            : u.role === 'admin'
            ? ['free', 'level2', 'level3', 'synastry_addon']
            : ['free'],
          createdAt: Number(u.createdAt) || Date.now(),
          lastLoginAt: u.lastLoginAt ? Number(u.lastLoginAt) : undefined,
        });
      }
    }
  } catch (err: any) {
    console.warn('[auth-users] 讀取種子資料庫通知 (使用記憶體預設):', err?.message);
  }

  isInitialized = true;
}

/**
 * 轉換為安全的使用者物件（去除密碼雜湊）
 */
export function toSafeAuthUser(user: AuthUser): SafeAuthUser {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

/**
 * 依 Email 尋找使用者（支援同步快取與非同步雲端查找）
 */
export function findAuthUserByEmailSync(email: string): AuthUser | undefined {
  initializeUsers();
  const clean = email.trim().toLowerCase();

  // 管理者帳號別名比對
  if (clean === 'admin' || clean === 'admin@omni-astrology.com') {
    return inMemoryUsers.get('admin@omni-astrology.com');
  }

  return inMemoryUsers.get(clean);
}

/**
 * 依 Email 非同步查詢（優先查詢 Supabase 雲端資料庫，離線時無縫降級至記憶體）
 */
export async function findAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
  initializeUsers();
  const clean = email.trim().toLowerCase();

  // 1. 最高管理者優先硬編碼放行
  if (clean === 'admin' || clean === 'admin@omni-astrology.com') {
    return inMemoryUsers.get('admin@omni-astrology.com');
  }

  // 2. 嘗試自雲端 Supabase 查詢最新狀態
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', clean)
        .maybeSingle();

      if (!error && data) {
        const cloudUser: AuthUser = {
          id: data.id,
          email: data.email.toLowerCase(),
          passwordHash: data.password_hash || '',
          name: data.name || clean.split('@')[0],
          role: data.role === 'admin' ? 'admin' : 'user',
          status: data.status === 'suspended' ? 'suspended' : 'active',
          unlockedTiers: Array.isArray(data.unlocked_tiers)
            ? data.unlocked_tiers
            : ['free'],
          createdAt: Number(data.created_at) || Date.now(),
          lastLoginAt: data.last_login_at ? Number(data.last_login_at) : undefined,
          provider: data.provider || 'credentials',
          providerId: data.provider_id || undefined,
        };

        // 快取至記憶體
        inMemoryUsers.set(clean, cloudUser);
        return cloudUser;
      }
    } catch (err: any) {
      console.warn('[auth-users] Supabase 查詢用戶異常，降級至記憶體:', err?.message);
    }
  }

  // 3. 降級自記憶體快取尋找（保證 opelwu2002@gmail.com 舊帳號可用）
  return inMemoryUsers.get(clean);
}

/**
 * 依 ID 尋找使用者
 */
export function findAuthUserById(id: string): AuthUser | undefined {
  initializeUsers();
  for (const user of inMemoryUsers.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

/**
 * 驗證帳號與密碼 (支援 bcrypt 密碼比對、舊帳號無縫登入、管理員放行)
 * 絕不執行磁碟寫入，更新 lastLoginAt 僅在記憶體或雲端 DB 中執行
 */
export async function verifyUserCredentials(
  accountOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: SafeAuthUser; error?: string }> {
  initializeUsers();
  const inputUser = (accountOrEmail || '').trim();
  const inputPass = (password || '').trim();

  if (!inputUser || !inputPass) {
    return { success: false, error: '請輸入帳號/電子郵件與密碼' };
  }

  // 1. 【最高管理者硬性優先判定】
  if (
    (inputUser.toLowerCase() === 'admin' ||
      inputUser.toLowerCase() === 'admin@omni-astrology.com') &&
    inputPass === 'Opel6439'
  ) {
    const admin = inMemoryUsers.get('admin@omni-astrology.com') || MASTER_ADMIN_USER;
    admin.lastLoginAt = Date.now();
    return { success: true, user: toSafeAuthUser(admin) };
  }

  // 2. 尋找會員
  const user = await findAuthUserByEmail(inputUser);
  if (!user) {
    return { success: false, error: '帳號或密碼錯誤' };
  }

  // 3. 停權檢查
  if (user.status === 'suspended') {
    return { success: false, error: '此帳號已被停權，請聯繫客服' };
  }

  // 4. 比對密碼雜湊
  if (!user.passwordHash) {
    return { success: false, error: '此帳號為第三方授權建立，請使用快捷登入方式' };
  }

  let isMatch = false;
  try {
    isMatch = bcrypt.compareSync(inputPass, user.passwordHash);
  } catch {
    isMatch = false;
  }

  if (!isMatch) {
    return { success: false, error: '帳號或密碼錯誤' };
  }

  // 5. 更新最後登入時間（記憶體更新 + 雲端同步，安全跳過本地磁碟）
  user.lastLoginAt = Date.now();
  inMemoryUsers.set(user.email.toLowerCase(), user);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: user.lastLoginAt })
        .eq('id', user.id);
    } catch {
      // 雲端同步失敗不中斷登入
    }
  }

  return { success: true, user: toSafeAuthUser(user) };
}

/**
 * 處理第三方 OAuth (Google / LINE / GitHub) 使用者建立或狀態同步
 */
export async function upsertOAuthAuthUser(params: {
  email: string;
  name?: string;
  provider: 'google' | 'line' | 'github';
  providerId?: string;
}): Promise<SafeAuthUser> {
  initializeUsers();
  const cleanEmail = params.email.trim().toLowerCase();
  let user = await findAuthUserByEmail(cleanEmail);

  if (user) {
    // 使用者已存在：更新最後登入時間與名稱
    user.lastLoginAt = Date.now();
    if (params.name) user.name = params.name;
    user.provider = params.provider;
    if (params.providerId) user.providerId = params.providerId;

    inMemoryUsers.set(cleanEmail, user);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({
            last_login_at: user.lastLoginAt,
            name: user.name,
            provider: user.provider,
            provider_id: user.providerId || null,
          })
          .eq('id', user.id);
      } catch (err: any) {
        console.warn('[auth-users] Supabase OAuth 更新失敗:', err?.message);
      }
    }

    return toSafeAuthUser(user);
  }

  // 建立全新第三方會員
  const newUserId = `user-oauth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser: AuthUser = {
    id: newUserId,
    email: cleanEmail,
    passwordHash: '',
    name: params.name || cleanEmail.split('@')[0],
    role: 'user',
    status: 'active',
    unlockedTiers: ['free'],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    provider: params.provider,
    providerId: params.providerId,
  };

  inMemoryUsers.set(cleanEmail, newUser);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        unlocked_tiers: newUser.unlockedTiers,
        provider: newUser.provider,
        provider_id: newUser.providerId || null,
        created_at: newUser.createdAt,
        last_login_at: newUser.lastLoginAt,
      });
    } catch (err: any) {
      console.warn('[auth-users] Supabase OAuth 新增失敗:', err?.message);
    }
  }

  return toSafeAuthUser(newUser);
}

/**
 * 新增一般帳號密碼註冊會員 (完全記憶體與雲端化，絕不觸發 EROFS)
 */
export async function createAuthUser(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<SafeAuthUser> {
  initializeUsers();
  const cleanEmail = params.email.trim().toLowerCase();

  const existing = await findAuthUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('此電子郵件已被註冊');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(params.password, salt);
  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newUser: AuthUser = {
    id: newUserId,
    email: cleanEmail,
    passwordHash,
    name: params.name || cleanEmail.split('@')[0],
    role: 'user',
    status: 'active',
    unlockedTiers: ['free'],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    provider: 'credentials',
  };

  inMemoryUsers.set(cleanEmail, newUser);

  // 同步寫入雲端 Supabase（若有配置）
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        password_hash: newUser.passwordHash,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        unlocked_tiers: newUser.unlockedTiers,
        provider: newUser.provider,
        created_at: newUser.createdAt,
        last_login_at: newUser.lastLoginAt,
      });
    } catch (err: any) {
      console.warn('[auth-users] Supabase 新增會員失敗:', err?.message);
    }
  }

  return toSafeAuthUser(newUser);
}

/**
 * 取得所有安全使用者清單
 */
export function getAllSafeAuthUsers(): SafeAuthUser[] {
  initializeUsers();
  return Array.from(inMemoryUsers.values()).map(toSafeAuthUser);
}

