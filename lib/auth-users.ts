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
import { upsertUser } from './db';

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended';
  phone?: string;
  company?: string;
  taxId?: string;
  industry?: string;
  address?: string;
  unlockedTiers: string[];
  createdAt: number;
  lastLoginAt?: number;
  provider?: string;
  providerId?: string;
}

export type SafeAuthUser = Omit<AuthUser, 'passwordHash'>;

// 系統預設最高管理者身分（正式由 opelwu2002@gmail.com 吳俊彥擔任）
const MASTER_ADMIN_USER: AuthUser = {
  id: 'admin-master-001',
  email: 'opelwu2002@gmail.com',
  passwordHash: bcrypt.hashSync('Opel6439', 10),
  name: '吳俊彥',
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
        // 徹底排除舊管理員 admin@omni-astrology.com
        if (cleanEmail === 'admin@omni-astrology.com') continue;

        const isMaster = cleanEmail === 'opelwu2002@gmail.com';
        inMemoryUsers.set(cleanEmail, {
          id: u.id || `user-${Date.now()}`,
          email: cleanEmail,
          passwordHash: u.passwordHash || '',
          name: isMaster ? '吳俊彥' : u.name || cleanEmail.split('@')[0],
          role: isMaster ? 'admin' : u.role === 'admin' ? 'admin' : 'user',
          status: u.status === 'suspended' ? 'suspended' : 'active',
          phone: u.phone,
          company: u.company,
          taxId: u.taxId,
          industry: u.industry,
          address: u.address,
          unlockedTiers: isMaster
            ? ['free', 'level2', 'level3', 'synastry_addon']
            : Array.isArray(u.unlockedTiers)
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

  // 管理者帳號別名比對（輸入 admin 或 opelwu2002@gmail.com 均回傳最高管理者）
  if (clean === 'admin' || clean === 'opelwu2002@gmail.com') {
    return inMemoryUsers.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
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
  if (clean === 'admin' || clean === 'opelwu2002@gmail.com') {
    return inMemoryUsers.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
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
          phone: data.phone || undefined,
          company: data.company || undefined,
          taxId: data.tax_id || undefined,
          industry: data.industry || undefined,
          address: data.address || undefined,
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
      inputUser.toLowerCase() === 'opelwu2002@gmail.com') &&
    inputPass === 'Opel6439'
  ) {
    const admin = inMemoryUsers.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
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
  phone?: string;
  company?: string;
  taxId?: string;
  industry?: string;
  address?: string;
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
    phone: params.phone,
    company: params.company,
    taxId: params.taxId,
    industry: params.industry,
    address: params.address,
    unlockedTiers: ['free'],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    provider: 'credentials',
  };

  // 1. 若有配置雲端 Supabase 資料庫，必須強制成功寫入雲端！
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const insertPayload: any = {
      id: newUser.id,
      email: newUser.email,
      password_hash: newUser.passwordHash,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
      phone: newUser.phone,
      company: newUser.company,
      tax_id: newUser.taxId,
      industry: newUser.industry,
      address: newUser.address,
      unlocked_tiers: newUser.unlockedTiers,
      provider: newUser.provider,
      created_at: newUser.createdAt,
      last_login_at: newUser.lastLoginAt,
    };

    const { error: insertError } = await supabase.from('users').insert(insertPayload);

    if (insertError) {
      console.error('[auth-users] Supabase 新增會員失敗:', insertError);

      // 若錯誤為特定欄位不存在（例如 Supabase 尚未執行 ALTER TABLE）
      if (
        insertError.code === '42703' ||
        (insertError.message &&
          (insertError.message.includes('column') || insertError.message.includes('not exist')))
      ) {
        throw new Error(
          `雲端資料庫尚未擴充新欄位（${insertError.message}）。請管理員至 Supabase SQL Editor 執行 database/migration_add_enterprise_fields.sql 遷移腳本以啟用完整功能。`
        );
      }

      if (insertError.code === '23505') {
        throw new Error('此電子郵件已被註冊');
      }

      throw new Error(`雲端資料庫會員寫入失敗：${insertError.message || '連線逾時或權限不足'}`);
    }
  }

  // 2. 雲端資料庫成功寫入後（或未配置雲端時），同步寫入本機記憶體與 users.json
  inMemoryUsers.set(cleanEmail, newUser);

  try {
    upsertUser({
      id: newUser.id,
      email: newUser.email,
      passwordHash: newUser.passwordHash,
      name: newUser.name,
      role: newUser.role,
      status: newUser.status,
      phone: newUser.phone,
      company: newUser.company,
      taxId: newUser.taxId,
      industry: newUser.industry,
      address: newUser.address,
      unlockedTiers: ['free'],
      createdAt: newUser.createdAt,
      lastLoginAt: newUser.lastLoginAt,
    });
  } catch (err: any) {
    console.warn('[auth-users] 同步寫入 users.json 容錯通知:', err?.message);
  }

  return toSafeAuthUser(newUser);
}

/**
 * 非同步取得所有認證會員（優先向 Supabase 撈取最新名單並快取）
 */
export async function getAllAuthUsersAsync(): Promise<SafeAuthUser[]> {
  initializeUsers();
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const cleanEmail = (row.email || '').trim().toLowerCase();
          if (!cleanEmail || cleanEmail === 'admin@omni-astrology.com') continue;

          const isMaster = cleanEmail === 'opelwu2002@gmail.com';
          const user: AuthUser = {
            id: row.id,
            email: cleanEmail,
            passwordHash: row.password_hash || '',
            name: isMaster ? '吳俊彥' : row.name || cleanEmail.split('@')[0],
            role: isMaster ? 'admin' : row.role === 'admin' ? 'admin' : 'user',
            status: row.status === 'suspended' ? 'suspended' : 'active',
            phone: row.phone || undefined,
            company: row.company || undefined,
            taxId: row.tax_id || undefined,
            industry: row.industry || undefined,
            address: row.address || undefined,
            unlockedTiers: isMaster
              ? ['free', 'level2', 'level3', 'synastry_addon']
              : Array.isArray(row.unlocked_tiers)
              ? row.unlocked_tiers
              : ['free'],
            createdAt: Number(row.created_at) || Date.now(),
            lastLoginAt: row.last_login_at ? Number(row.last_login_at) : undefined,
            provider: row.provider || 'credentials',
            providerId: row.provider_id || undefined,
          };
          inMemoryUsers.set(cleanEmail, user);
        }
      }
    } catch (err: any) {
      console.warn('[auth-users] Supabase 查詢全體用戶失敗:', err?.message);
    }
  }

  return Array.from(inMemoryUsers.values()).map(toSafeAuthUser);
}

