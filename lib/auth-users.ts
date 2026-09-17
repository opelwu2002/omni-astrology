/**
 * Omni-Astrology 全端認證與會員資料安全存取層 (lib/auth-users.ts)
 * 功用：
 * 1. 啟動時安全唯讀載入 data/users.json 作為基礎種子資料 (Seed Users)
 * 2. 直通 GitHub Contents API 進行雲端永續儲存，徹底拔除 Supabase 依賴
 * 3. 封殺所有本機寫入，徹底杜絕 Vercel Serverless EROFS 唯讀檔案系統錯誤
 * 4. 完美相容舊會員（包含 opelwu2002@gmail.com 之 bcrypt 密碼與已解鎖權限）
 * 5. 硬性保證最高管理員 (admin / Opel6439 / opelwu2002@gmail.com) 絕對通行
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  fetchUsersFromGithub,
  commitUsersToGithub,
  filterOutGhostUsers,
} from './github-db';
import { upsertUser, deleteUser } from './db';

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

// 記憶體會員資料庫（在 Serverless 生命週期內持續存在，杜絕 EROFS）
let inMemoryUsers: Map<string, AuthUser> = new Map();
let isInitialized = false;

/**
 * 載入基礎種子資料 (唯讀模式)
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
      const cleanUsers = filterOutGhostUsers(jsonUsers);

      for (const u of cleanUsers) {
        if (!u.email) continue;
        const cleanEmail = u.email.trim().toLowerCase();
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
 * 依 Email 尋找使用者（同步快取查找）
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
 * 依 Email 非同步查詢（優先自 GitHub 倉庫同步最新資料）
 */
export async function findAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
  initializeUsers();
  const clean = email.trim().toLowerCase();

  // 1. 最高管理者優先硬編碼放行
  if (clean === 'admin' || clean === 'opelwu2002@gmail.com') {
    return inMemoryUsers.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
  }

  // 2. 若快取中存在直接回傳
  const cached = inMemoryUsers.get(clean);
  if (cached) return cached;

  // 3. 若快取無此人，嘗試向 GitHub 倉庫拉取最新資料庫
  try {
    const { users } = await fetchUsersFromGithub();
    if (Array.isArray(users)) {
      for (const u of users) {
        const userEmail = (u.email || '').trim().toLowerCase();
        if (userEmail) {
          inMemoryUsers.set(userEmail, {
            id: u.id,
            email: userEmail,
            passwordHash: u.passwordHash || '',
            name: u.name || userEmail.split('@')[0],
            role: u.role || 'user',
            status: u.status || 'active',
            phone: u.phone,
            company: u.company,
            taxId: u.taxId,
            industry: u.industry,
            address: u.address,
            unlockedTiers: Array.isArray(u.unlockedTiers) ? u.unlockedTiers : ['free'],
            createdAt: Number(u.createdAt) || Date.now(),
            lastLoginAt: u.lastLoginAt ? Number(u.lastLoginAt) : undefined,
            provider: u.provider || 'credentials',
            providerId: u.providerId,
          });
        }
      }
    }
  } catch (err: any) {
    console.warn('[auth-users] 拉取 GitHub 倉庫會員異常:', err?.message);
  }

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

  // 5. 更新最後登入時間
  user.lastLoginAt = Date.now();
  inMemoryUsers.set(user.email.toLowerCase(), user);

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
    user.lastLoginAt = Date.now();
    if (params.name) user.name = params.name;
    user.provider = params.provider;
    if (params.providerId) user.providerId = params.providerId;

    inMemoryUsers.set(cleanEmail, user);
    await commitUsersToGithub(
      Array.from(inMemoryUsers.values()),
      `chore(auth): 更新第三方登入資訊 (${cleanEmail}) [skip ci]`
    );

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
  await commitUsersToGithub(
    Array.from(inMemoryUsers.values()),
    `chore(auth): 新增第三方會員 (${cleanEmail}) [skip ci]`
  );

  return toSafeAuthUser(newUser);
}

/**
 * 新增一般帳號密碼註冊會員 (對接 GitHub 倉庫持久化)
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

  // 1. 寫入記憶體
  inMemoryUsers.set(cleanEmail, newUser);

  // 2. 提交更新至 GitHub 倉庫 (或本地磁碟降級)
  const allUsersList = Array.from(inMemoryUsers.values());
  const commitResult = await commitUsersToGithub(
    allUsersList,
    `feat(users): 新增會員註冊 ${newUser.name} (${cleanEmail}) [skip ci]`
  );

  if (!commitResult.success) {
    // 提交失敗則撤回記憶體
    inMemoryUsers.delete(cleanEmail);
    throw new Error(`資料庫寫入失敗：${commitResult.error || '無法提交至 GitHub 儲存庫'}`);
  }

  // 3. 同步至 lib/db 資料結構
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
 * 非同步取得所有認證會員（優先向 GitHub 倉庫撈取最新名單並快取）
 */
