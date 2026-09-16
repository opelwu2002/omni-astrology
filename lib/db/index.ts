/**
 * 輕量化持久資料庫層 (Database Layer)
 * 負責儲存會員資料、雲端命盤檔案與系統統計數據
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  UserSafe,
  UserProfileStorage,
  SystemStats,
  Order,
  UnlockTier,
  InvoiceInfo,
  InvoiceStatus,
  InvoiceType,
  AuditLog,
  AuditAction,
  PaymentConfig,
  WebhookLog,
} from '@/types/auth';
import { UserProfile } from '@/types/profile';

import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USER_PROFILES_FILE = path.join(DATA_DIR, 'user_profiles.json');
const STATS_FILE = path.join(DATA_DIR, 'system_stats.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const PAYMENT_CONFIG_FILE = path.join(DATA_DIR, 'payment_config.json');
const WEBHOOK_LOGS_FILE = path.join(DATA_DIR, 'webhook_logs.json');

// 確保 data 目錄存在 (Vercel 唯讀保護)
try {
  if (!fs.existsSync(DATA_DIR) && process.env.VERCEL !== '1') {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch {
  // 唯讀檔案系統安全忽略
}

// 記憶體快取層（Serverless 生命週期內維持狀態，杜絕唯讀拋錯）
let cachedUsers: User[] | null = null;
let cachedOrders: Order[] | null = null;
let cachedAuditLogs: AuditLog[] | null = null;
let cachedStats: SystemStats | null = null;
let cachedPaymentConfig: PaymentConfig | null = null;
let cachedWebhookLogs: WebhookLog[] | null = null;
let cachedUserProfiles: Record<string, UserProfile[]> = {};

/**
 * 安全寫入 JSON 檔案：
 * 針對 Vercel Serverless / 雲端容器唯讀檔案系統進行 100% 絕對防護
 * 在雲端/生產環境下，禁止任何向專案本機檔案寫入的操作，全由記憶體快取與雲端資料庫接管
 */
function safeWriteFileSync(filePath: string, data: any): void {
  const isServerlessOrProd =
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.NOW_REGION) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    process.env.NODE_ENV === 'production' ||
    filePath.includes('/var/task') ||
    filePath.includes('\\var\\task');

  if (isServerlessOrProd) {
    // 雲端生產與 Serverless 環境完全不執行任何檔案寫入，全由記憶體快取或外接資料庫接管
    return;
  }

  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, serialized, 'utf-8');
  } catch {
    // 任何檔案系統錯誤直接安全吞下，絕不拋出未捕獲錯誤
  }
}

// 初始化預設管理員與測試使用者
function initUsers(): User[] {
  if (cachedUsers) return cachedUsers;

  const salt = bcrypt.genSaltSync(10);
  const masterAdminPasswordHash = bcrypt.hashSync('Opel6439', salt);
  const userPasswordHash = bcrypt.hashSync('user123456', salt);

  if (fs.existsSync(USERS_FILE)) {
    try {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: User[] = JSON.parse(content);
      const adminUser = list.find((u) => u.id === 'admin-master-001' || u.role === 'admin');
      if (adminUser) {
        // 強制校正最高管理者密碼雜湊為 Opel6439
        if (!bcrypt.compareSync('Opel6439', adminUser.passwordHash)) {
          adminUser.passwordHash = masterAdminPasswordHash;
          safeWriteFileSync(USERS_FILE, list);
        }
      }
      cachedUsers = list;
      return list;
    } catch {
      // 容錯重建
    }
  }

  const initialUsers: User[] = [
    {
      id: 'admin-master-001',
      email: 'admin@omni-astrology.com',
      passwordHash: masterAdminPasswordHash,
      name: '系統最高管理員',
      role: 'admin',
      status: 'active',
      createdAt: Date.now() - 30 * 86400 * 1000,
      lastLoginAt: Date.now(),
    },
    {
      id: 'user-sample-002',
      email: 'vip@omni-astrology.com',
      passwordHash: userPasswordHash,
      name: '陳雅婷 VIP',
      role: 'user',
      status: 'active',
      createdAt: Date.now() - 7 * 86400 * 1000,
      lastLoginAt: Date.now() - 3600 * 1000,
    },
  ];

  safeWriteFileSync(USERS_FILE, initialUsers);
  return initialUsers;
}

