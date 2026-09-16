/**
 * 企業與稅法驗證工具庫 (lib/validators.ts)
 * 包含：
 * 1. 台灣公司統一編號 8 碼除以 10 邏輯驗證
 * 2. 聯絡電話格式驗證 (手機 / 市話分機)
 * 3. 環境部氣候變遷署七大行業分類定義
 */

// 所屬行業分類選項（整合氣候署七大行業規範、學校研究單位與公家機關）
export const CLIMATE_CHANGE_INDUSTRIES = [
  '製造業',
  '能源業',
  '營建/營造業',
  '交通運輸業',
  '農業/林業',
  '服務業',
  '學校或研究單位',
  '公家機關',
  '其他',
] as const;

export type ClimateChangeIndustry = (typeof CLIMATE_CHANGE_INDUSTRIES)[number];

/**
 * 台灣統一編號 8 碼標準除以 10 驗證演算法
 * 依財政部營業人統一編號邏輯規範：
 * 1. 檢查是否為 8 位數字
 * 2. 乘數分別為 [1, 2, 1, 2, 1, 2, 4, 1]
 * 3. 各項乘積之十位數與個位數相加
 * 4. 總和除以 10 能整除；若第七位為 7，其和加 1 亦可整除
 * 5. 特例放行：學校單位專用通用編號 8 個 0 (00000000)
 */
export function isValidTaiwanTaxId(taxId: string): boolean {
  const clean = (taxId || '').trim();
  if (!/^\d{8}$/.test(clean)) return false;

  // 學校單位通用代碼：8 個 0 放行通過
  if (clean === '00000000') return true;

  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;

  for (let i = 0; i < 8; i++) {
    const prod = parseInt(clean[i], 10) * weights[i];
    sum += Math.floor(prod / 10) + (prod % 10);
  }

  if (sum % 10 === 0) return true;

  // 財政部規範：第 7 位數若為 7，乘積 28 之個位加十位為 10，計為 1 或 0 均可
  if (clean[6] === '7' && (sum + 1) % 10 === 0) {
    return true;
  }

  return false;
}

/**
 * 台灣聯絡電話格式驗證 (支援手機 09xx-xxx-xxx 或 市話含分機 02-xxxx-xxxx #123)
 */
export function isValidTaiwanPhone(phone: string): boolean {
  const clean = (phone || '').trim().replace(/[-\s]/g, '');
  if (!clean) return false;

  // 手機格式：09 開頭共 10 碼數字
  if (/^09\d{8}$/.test(clean)) return true;

  // 市話格式：0 開頭，後續 8 至 10 碼數字（含分機）
  if (/^0\d{8,12}$/.test(clean)) return true;

  // 包含分機 # 符號
  if (/^0\d{1,2}\d{6,8}(#\d{1,6})?$/.test((phone || '').trim().replace(/\s/g, ''))) {
    return true;
  }

  return clean.length >= 8 && clean.length <= 15;
}
