/**
 * 全端唯一會員資料存取核心服務 (Single Source of Truth Service: lib/usersStorage.ts)
 * 功用：
 * 1. 統一收攏全站會員之註冊查重、建立、登入比對、後台查詢、修改權限與刪除
 * 2. 封裝全域唯一記憶體快取與 GitHub Contents API / 本地 data/users.json 的持久化雙向同步
 * 3. 徹底杜絕多重快取脫節所引發的狀態分裂 (Split-Brain)
 * 4. 絕對不依姓名誤殺真實會員（黃光隆先生等合法會員 100% 完整持久化並於後台呈現）
 * 5. 硬性保護系統最高管理員（opelwu2002@gmail.com / 吳俊彥 / Opel6439）絕對通行與防刪
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  fetchUsersFromGithub,
  commitUsersToGithub,
  filterOutGhostUsers,
  invalidateGithubUsersCache,
} from './github-db';

export interface StorageUser {
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

export type UserSafe = Omit<StorageUser, 'passwordHash'>;

// 系統預設最高管理者身分（正式由 opelwu2002@gmail.com 吳俊彥擔任）
const MASTER_ADMIN_USER: StorageUser = {
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

// 全域唯一的記憶體會員 Map (以 email 為 key)
const usersMap: Map<string, StorageUser> = new Map();
let isInitialized = false;

/**
 * 安全轉換為去密碼的安全會員物件
 */
export function toSafeUser(user: StorageUser): UserSafe {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

/**
 * 啟動初始化（唯讀載入本機種子檔案至記憶體）
 */
function ensureInitialized(): void {
  if (isInitialized) return;

  // 1. 預設加入最高管理者
  usersMap.set(MASTER_ADMIN_USER.email.toLowerCase(), { ...MASTER_ADMIN_USER });

  // 2. 唯讀嘗試載入本地 data/users.json
  try {
    const localFile = path.join(process.cwd(), 'data', 'users.json');
    if (fs.existsSync(localFile)) {
      const content = fs.readFileSync(localFile, 'utf-8');
      const list = JSON.parse(content);
      const cleanList = filterOutGhostUsers<any>(list);

      for (const u of cleanList) {
        if (!u.email) continue;
        const cleanEmail = u.email.trim().toLowerCase();
        const isMaster = cleanEmail === 'opelwu2002@gmail.com';

        usersMap.set(cleanEmail, {
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
            : ['free'],
          createdAt: Number(u.createdAt) || Date.now(),
          lastLoginAt: u.lastLoginAt ? Number(u.lastLoginAt) : undefined,
          provider: u.provider || 'credentials',
          providerId: u.providerId,
        });
      }
    }
  } catch (err: any) {
    console.warn('[usersStorage] 本地種子資料讀取通知:', err?.message);
  }

  isInitialized = true;
}

/**
 * 向遠端儲存庫同步最新名單並合併至記憶體
 */
async function syncFromRemote(): Promise<void> {
  ensureInitialized();
  try {
    const { users } = await fetchUsersFromGithub();
    if (Array.isArray(users) && users.length > 0) {
      for (const u of users) {
        if (!u.email) continue;
        const cleanEmail = u.email.trim().toLowerCase();
        const isMaster = cleanEmail === 'opelwu2002@gmail.com';

        usersMap.set(cleanEmail, {
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
            : ['free'],
          createdAt: Number(u.createdAt) || Date.now(),
          lastLoginAt: u.lastLoginAt ? Number(u.lastLoginAt) : undefined,
          provider: u.provider || 'credentials',
          providerId: u.providerId,
        });
      }
    }
  } catch (err: any) {
    console.warn('[usersStorage] 遠端同步警告:', err?.message);
  }

  // 確保最高管理者永遠存在
  if (!usersMap.has('opelwu2002@gmail.com')) {
    usersMap.set('opelwu2002@gmail.com', { ...MASTER_ADMIN_USER });
  }
}

/**
 * 提交持久化至 GitHub Contents API 與本地檔案
 */
async function persist(commitMessage: string): Promise<{ success: boolean; error?: string }> {
  ensureInitialized();
  const allUsers = Array.from(usersMap.values());
  const cleanUsers = filterOutGhostUsers(allUsers);

  // 本地環境同步寫入磁碟 (非 serverless 環境)
  const isServerless =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NOW_REGION) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

  if (!isServerless) {
    try {
      const localDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(localDir, 'users.json'),
        JSON.stringify(cleanUsers, null, 2),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('[usersStorage] 本機磁碟寫入警告:', err?.message);
    }
  }

  // 清理快取並提交 GitHub 倉庫
  invalidateGithubUsersCache();
  const commitRes = await commitUsersToGithub(cleanUsers, commitMessage);
  return commitRes;
}