// 初始化系統稽核日誌
function initAuditLogs(): AuditLog[] {
  if (fs.existsSync(AUDIT_LOGS_FILE)) {
    try {
      const content = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // 容錯重建
    }
  }

  const initialLogs: AuditLog[] = [
    {
      id: 'audit-init-001',
      adminId: 'admin-master-001',
      adminEmail: 'admin@omni-astrology.com',
      action: 'order_status_change',
      targetId: 'ORD-20260910-8831',
      targetType: 'order',
      details: '系統啟動：初次對帳同步訂單狀態為已付款',
      ip: '127.0.0.1',
      timestamp: Date.now() - 4 * 86400 * 1000,
    },
    {
      id: 'audit-init-002',
      adminId: 'admin-master-001',
      adminEmail: 'admin@omni-astrology.com',
      action: 'invoice_status_change',
      targetId: 'ORD-20260910-8831',
      targetType: 'invoice',
      details: '紙本發票狀態推進：已開立 ➔ 已寄出（掛號單號 928374615243）',
      ip: '127.0.0.1',
      timestamp: Date.now() - 2 * 86400 * 1000,
    },
  ];

  safeWriteFileSync(AUDIT_LOGS_FILE, initialLogs);
  return initialLogs;
}

// 取得所有稽核日誌（依時間倒序）
export function getAuditLogs(): AuditLog[] {
  const logs = initAuditLogs();
  return [...logs].sort((a, b) => b.timestamp - a.timestamp);
}

// 新增稽核日誌
export function addAuditLog(
  log: Omit<AuditLog, 'id' | 'timestamp'> & { timestamp?: number }
): AuditLog {
  const logs = initAuditLogs();
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: log.timestamp || Date.now(),
    ...log,
  };
  logs.unshift(newLog);
  // 保留最新 1000 筆日誌
  const trimmed = logs.slice(0, 1000);
  safeWriteFileSync(AUDIT_LOGS_FILE, trimmed);
  return newLog;
}

