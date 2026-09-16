/**
 * 綠界科技 (ECPay) 金流整合工具庫
 * 提供特店參數設定、SHA256 CheckMacValue 檢查碼生成與回調校驗
 */
import crypto from 'crypto';
import { getPaymentConfig } from './db';

// 取得當前即時綠界金流配置 (動態支援後台模式切換與金鑰維護)
export function getActiveEcpayConfig() {
  const cfg = getPaymentConfig();
  const apiUrl =
    cfg.mode === 'production'
      ? 'https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5'
      : 'https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5';

  return {
    Mode: cfg.mode,
    MerchantID: cfg.merchantId || '3456197',
    HashKey: cfg.hashKey || 'RttngL4823khpLRX',
    HashIV: cfg.hashIV || 'skQe3yMoSOuyMxRO',
    ApiUrl: apiUrl,
  };
}

// 保持全相容 Proxy 物件，任何讀取 ECPAY_CONFIG.* 均調用最新配置
export const ECPAY_CONFIG = new Proxy(
  {},
  {
    get(_target, prop: string) {
      const active = getActiveEcpayConfig();
      return (active as any)[prop];
    },
  }
) as {
  Mode: 'sandbox' | 'production';
  MerchantID: string;
  HashKey: string;
  HashIV: string;
  ApiUrl: string;
};

/**
 * 綠界特製 .NET 相容 URL 編碼
 * 依綠界規格：先 encodeURIComponent，再調整特定保留字元與空格，最後轉為小寫
 */
export function ecpayUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%2d/gi, '-')
    .replace(/%5f/gi, '_')
    .replace(/%2e/gi, '.')
    .replace(/%21/gi, '!')
    .replace(/%2a/gi, '*')
    .replace(/%28/gi, '(')
    .replace(/%29/gi, ')')
    .toLowerCase();
}

/**
 * 計算綠界 SHA256 CheckMacValue
 * 1. 字典序排列參數 (A-Z)
 * 2. 串接 HashKey 與 HashIV
 * 3. 執行特製 URL 編碼
 * 4. SHA256 雜湊並轉為大寫
 */
export function generateCheckMacValue(
  params: Record<string, string | number>,
  hashKey: string = ECPAY_CONFIG.HashKey,
  hashIV: string = ECPAY_CONFIG.HashIV
): string {
  // 1. 排除 CheckMacValue 並依參數鍵名做 ASCII 升冪排序
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== 'CheckMacValue')
    .sort((a, b) => a.localeCompare(b));

  // 2. 拼接字串
  const paramString = sortedKeys
    .map((k) => `${k}=${params[k]}`)
    .join('&');

  // 3. 首尾串接 HashKey 與 HashIV
  const raw = `HashKey=${hashKey}&${paramString}&HashIV=${hashIV}`;

  // 4. 特製 URL Encode
  const encoded = ecpayUrlEncode(raw);

  // 5. SHA256 雜湊
  const sha256 = crypto.createHash('sha256').update(encoded).digest('hex');

  // 6. 轉為大寫
  return sha256.toUpperCase();
}

/**
 * 驗證綠界回調通知之 CheckMacValue 是否合法
 */
export function verifyCheckMacValue(
  params: Record<string, any>,
  hashKey: string = ECPAY_CONFIG.HashKey,
  hashIV: string = ECPAY_CONFIG.HashIV
): boolean {
  if (!params.CheckMacValue) return false;
  const calculated = generateCheckMacValue(params, hashKey, hashIV);
  return calculated === params.CheckMacValue;
}

/**
 * 產生當前時間符合綠界格式的字串 (YYYY/MM/DD HH:mm:ss)
 */
export function getEcpayTradeDate(date: Date = new Date()): string {
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}/${m}/${d} ${h}:${min}:${s}`;
}