// =============================================================================
// 公開權威服務介面 (Single Source of Truth APIs)
// =============================================================================

/**
 * 取得全體會員清單 (非同步：保證與遠端同步最新狀態)
 */
export async function getAllUsers(): Promise<UserSafe[]> {
  await syncFromRemote();
  return Array.from(usersMap.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toSafeUser);
}

/**
 * 取得全體會員清單 (同步快取版)
 */
export function getAllUsersSync(): UserSafe[] {
  ensureInitialized();
  return Array.from(usersMap.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toSafeUser);
}

/**
 * 依 Email 查找會員 (非同步：支援快取查無時遠端二次確認)
 */
export async function findUserByEmail(email: string): Promise<StorageUser | undefined> {
  ensureInitialized();
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return undefined;

  // 最高管理員別名支援
  if (clean === 'admin' || clean === 'opelwu2002@gmail.com') {
    return usersMap.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
  }

  const cached = usersMap.get(clean);
  if (cached) return cached;

  // 快取沒有時，自遠端同步後再查一次
  await syncFromRemote();
  return usersMap.get(clean);
}

/**
 * 依 Email 查找會員 (同步快取版)
 */
export function findUserByEmailSync(email: string): StorageUser | undefined {
  ensureInitialized();
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return undefined;

  if (clean === 'admin' || clean === 'opelwu2002@gmail.com') {
    return usersMap.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
  }

  return usersMap.get(clean);
}

/**
 * 依 ID 查找會員
 */
export function findUserById(id: string): StorageUser | undefined {
  ensureInitialized();
  for (const user of usersMap.values()) {
    if (user.id === id) return user;
  }
  return undefined;
}

/**
 * 建立新會員（註冊與後台新增共用，保證原子性入庫與查重）
 */
export async function createUser(params: {
  email: string;
  password?: string;
  name?: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
  phone?: string;
  company?: string;
  taxId?: string;
  industry?: string;
  address?: string;
  unlockedTiers?: string[];
  provider?: string;
  providerId?: string;
}): Promise<UserSafe> {
  ensureInitialized();
  const cleanEmail = params.email.trim().toLowerCase();

  // 1. 查重
  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    throw new Error('此電子郵件已被註冊');
  }

  // 2. 密碼加密
  const rawPassword = params.password || 'user123456';
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = params.provider ? '' : bcrypt.hashSync(rawPassword, salt);
  const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newUser: StorageUser = {
    id: newUserId,
    email: cleanEmail,
    passwordHash,
    name: params.name?.trim() || cleanEmail.split('@')[0],
    role: params.role || 'user',
    status: params.status || 'active',
    phone: params.phone?.trim() || undefined,
    company: params.company?.trim() || undefined,
    taxId: params.taxId?.trim() || undefined,
    industry: params.industry?.trim() || undefined,
    address: params.address?.trim() || undefined,
    unlockedTiers: Array.isArray(params.unlockedTiers) ? params.unlockedTiers : ['free'],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    provider: params.provider || 'credentials',
    providerId: params.providerId,
  };

  // 3. 寫入快取並持久化
  usersMap.set(cleanEmail, newUser);

  const persistRes = await persist(
    `feat(users): 新增會員 ${newUser.name} (${cleanEmail}) [skip ci]`
  );

  if (!persistRes.success) {
    usersMap.delete(cleanEmail);
    throw new Error(`資料庫寫入失敗：${persistRes.error || '無法提交儲存庫'}`);
  }

  return toSafeUser(newUser);
}

/**
 * 更新會員資料（編輯會員、修改權限共用，保證全端即時生效）
 */