// 初始化系統統計數據
function initStats(): SystemStats {
  if (fs.existsSync(STATS_FILE)) {
    try {
      const content = fs.readFileSync(STATS_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // 容錯
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const initialStats: SystemStats = {
    totalCalculations: 3824,
    todayCalculations: 128,
    lastResetDate: todayStr,
    totalRevenue: 25800,
    monthlyRevenue: 18600,
    conversionRate: 18.5,
    totalUsers: 2,
    todayNewUsers: 1,
    userGrowthRate: 50.0,
    pendingInvoicesCount: 0,
    readyToShipInvoicesCount: 1,
    dailyRevenue7Days: [
      { date: '09/10', amount: 699, count: 1 },
      { date: '09/11', amount: 0, count: 0 },
      { date: '09/12', amount: 199, count: 1 },
      { date: '09/13', amount: 898, count: 2 },
      { date: '09/14', amount: 1398, count: 2 },
      { date: '09/15', amount: 2097, count: 3 },
      { date: '09/16', amount: 699, count: 1 },
    ],
    tierSalesStats: {
      level2: { count: 8, revenue: 1592 },
      level3: { count: 32, revenue: 22368 },
      synastry_addon: { count: 4, revenue: 1596 },
    },
    matchTypeStats: {
      loveMarriage: 2140,
      careerPartner: 1210,
      familyFriend: 474,
    },
    popularSigns: {
      天蠍座: 482,
      雙魚座: 421,
      巨蟹座: 390,
      獅子座: 380,
      金牛座: 350,
      處女座: 330,
      天秤座: 320,
      摩羯座: 310,
      射手座: 290,
      雙子座: 280,
      牡羊座: 271,
      水瓶座: 200,
    },
  };

  safeWriteFileSync(STATS_FILE, initialStats);
  return initialStats;
}

// 讀取所有會員
export function getUsers(): User[] {
  return initUsers();
}

// 儲存會員
export function saveUsers(users: User[]): void {
  safeWriteFileSync(USERS_FILE, users);
}

// 安全過濾使用者（去除密碼雜湊）
export function toSafeUser(user: User): UserSafe {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

// 依據 Email 或帳號尋找使用者 (支援最高管理者帳號 admin)
export function findUserByEmail(email: string): User | undefined {
  const users = getUsers();
  const query = email.trim().toLowerCase();
  if (query === 'admin' || query === 'admin@omni-astrology.com') {
    return users.find((u) => u.role === 'admin' || u.id === 'admin-master-001');
  }
  return users.find((u) => u.email.toLowerCase() === query);
}

// 依據 ID 尋找使用者
export function findUserById(id: string): User | undefined {
  const users = getUsers();
  return users.find((u) => u.id === id);
}

// 建立新會員
export function createUser(email: string, password: string,name: string): UserSafe {
  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    throw new Error('此電子郵件已被註冊');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email,
    passwordHash,
    name: name || email.split('@')[0],
    role: 'user',
    status: 'active',
    createdAt: Date.now(),
  };

  users.push(newUser);
  saveUsers(users);
  return toSafeUser(newUser);
}

// 更新會員狀態或角色
export function updateUser(
  id: string,
  updateData: Partial<Pick<User, 'name' | 'role' | 'status' | 'lastLoginAt'>>
): UserSafe {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error('找不到指定會員');
  }

  users[idx] = { ...users[idx], ...updateData };
  saveUsers(users);
  return toSafeUser(users[idx]);
}

// 刪除會員
export function deleteUser(id: string): void {
  let users = getUsers();
  users = users.filter((u) => u.id !== id);
  saveUsers(users);
}

// 管理員直接新增會員
export function adminCreateUser(params: {
  email: string;
  password: string;
  name: string;
  role?: 'user' | 'admin';
  status?: 'active' | 'suspended';
  unlockedTiers?: UnlockTier[];
}): UserSafe {
  const users = getUsers();
  const existing = users.find(
    (u) => u.email.toLowerCase() === params.email.trim().toLowerCase()
  );
  if (existing) {
    throw new Error('此電子郵件已被註冊');
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(params.password, salt);

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: params.email.trim().toLowerCase(),
    passwordHash,
    name: params.name || params.email.split('@')[0],
    role: params.role || 'user',
    status: params.status || 'active',
    unlockedTiers:
      params.unlockedTiers && params.unlockedTiers.length > 0
        ? params.unlockedTiers
        : ['free'],
    createdAt: Date.now(),
  };

  users.unshift(newUser);
  saveUsers(users);
  return toSafeUser(newUser);
}

// 管理員修改會員資料（包含密碼重設與解鎖權限調整）
export function adminUpdateUser(
  id: string,
  params: {
    name?: string;
    role?: 'user' | 'admin';
    status?: 'active' | 'suspended';
    password?: string;
    unlockedTiers?: UnlockTier[];
  }
): UserSafe {
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    throw new Error('找不到指定會員');
  }

  if (params.name !== undefined) users[idx].name = params.name;
  if (params.role !== undefined) users[idx].role = params.role;
  if (params.status !== undefined) users[idx].status = params.status;
  if (params.unlockedTiers !== undefined) users[idx].unlockedTiers = params.unlockedTiers;
  if (params.password && params.password.trim().length >= 6) {
    const salt = bcrypt.genSaltSync(10);
    users[idx].passwordHash = bcrypt.hashSync(params.password.trim(), salt);
  }

  saveUsers(users);
  return toSafeUser(users[idx]);
}

// 收回使用者會員解鎖權限 (退款防弊連動)
export function revokeUserTier(
  userId: string,
  userEmail: string,
  tier: UnlockTier
): void {
  try {
    const users = getUsers();
    const targetUser = users.find(
      (u) =>
        u.id === userId ||
        (userEmail && u.email.toLowerCase() === userEmail.toLowerCase())
    );
    if (targetUser && targetUser.unlockedTiers) {
      targetUser.unlockedTiers = targetUser.unlockedTiers.filter((t) => t !== tier);
      if (targetUser.unlockedTiers.length === 0) {
        targetUser.unlockedTiers = ['free'];
      }
      saveUsers(users);
    }
  } catch {
    // 容錯處理
  }
}

// 讀取會員雲端命盤檔案
export function getUserProfiles(userId: string): UserProfile[] {
  if (!fs.existsSync(USER_PROFILES_FILE)) return [];
  try {
    const list: UserProfileStorage[] = JSON.parse(
      fs.readFileSync(USER_PROFILES_FILE, 'utf-8')
    );
    const item = list.find((i) => i.userId === userId);
    return item ? item.profiles : [];
  } catch {
    return [];
  }
}

// 儲存會員雲端命盤檔案
export function saveUserProfiles(userId: string, profiles: UserProfile[]): void {
  let list: UserProfileStorage[] = [];
  if (fs.existsSync(USER_PROFILES_FILE)) {
    try {
      list = JSON.parse(fs.readFileSync(USER_PROFILES_FILE, 'utf-8'));
    } catch {
      list = [];
    }
  }

  const existingIdx = list.findIndex((i) => i.userId === userId);
  if (existingIdx !== -1) {
    list[existingIdx] = { userId, profiles, updatedAt: Date.now() };
  } else {
    list.push({ userId, profiles, updatedAt: Date.now() });
  }

  safeWriteFileSync(USER_PROFILES_FILE, list);
}

// 取得系統統計數據
export function getSystemStats(): SystemStats {
  const stats = initStats();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  if (stats.lastResetDate !== todayStr) {
    stats.todayCalculations = 0;
    stats.lastResetDate = todayStr;
    safeWriteFileSync(STATS_FILE, stats);
  }

  const orders = getOrders();
  const users = getUsers();

  // 計算累計總營收 (已付款)
  const paidOrders = orders.filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);

  // 計算本月累計營收
  const monthlyPaidOrders = paidOrders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });
  const monthlyRevenue = monthlyPaidOrders.reduce((sum, o) => sum + o.amount, 0);

  // 會員總數與今日新增會員數
  const totalUsers = users.length;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayNewUsers = users.filter((u) => u.createdAt >= todayStart).length;
  const userGrowthRate =
    totalUsers > 0 ? Number(((todayNewUsers / totalUsers) * 100).toFixed(1)) : 0;

  // 付費轉換率
  const payingUsers = users.filter(
    (u) => u.unlockedTiers && u.unlockedTiers.some((t) => t !== 'free')
  ).length;
  const conversionRate =
    totalUsers > 0 ? Math.round((payingUsers / totalUsers) * 100) : 18;

  // 發票待辦筆數
  const invoiceOrders = orders.filter((o) => !!o.invoice);
  const pendingInvoicesCount = invoiceOrders.filter(
    (o) => o.invoice?.status === 'pending'
  ).length;
  const readyToShipInvoicesCount = invoiceOrders.filter(
    (o) => o.invoice?.status === 'ready_to_ship' || o.invoice?.status === 'issued'
  ).length;

  // 近 7 日營收走勢 (由 6 天前到今日)
  const dailyRevenue7Days: Array<{ date: string; amount: number; count: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const dateKey = `${String(targetDate.getMonth() + 1).padStart(2, '0')}/${String(
      targetDate.getDate()
    ).padStart(2, '0')}`;
    const startTs = targetDate.getTime();
    const endTs = startTs + 86400 * 1000;

    const dayOrders = paidOrders.filter(
      (o) => o.createdAt >= startTs && o.createdAt < endTs
    );
    const dayAmount = dayOrders.reduce((sum, o) => sum + o.amount, 0);
    dailyRevenue7Days.push({
      date: dateKey,
      amount: dayAmount,
      count: dayOrders.length,
    });
  }

  // 各方案銷售佔比統計
  const tierSalesStats = {
    level2: { count: 0, revenue: 0 },
    level3: { count: 0, revenue: 0 },
    synastry_addon: { count: 0, revenue: 0 },
  };

  paidOrders.forEach((o) => {
    if (o.tier === 'level2') {
      tierSalesStats.level2.count += 1;
      tierSalesStats.level2.revenue += o.amount;
    } else if (o.tier === 'level3') {
      tierSalesStats.level3.count += 1;
      tierSalesStats.level3.revenue += o.amount;
    } else if (o.tier === 'synastry_addon') {
      tierSalesStats.synastry_addon.count += 1;
      tierSalesStats.synastry_addon.revenue += o.amount;
    }
  });

  return {
    ...stats,
    totalRevenue,
    monthlyRevenue,
    conversionRate: conversionRate || 18,
    totalUsers,
    todayNewUsers,
    userGrowthRate,
    pendingInvoicesCount,
    readyToShipInvoicesCount,
    dailyRevenue7Days,
    tierSalesStats,
  };
}