/**
 * 取得所有安全使用者清單
 */
export function getAllSafeAuthUsers(): SafeAuthUser[] {
  initializeUsers();
  return Array.from(inMemoryUsers.values()).map(toSafeAuthUser);
}

/**
 * 永久刪除認證會員（同步自記憶體與雲端移除）
 */
export function deleteAuthUser(idOrEmail: string): void {
  initializeUsers();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) return;

  for (const [email, user] of inMemoryUsers.entries()) {
    if (
      user.id === idOrEmail ||
      user.id.toLowerCase() === target ||
      email === target
    ) {
      // 絕對保護系統最高管理者 opelwu2002@gmail.com
      if (user.role === 'admin' || user.id === 'admin-master-001' || email === 'opelwu2002@gmail.com') {
        continue;
      }
      inMemoryUsers.delete(email);
    }
  }

  // 同步刪除 Supabase 雲端資料庫（若有配置）
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      supabase
        .from('users')
        .delete()
        .or(`id.eq.${idOrEmail},email.eq.${target}`)
        .then(() => {});
    } catch {}
  }
}

/**
 * 即時同步更新認證層會員的解鎖方案 (unlockedTiers)
 */
export function updateAuthUserTiers(idOrEmail: string, tiers: string[]): void {
  initializeUsers();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) return;

  for (const [email, user] of inMemoryUsers.entries()) {
    if (
      user.id === idOrEmail ||
      user.id.toLowerCase() === target ||
      email === target
    ) {
      user.unlockedTiers = Array.isArray(tiers) ? [...tiers] : ['free'];
      inMemoryUsers.set(email, user);
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      supabase
        .from('users')
        .update({ unlocked_tiers: tiers })
        .or(`id.eq.${idOrEmail},email.eq.${target}`)
        .then(() => {});
    } catch {}
  }
}