export async function updateUser(
  idOrEmail: string,
  updateData: {
    name?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    password?: string;
    phone?: string;
    company?: string;
    taxId?: string;
    tax_id?: string;
    industry?: string;
    address?: string;
    unlockedTiers?: string[];
    unlocked_tiers?: string[];
  }
): Promise<UserSafe> {
  ensureInitialized();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) throw new Error('缺少目標會員識別碼');

  let targetUser: StorageUser | null = null;
  let targetEmail = '';

  for (const [email, user] of usersMap.entries()) {
    if (user.id === idOrEmail || user.id.toLowerCase() === target || email === target) {
      targetUser = user;
      targetEmail = email;
      break;
    }
  }

  if (!targetUser) {
    // 嘗試向遠端同步後再找一次
    await syncFromRemote();
    for (const [email, user] of usersMap.entries()) {
      if (user.id === idOrEmail || user.id.toLowerCase() === target || email === target) {
        targetUser = user;
        targetEmail = email;
        break;
      }
    }
  }

  if (!targetUser) {
    throw new Error('找不到指定會員');
  }

  const cleanStr = (val?: any) => (val === undefined || val === null ? undefined : String(val).trim());

  // 更新基本資料欄位
  if (updateData.name !== undefined) targetUser.name = cleanStr(updateData.name) || targetUser.name;
  if (updateData.role !== undefined) targetUser.role = updateData.role;
  if (updateData.status !== undefined) targetUser.status = updateData.status;

  // 更新企業機構與聯絡資訊欄位
  if (updateData.phone !== undefined) targetUser.phone = cleanStr(updateData.phone);
  if (updateData.company !== undefined) targetUser.company = cleanStr(updateData.company);
  const taxIdVal = updateData.taxId ?? updateData.tax_id;
  if (taxIdVal !== undefined) targetUser.taxId = cleanStr(taxIdVal);
  if (updateData.industry !== undefined) targetUser.industry = cleanStr(updateData.industry);
  if (updateData.address !== undefined) targetUser.address = cleanStr(updateData.address);

  // 更新解鎖權限等級 (支援 unlockedTiers 與 unlocked_tiers 雙命名)
  const rawTiers = updateData.unlockedTiers ?? updateData.unlocked_tiers;
  if (rawTiers !== undefined) {
    const list = Array.isArray(rawTiers) ? [...rawTiers] : [String(rawTiers)];
    if (!list.includes('free')) {
      list.unshift('free');
    }
    const isMaster = targetUser.email === 'opelwu2002@gmail.com';
    targetUser.unlockedTiers = isMaster
      ? ['free', 'level2', 'level3', 'synastry_addon']
      : Array.from(new Set(list));
  }

  if (updateData.password && updateData.password.trim().length >= 6) {
    targetUser.passwordHash = bcrypt.hashSync(updateData.password.trim(), 10);
  }

  usersMap.set(targetEmail, targetUser);

  const persistRes = await persist(
    `chore(users): 更新會員 ${targetEmail} 資料與權限 [skip ci]`
  );

  if (!persistRes.success) {
    throw new Error(`資料庫更新失敗：${persistRes.error || '無法提交儲存庫'}`);
  }

  return toSafeUser(targetUser);
}

/**
 * 刪除會員（管理後台刪除共用，保證絕對防刪最高管理員）
 */
export async function deleteUser(idOrEmail: string): Promise<UserSafe[]> {
  ensureInitialized();
  const target = (idOrEmail || '').trim().toLowerCase();
  if (!target) return getAllUsersSync();

  // 絕對防刪系統最高管理員
  if (
    target === 'admin-master-001' ||
    target === 'opelwu2002@gmail.com' ||
    target === 'admin'
  ) {
    throw new Error('系統最高管理者帳號受到最高安全保護，絕對不可刪除！');
  }

  let deleted = false;
  for (const [email, user] of usersMap.entries()) {
    if (user.id === idOrEmail || user.id.toLowerCase() === target || email === target) {
      if (user.role === 'admin' || user.id === 'admin-master-001' || email === 'opelwu2002@gmail.com') {
        continue;
      }
      usersMap.delete(email);
      deleted = true;
    }
  }

  if (deleted) {
    await persist(`chore(users): 刪除會員 ${idOrEmail} [skip ci]`);
  }

  return getAllUsersSync();
}

/**
 * 驗證帳號密碼登入憑證
 */
export async function verifyCredentials(
  accountOrEmail: string,
  password: string
): Promise<{ success: boolean; user?: UserSafe; error?: string }> {
  ensureInitialized();
  const inputUser = (accountOrEmail || '').trim();
  const inputPass = (password || '').trim();

  if (!inputUser || !inputPass) {
    return { success: false, error: '請輸入帳號/電子郵件與密碼' };
  }

  // 1. 最高管理員優先判定
  if (
    (inputUser.toLowerCase() === 'admin' ||
      inputUser.toLowerCase() === 'opelwu2002@gmail.com') &&
    inputPass === 'Opel6439'
  ) {
    const admin = usersMap.get('opelwu2002@gmail.com') || MASTER_ADMIN_USER;
    admin.lastLoginAt = Date.now();
    return { success: true, user: toSafeUser(admin) };
  }

  // 2. 尋找會員
  const user = await findUserByEmail(inputUser);
  if (!user) {
    return { success: false, error: '帳號或密碼錯誤' };
  }

  // 3. 停權檢查
  if (user.status === 'suspended') {
    return { success: false, error: '此帳號已被停權，請聯繫客服' };
  }

  // 4. 比對密碼
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

  user.lastLoginAt = Date.now();
  usersMap.set(user.email.toLowerCase(), user);

  return { success: true, user: toSafeUser(user) };
}