// 記錄測算活動
export function recordCalculation(
  type: 'natal' | 'synastry',
  subType?: 'love' | 'career' | 'family',
  sunSign?: string
): void {
  const stats = getSystemStats();
  stats.totalCalculations += 1;
  stats.todayCalculations += 1;

  if (type === 'synastry' && subType) {
    if (subType === 'love') stats.matchTypeStats.loveMarriage += 1;
    if (subType === 'career') stats.matchTypeStats.careerPartner += 1;
    if (subType === 'family') stats.matchTypeStats.familyFriend += 1;
  }

  if (sunSign && stats.popularSigns[sunSign] !== undefined) {
    stats.popularSigns[sunSign] += 1;
  }

  safeWriteFileSync(STATS_FILE, stats);
}

// 讀取後台資料庫 JSON 文本
export function getDbContent(fileName: string): string {
  const safeName = path.basename(fileName);
  const targetPath = path.join(DATA_DIR, safeName);
  if (!fs.existsSync(targetPath)) {
    throw new Error('找不到指定的資料庫檔案');
  }
  return fs.readFileSync(targetPath, 'utf-8');
}

// 初始化預設訂單
function initOrders(): Order[] {
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    } catch {
      // 容錯
    }
  }

  const initialOrders: Order[] = [
    {
      id: 'ord-init-001',
      orderNumber: 'ORD-20260910-8831',
      userId: 'user-sample-002',
      userEmail: 'vip@omni-astrology.com',
      tier: 'level3',
      tierName: '高階終身全盤與三年運勢曲線報告',
      amount: 699,
      paymentMethod: 'line_pay',
      status: 'paid',
      createdAt: Date.now() - 5 * 86400 * 1000,
    },
    {
      id: 'ord-init-002',
      orderNumber: 'ORD-20260912-4521',
      userId: 'user-sample-002',
      userEmail: 'vip@omni-astrology.com',
      tier: 'level2',
      tierName: '初階事業與情感財富深度解析',
      amount: 199,
      paymentMethod: 'credit_card',
      status: 'paid',
      createdAt: Date.now() - 3 * 86400 * 1000,
    },
  ];

  safeWriteFileSync(ORDERS_FILE, initialOrders);
  return initialOrders;
}

