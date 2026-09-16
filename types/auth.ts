/**
 * 會員認證與商業化 SaaS 系統型別定義
 */
import { UserProfile } from './profile';

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'suspended';

// 會員解鎖權限等級
export type UnlockTier = 'free' | 'level2' | 'level3' | 'synastry_addon';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string; // 連絡電話 (手機/分機)
  company?: string; // 服務公司 / 機構名稱
  taxId?: string; // 公司統一編號 8 碼
  industry?: string; // 所屬行業分類 (環境部氣候變遷署七大行業)
  address?: string; // 連絡通訊地址 (寄送發票與憑證)
  unlockedTiers?: UnlockTier[];
  createdAt: number;
  lastLoginAt?: number;
}

export interface UserSafe {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  company?: string;
  taxId?: string;
  industry?: string;
  address?: string;
  unlockedTiers?: UnlockTier[];
  createdAt: number;
  lastLoginAt?: number;
}

// 企業級新會員註冊參數
export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  phone: string;
  company?: string;
  taxId?: string;
  industry: string;
  address: string;
}

export interface UserProfileStorage {
  userId: string;
  profiles: UserProfile[];
  updatedAt: number;
}

// 紙本發票作業生命週期五階段狀態機
export type InvoiceStatus =
  | 'pending' // 待開立 (綠界付款完成預設)
  | 'issued' // 已開立 (手寫/電子開立發票完畢)
  | 'ready_to_ship' // 待寄出 (已封裝準備郵局寄件)
  | 'shipped' // 已寄出 (已掛號寄出並記錄追蹤單號)
  | 'completed'; // 已完成/已簽收

// 發票種類：二聯式個人 (personal / individual) / 三聯式公司統編 (company)
export type InvoiceType = 'personal' | 'individual' | 'company';

export interface InvoiceInfo {
  type: InvoiceType;
  buyerTitle?: string; // 買受人抬頭 (三聯式必填)
  taxId?: string; // 統一編號 8 碼 (三聯式必填)
  recipientName: string; // 收件人姓名
  recipientPhone: string; // 收件人電話
  postalCode: string; // 郵遞區號 (3或5碼)
  address: string; // 郵寄收件地址
  status: InvoiceStatus; // 開立/郵寄作業狀態
  trackingNumber?: string; // 郵政掛號單號 / 物流追蹤號
  shippedAt?: number; // 寄出時間戳記
  issuedAt?: number; // 開立發票時間戳記
  completedAt?: number; // 完成/簽收時間戳記
}

// 訂單模型 (支援綠界與線下人工補單)
export interface Order {
  id: string;
  orderNumber: string; // 例: ORD-20260915-ABCD (綠界 MerchantTradeNo 限 20 碼以內)
  userId: string;
  userEmail: string;
  tier: UnlockTier;
  tierName: string;
  amount: number; // 台幣 NT$
  paymentMethod: 'credit_card' | 'line_pay' | 'jko_pay' | 'ecpay' | 'atm' | 'manual';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  createdAt: number;
  invoice?: InvoiceInfo; // 紙本發票郵寄資訊
  ecpayTradeNo?: string; // 綠界特店交易編號 / 交易序號
  refundedAt?: number; // 退款時間戳記
  note?: string; // 管理員人工補單備註
}

// 系統管理操作稽核日誌
export type AuditAction =
  | 'user_create'
  | 'user_update'
  | 'user_suspend'
  | 'user_activate'
  | 'password_reset'
  | 'order_create_manual'
  | 'order_refund'
  | 'order_status_change'
  | 'order_amount_update'
  | 'invoice_status_change'
  | 'invoice_update_data'
  | 'payment_config_update';

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: AuditAction;
  targetId: string; // 目標會員 ID、訂單編號或發票編號
  targetType: 'user' | 'order' | 'invoice' | 'system';
  details: string; // 異動詳情摘要
  ip?: string;
  timestamp: number;
}

// 綠界 ECPay 金流運作模式與特店參數配置
export interface PaymentConfig {
  mode: 'sandbox' | 'production'; // 測試沙盒環境 vs 正式營運環境
  merchantId: string; // 商店代號
  hashKey: string; // HashKey
  hashIV: string; // HashIV
  updatedAt: number; // 最後更新時間戳記
}

// 綠界金流伺服器端 Webhook 回調除錯日誌
export interface WebhookLog {
  id: string;
  merchantTradeNo: string; // 特店交易編號
  tradeNo?: string; // 綠界交易序號
  rtnCode: string; // 綠界狀態碼 (1 為成功)
  rtnMsg?: string; // 綠界回傳訊息
  tradeAmt: number; // 交易金額
  paymentDate?: string; // 付款時間
  timestamp: number; // 接收回調時間戳記
  rawParams?: Record<string, string>; // 原始回調參數
}

export interface SystemStats {
  totalCalculations: number;
  todayCalculations: number;
  lastResetDate: string; // YYYY-MM-DD
  totalRevenue: number; // 累計總營收 (NT$)
  monthlyRevenue: number; // 本月累計營收 (NT$)
  conversionRate: number; // 付費轉換率 (%)
  totalUsers: number;
  todayNewUsers: number;
  userGrowthRate: number; // 今日新增成長率 (%)
  pendingInvoicesCount: number; // 待開立紙本發票數量
  readyToShipInvoicesCount: number; // 待寄出紙本發票數量
  dailyRevenue7Days: Array<{ date: string; amount: number; count: number }>;
  tierSalesStats: {
    level2: { count: number; revenue: number };
    level3: { count: number; revenue: number };
    synastry_addon: { count: number; revenue: number };
  };
  matchTypeStats: {
    loveMarriage: number; // 合婚戀愛
    careerPartner: number; // 職場事業
    familyFriend: number; // 家人朋友
  };
  popularSigns: Record<string, number>;
}
