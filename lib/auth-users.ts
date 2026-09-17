/**
 * Omni-Astrology 全端認證與會員資料安全存取層 (lib/auth-users.ts)
 * 功用：
 * 全面轉接至全端單一會員存取核心 (lib/usersStorage.ts)，提供 100% 向後相容介面，
 * 徹底杜絕多重快取脫節所引發的狀態分裂 (Split-Brain)。
 */

import {
  StorageUser,
  UserSafe,
  toSafeUser,
  getAllUsers,
  getAllUsersSync,
  findUserByEmail,
  findUserByEmailSync,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  verifyCredentials,
} from './usersStorage';

export type AuthUser = StorageUser;
export type SafeAuthUser = UserSafe;

export { toSafeUser as toSafeAuthUser, toSafeUser };

/**
 * 依 Email 尋找使用者 (同步快取版)
 */
export function findAuthUserByEmailSync(email: string): AuthUser | undefined {
  return findUserByEmailSync(email);
}

/**
 * 依 Email 非同步查詢 (優先向儲存核心同步最新名單)
 */
export async function findAuthUserByEmail(email: string): Promise<AuthUser | undefined> {
  return findUserByEmail(email);
}

/**
 * 依 ID 尋找使用者
 */
export function findAuthUserById(id: string): AuthUser | undefined {
  return findUserById(id);
}

/**
 * 驗證帳號與密碼
 */
export async function verifyUserCredentials(
  accountOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: SafeAuthUser; error?: string }> {
  return verifyCredentials(accountOrEmail, password);
}

/**
 * 第三方 OAuth (Google / LINE / GitHub) 使用者建立或狀態同步
 */
export async function upsertOAuthAuthUser(params: {
  email: string;
  name?: string;
  provider: 'google' | 'line' | 'github';
  providerId?: string;
}): Promise<SafeAuthUser> {
  const cleanEmail = params.email.trim().toLowerCase();
  const existing = await findUserByEmail(cleanEmail);

  if (existing) {
    return updateUser(cleanEmail, {
      name: params.name || existing.name,
    });
  }

  return createUser({
    email: cleanEmail,
    name: params.name || cleanEmail.split('@')[0],
    provider: params.provider,
    providerId: params.providerId,
    unlockedTiers: ['free'],
  });
}

/**
 * 新增一般帳號密碼註冊會員 (100% 直連單一儲存核心)
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
  return createUser({
    email: params.email,
    password: params.password,
    name: params.name,
    phone: params.phone,
    company: params.company,
    taxId: params.taxId,
    industry: params.industry,
    address: params.address,
    role: 'user',
    status: 'active',
    unlockedTiers: ['free'],
  });
}

/**
 * 非同步取得所有認證會員（100% 直連單一儲存核心）
 */
export async function getAllAuthUsersAsync(): Promise<SafeAuthUser[]> {
  return getAllUsers();
}

/**
 * 取得所有安全使用者清單 (同步版)
 */
export function getAllSafeAuthUsers(): SafeAuthUser[] {
  return getAllUsersSync();
}

export const getUsers = getAllSafeAuthUsers;
export const getUsersAsync = getAllAuthUsersAsync;

/**
 * 刪除認證會員 (同步相容包裝)
 */
export function deleteAuthUser(idOrEmail: string): void {
  deleteUser(idOrEmail).catch((err) => {
    console.error('[auth-users] deleteAuthUser 異步操作警告:', err?.message);
  });
}

/**
 * 非同步永久刪除認證會員
 */
export async function deleteAuthUserAsync(idOrEmail: string): Promise<void> {
  try {
    await deleteUser(idOrEmail);
  } catch (err: any) {
    console.warn('[auth-users] deleteAuthUserAsync 防刪保護:', err?.message);
  }
}

/**
 * 即時同步更新認證層會員的解鎖方案 (unlockedTiers)
 */
export function updateAuthUserTiers(idOrEmail: string, tiers: string[]): void {
  updateUser(idOrEmail, { unlockedTiers: tiers }).catch((err) => {
    console.warn('[auth-users] updateAuthUserTiers 警告:', err?.message);
  });
}

/**
 * 即時同步更新認證層會員的多個欄位資料
 */
export function updateAuthUserData(
  idOrEmail: string,
  updateData: {
    name?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    password?: string;
    phone?: string;
    company?: string;
    taxId?: string;
    industry?: string;
    address?: string;
    unlockedTiers?: string[];
  }
): void {
  updateUser(idOrEmail, updateData).catch((err) => {
    console.warn('[auth-users] updateAuthUserData 警告:', err?.message);
  });
}