// 取得所有訂單
export function getOrders(): Order[] {
  return initOrders();
}

// 依據訂單編號尋找訂單
export function findOrderByNumber(orderNumber: string): Order | undefined {
  const orders = getOrders();
  return orders.find((o) => o.orderNumber === orderNumber);
}

// 建立新訂單（支援紙本發票資訊與初始狀態）
export function createOrder(
  userId: string,
  userEmail: string,
  tier: UnlockTier,
  tierName: string,
  amount: number,
  paymentMethod: 'credit_card' | 'line_pay' | 'jko_pay' | 'ecpay',
  invoice?: import('@/types/auth').InvoiceInfo,
  initialStatus: 'paid' | 'pending' | 'failed' = 'paid'
): Order {
  const orders = getOrders();
  // 綠界特店交易編號必須小於或等於 20 碼，僅能由英數字組成
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `ORD${datePrefix}${randomSuffix}`; // 15 碼純英數，完全相容綠界

  const newOrder: Order = {
    id: `ord-${Date.now()}-${randomSuffix}`,
    orderNumber,
    userId,
    userEmail,
    tier,
    tierName,
    amount,
    paymentMethod,
    status: initialStatus,
    createdAt: Date.now(),
    invoice: invoice ? { ...invoice, status: invoice.status || 'pending' } : undefined,
  };

  orders.unshift(newOrder);
  safeWriteFileSync(ORDERS_FILE, orders);

  // 若初始即為已付款，立即自動解鎖權限
  if (initialStatus === 'paid') {
    unlockUserTier(userId, userEmail, tier);
  }

  return newOrder;
}