export async function getAllAuthUsersAsync(): Promise<SafeAuthUser[]> {
  initializeUsers();

  try {
    const { users } = await fetchUsersFromGithub();
    if (Array.isArray(users) && users.length > 0) {
      for (const row of users) {
        const cleanEmail = (row.email || '').trim().toLowerCase();
        if (!cleanEmail || cleanEmail === 'admin@omni-astrology.com') continue;

        const isMaster = cleanEmail === 'opelwu2002@gmail.com';
        const user: AuthUser = {
          id: row.id,
          email: cleanEmail,
          passwordHash: row.passwordHash || '',
          name: isMaster ? '吳俊彥' : row.name || cleanEmail.split('@')[0],
          role: isMaster ? 'admin' : row.role === 'admin' ? 'admin' : 'user',
          status: row.status === 'suspended' ? 'suspended' : 'active',
          phone: row.phone || undefined,
          company: row.company || undefined,
          taxId: row.taxId || undefined,
          industry: row.industry || undefined,
          address: row.address || undefined,
          unlockedTiers: isMaster
            ? ['free', 'level2', 'level3', 'synastry_addon']
            : Array.isArray(row.unlockedTiers)
            ? row.unlockedTiers
            : ['free'],
          createdAt: Number(row.createdAt) || Date.now(),
          lastLoginAt: row.lastLoginAt ? Number(row.lastLoginAt) : undefined,
          provider: row.provider || 'credentials',
          providerId: row.providerId || undefined,
        };
        inMemoryUsers.set(cleanEmail, user);
      }
    }
  } catch (err: any) {
    console.warn('[auth-users] GitHub 查詢全體用戶失敗:', err?.message);
  }

  // 確保最高管理者永遠存在
  if (!inMemoryUsers.has('opelwu2002@gmail.com')) {
    inMemoryUsers.set('opelwu2002@gmail.com', { ...MASTER_ADMIN_USER });
  }

  return Array.from(inMemoryUsers.values()).map(toSafeAuthUser);
}

/**
 * 取得所有安全使用者清單 (同步快取版)
 */
export function getAllSafeAuthUsers(): SafeAuthUser[] {
  initializeUsers();
  return Array.from(inMemoryUsers.values()).map(toSafeAuthUser);
}

/**
 * 刪除認證會員 (同步包裝)
 */
export function deleteAuthUser(idOrEmail: string): void {
  deleteAuthUserAsync(idOrEmail).catch((err) => {
    console.error('[auth-users] deleteAuthUser 異步操作錯誤:', err);
  });
}

/**
 * 非同步永久刪除認證會員（真實 commit 至 GitHub 倉庫）
 */
export async function deleteAuthUserAsync(idOrEmail: string): Promise<void> {
  initializeUsers();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) return;

  let deleted = false;
  for (const [email, user] of inMemoryUsers.entries()) {
    if (
      user.id === idOrEmail ||
      user.id.toLowerCase() === target ||
      email === target
    ) {
      if (
        user.role === 'admin' ||
        user.id === 'admin-master-001' ||
        email === 'opelwu2002@gmail.com'
      ) {
        continue;
      }
      inMemoryUsers.delete(email);
      deleted = true;
    }
  }

  // 同步連動 lib/db
  try {
    deleteUser(idOrEmail);
  } catch {}

  if (deleted) {
    await commitUsersToGithub(
      Array.from(inMemoryUsers.values()),
      `chore(users): 刪除會員 ${idOrEmail} [skip ci]`
    );
  }
}

/**
 * 即時同步更新認證層會員的解鎖方案 (unlockedTiers)
 */
export function updateAuthUserTiers(idOrEmail: string, tiers: string[]): void {
  initializeUsers();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) return;

  let updated = false;
  for (const [email, user] of inMemoryUsers.entries()) {
    if (
      user.id === idOrEmail ||
      user.id.toLowerCase() === target ||
      email === target
    ) {
      user.unlockedTiers = Array.isArray(tiers) ? [...tiers] : ['free'];
      inMemoryUsers.set(email, user);
      updated = true;
    }
  }

  if (updated) {
    commitUsersToGithub(
      Array.from(inMemoryUsers.values()),
      `chore(users): 更新會員 ${idOrEmail} 權限為 [${tiers.join(', ')}] [skip ci]`
    ).catch((err) => {
      console.warn('[auth-users] updateAuthUserTiers 提交失敗:', err?.message);
    });
  }
}