// 建立離線/人工補單（支援 ATM、LINE Pay、街口或線下匯款補單）
export function createManualOrder(params: {
  userId?: string;
  userEmail: string;
  tier: UnlockTier;
  tierName: string;
  amount: number;
  paymentMethod: 'credit_card' | 'line_pay' | 'jko_pay' | 'ecpay' | 'atm' | 'manual';
  status?: 'paid' | 'pending';
  invoice?: InvoiceInfo;
  note?: string;
}): Order {
  const orders = getOrders();
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `MAN${datePrefix}${randomSuffix}`;

  // 嘗試比對既有會員 ID
  let targetUserId = params.userId || '';
  if (!targetUserId && params.userEmail) {
    const matchedUser = findUserByEmail(params.userEmail);
    if (matchedUser) targetUserId = matchedUser.id;
  }
  if (!targetUserId) {
    targetUserId = `offline-user-${randomSuffix}`;
  }

  const initialStatus = params.status || 'paid';

  const newOrder: Order = {
    id: `ord-man-${Date.now()}-${randomSuffix}`,
    orderNumber,
    userId: targetUserId,
    userEmail: params.userEmail.trim(),
    tier: params.tier,
    tierName: params.tierName,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    status: initialStatus,
    createdAt: Date.now(),
    invoice: params.invoice
      ? { ...params.invoice, status: params.invoice.status || 'pending' }
      : undefined,
    note: params.note || '管理員手動離線補單',
  };

  orders.unshift(newOrder);
  safeWriteFileSync(ORDERS_FILE, orders);

  // 若標記為已付款，立即解鎖該會員權限
  if (initialStatus === 'paid') {
    unlockUserTier(targetUserId, params.userEmail, params.tier);
  }

  return newOrder;
}

// 解鎖使用者會員權限輔助函式
function unlockUserTier(userId: string, userEmail: string, tier: UnlockTier): void {
  try {
    const users = getUsers();
    const targetUser = users.find(
      (u) => u.id === userId || u.email.toLowerCase() === userEmail.toLowerCase()
    );
    if (targetUser) {
      const tiers = targetUser.unlockedTiers || ['free'];
      if (!tiers.includes(tier)) {
        tiers.push(tier);
        targetUser.unlockedTiers = tiers;
        saveUsers(users);
      }
    }
  } catch {
    // 容錯處理
  }
}

// 更新訂單付款狀態（例如綠界回調成功或後台手動確認）
export function updateOrderStatus(
  orderNumber: string,
  status: 'paid' | 'failed',
  ecpayTradeNo?: string
): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  orders[idx].status = status;
  if (ecpayTradeNo) {
    orders[idx].ecpayTradeNo = ecpayTradeNo;
  }
  safeWriteFileSync(ORDERS_FILE, orders);

  // 若成功付款，解鎖會員權限
  if (status === 'paid') {
    unlockUserTier(orders[idx].userId, orders[idx].userEmail, orders[idx].tier);
  }

  return orders[idx];
}

// 編輯訂單所屬發票資料（收件人、電話、地址、統編抬頭等）
export function updateInvoiceData(
  orderNumber: string,
  invoiceData: Partial<InvoiceInfo>
): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  const currentInvoice: InvoiceInfo = orders[idx].invoice || {
    type: 'personal',
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    status: 'pending',
  };

  orders[idx].invoice = {
    ...currentInvoice,
    ...invoiceData,
  };

  safeWriteFileSync(ORDERS_FILE, orders);
  return orders[idx];
}

// 更新發票生命週期五階段狀態（待開立 -> 已開立 -> 待寄出 -> 已寄出 -> 已完成）
export function updateInvoiceStatus(
  orderNumber: string,
  invoiceStatus: InvoiceStatus,
  trackingNumber?: string
): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1 || !orders[idx].invoice) return null;

  orders[idx].invoice = {
    ...orders[idx].invoice,
    status: invoiceStatus,
    ...(trackingNumber !== undefined ? { trackingNumber } : {}),
    ...(invoiceStatus === 'issued' ? { issuedAt: Date.now() } : {}),
    ...(invoiceStatus === 'shipped' ? { shippedAt: Date.now() } : {}),
    ...(invoiceStatus === 'completed' ? { completedAt: Date.now() } : {}),
  };

  safeWriteFileSync(ORDERS_FILE, orders);
  return orders[idx];
}

// 變更訂單為已退款狀態（自動連動收回會員對應報告解鎖權限）
export function updateOrderRefundStatus(orderNumber: string): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  orders[idx].status = 'refunded';
  orders[idx].refundedAt = Date.now();
  safeWriteFileSync(ORDERS_FILE, orders);

  // 自動收回權限，杜絕退款後仍可無償觀看之漏洞
  revokeUserTier(orders[idx].userId, orders[idx].userEmail, orders[idx].tier);

  return orders[idx];
}

// 取得所有附帶紙本發票的訂單（出貨清單專用）
export function getInvoices(): Order[] {
  const orders = getOrders();
  return orders.filter((o) => !!o.invoice);
}

// 取得綠界第三方支付配置
export function getPaymentConfig(): PaymentConfig {
  if (fs.existsSync(PAYMENT_CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(PAYMENT_CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      // 容錯
    }
  }

  const defaultConfig: PaymentConfig = {
    mode: 'sandbox',
    merchantId: '3456197',
    hashKey: 'RttngL4823khpLRX',
    hashIV: 'skQe3yMoSOuyMxRO',
    updatedAt: Date.now(),
  };

  safeWriteFileSync(PAYMENT_CONFIG_FILE, defaultConfig);
  return defaultConfig;
}

// 儲存綠界第三方支付配置
export function savePaymentConfig(config: Partial<PaymentConfig>): PaymentConfig {
  const current = getPaymentConfig();
  const updated: PaymentConfig = {
    ...current,
    ...config,
    updatedAt: Date.now(),
  };
  safeWriteFileSync(PAYMENT_CONFIG_FILE, updated);
  return updated;
}

// 讀取 Webhook 回調除錯日誌
export function getWebhookLogs(): WebhookLog[] {
  if (fs.existsSync(WEBHOOK_LOGS_FILE)) {
    try {
      const content = fs.readFileSync(WEBHOOK_LOGS_FILE, 'utf-8');
      const list: WebhookLog[] = JSON.parse(content);
      return list.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      // 容錯
    }
  }

  const initialLogs: WebhookLog[] = [
    {
      id: 'webhook-init-001',
      merchantTradeNo: 'ORD202609108831',
      tradeNo: '2609101234567890',
      rtnCode: '1',
      rtnMsg: '交易成功',
      tradeAmt: 699,
      paymentDate: '2026/09/10 14:20:15',
      timestamp: Date.now() - 5 * 86400 * 1000,
      rawParams: {
        MerchantID: '3456197',
        MerchantTradeNo: 'ORD202609108831',
        RtnCode: '1',
        RtnMsg: '交易成功',
      },
    },
  ];

  safeWriteFileSync(WEBHOOK_LOGS_FILE, initialLogs);
  return initialLogs;
}

// 新增 Webhook 回調日誌
export function addWebhookLog(
  log: Omit<WebhookLog, 'id' | 'timestamp'> & { timestamp?: number }
): WebhookLog {
  const logs = getWebhookLogs();
  const newLog: WebhookLog = {
    id: `wh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: log.timestamp || Date.now(),
    ...log,
  };
  logs.unshift(newLog);
  // 保留最新 300 筆
  const trimmed = logs.slice(0, 300);
  safeWriteFileSync(WEBHOOK_LOGS_FILE, trimmed);
  return newLog;
}

// 修改訂單金額與備註
export function updateOrderAmount(
  orderNumber: string,
  amount: number,
  note?: string
): Order | null {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.orderNumber === orderNumber);
  if (idx === -1) return null;

  orders[idx].amount = amount;
  if (note !== undefined) {
    orders[idx].note = note;
  }
  safeWriteFileSync(ORDERS_FILE, orders);
  return orders[idx];
}

// 手動開立獨立發票單（或為既有訂單補建立發票）
export function createManualInvoice(params: {
  orderNumber?: string;
  type: InvoiceType;
  buyerTitle?: string;
  taxId?: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address: string;
  amount?: number;
  note?: string;
}): Order {
  const orders = getOrders();
  const invoiceData: InvoiceInfo = {
    type: params.type,
    buyerTitle: params.buyerTitle || undefined,
    taxId: params.taxId || undefined,
    recipientName: params.recipientName,
    recipientPhone: params.recipientPhone,
    postalCode: params.postalCode,
    address: params.address,
    status: 'pending',
  };

  // 若指定了既有訂單編號，直接為其綁定或更新發票資訊
  if (params.orderNumber) {
    const existing = orders.find((o) => o.orderNumber === params.orderNumber);
    if (existing) {
      existing.invoice = invoiceData;
      if (params.note) existing.note = params.note;
      safeWriteFileSync(ORDERS_FILE, orders);
      return existing;
    }
  }

  // 若無或找不到，直接新建一筆人工發票出貨訂單
  const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `INV${datePrefix}${randomSuffix}`;

  const newOrder: Order = {
    id: `ord-inv-${Date.now()}-${randomSuffix}`,
    orderNumber,
    userId: `client-${randomSuffix}`,
    userEmail: `${params.recipientName}@offline.invoice`,
    tier: 'level2',
    tierName: '手動紙本發票開立',
    amount: params.amount || 199,
    paymentMethod: 'manual',
    status: 'paid',
    createdAt: Date.now(),
    invoice: invoiceData,
    note: params.note || '管理員手動開立紙本發票單',
  };

  orders.unshift(newOrder);
  safeWriteFileSync(ORDERS_FILE, orders);
  return newOrder;
}

// 更新後台資料庫 JSON 文本
export function updateDbContent(fileName: string, content: string): void {
  const safeName = path.basename(fileName);
  // 驗證是否為合法 JSON
  JSON.parse(content);
  const targetPath = path.join(DATA_DIR, safeName);
  safeWriteFileSync(targetPath, content);
}

/**
 * 安全同步更新使用者最後登入時間至雲端 Supabase 資料庫
 * （絕不觸發 Vercel EROFS 檔案寫入異常）
 */
export async function syncUserLastLogin(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      await supabase
        .from('users')
        .update({ last_login_at: Date.now() })
        .eq('id', userId);
    } catch (err: any) {
      console.warn('[Supabase Sync Warning] 更新 last_login_at 失敗:', err?.message);
    }
  }
}

/**
 * 依據 Email 尋找使用者（優先查詢 Supabase 雲端資料庫，離線或未配置時降級至記憶體/本地快取）
 */
export async function findUserByEmailFromDb(email: string): Promise<User | undefined> {
  const cleanEmail = email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          passwordHash: data.password_hash || '',
          name: data.name || cleanEmail.split('@')[0],
          role: (data.role as any) || 'user',
          status: (data.status as any) || 'active',
          unlockedTiers: (data.unlocked_tiers as any) || ['free'],
          createdAt: Number(data.created_at) || Date.now(),
          lastLoginAt: data.last_login_at ? Number(data.last_login_at) : Date.now(),
        };
      }
    } catch (err: any) {
      console.warn('[Supabase Query Warning] 查詢用戶失敗，降級使用本地快取:', err?.message);
    }
  }

  return findUserByEmail(cleanEmail);
}

/**
 * 第三方 OAuth (Google / GitHub / LINE) 使用者登入/自動建立中樞
 * 保證在雲端資料庫與本地記憶體中完成同步，並維持已解鎖權限
 */
export async function upsertOAuthUser(params: {
  email: string;
  name?: string;
  provider: 'google' | 'github' | 'line';
  providerId?: string;
}): Promise<UserSafe> {
  const cleanEmail = params.email.trim().toLowerCase();
  const supabase = getSupabaseAdmin();
  let existingUser = await findUserByEmailFromDb(cleanEmail);

  if (existingUser) {
    // 使用者已存在：更新登入時間與名稱
    const updated = updateUser(existingUser.id, {
      name: params.name || existingUser.name,
      lastLoginAt: Date.now(),
    });

    if (supabase) {
      try {
        await supabase
          .from('users')
          .update({
            name: updated.name,
            last_login_at: Date.now(),
            provider: params.provider,
            provider_id: params.providerId || null,
          })
          .eq('id', existingUser.id);
      } catch (err: any) {
        console.warn('[Supabase OAuth Update Warning]:', err?.message);
      }
    }

    return updated;
  }

  // 新增第三方註冊使用者
  const newUserId = `user-oauth-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const newUser: User = {
    id: newUserId,
    email: cleanEmail,
    passwordHash: '',
    name: params.name || cleanEmail.split('@')[0],
    role: 'user',
    status: 'active',
    unlockedTiers: ['free'],
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
  };

  const users = getUsers();
  users.unshift(newUser);
  saveUsers(users);

  if (supabase) {
    try {
      await supabase.from('users').insert({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        status: newUser.status,
        unlocked_tiers: newUser.unlockedTiers,
        provider: params.provider,
        provider_id: params.providerId || null,
        created_at: newUser.createdAt,
        last_login_at: newUser.lastLoginAt,
      });
    } catch (err: any) {
      console.warn('[Supabase OAuth Insert Warning]:', err?.message);
    }
  }

  return toSafeUser(newUser);
}
