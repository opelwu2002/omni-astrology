/**
 * 個人檔案與時間運算型別定義
 */

// 地理座標與時區資料型別
export interface GeoLocation {
  name: string;
  country?: string;
  longitude: number; // 東經為正，西經為負（度）
  latitude: number;  // 北緯為正，南緯為負（度）
  timezone: string;  // IANA 時區標識符（例如 "Asia/Taipei"）
}

// 性別選項
export type Gender = 'male' | 'female';

// 使用者個人檔案
export interface UserProfile {
  id: string;
  name: string;
  gender: Gender;
  birthDate: string; // 格式: YYYY-MM-DD
  birthTime: string; // 格式: HH:mm
  location: GeoLocation;
  createdAt: number;
  notes?: string;
}

// 時間引擎計算輸出結果
export interface TimeCalculationResult {
  // 輸入資訊
  inputLocalTime: string;         // 本地輸入時間 (YYYY-MM-DD HH:mm)
  
  // 時區與日光節約時間 (DST)
  timezoneName: string;          // 時區名稱 (例: Asia/Taipei)
  timezoneOffsetHours: number;   // 標準/當地時區偏移量 (小時)
  isDST: boolean;                // 是否處於日光節約時間 (夏令時間)
  dstOffsetMinutes: number;      // 夏令時間額外增補分鐘 (通常為 60 分鐘)

  // 核心輸出 (a) 絕對時間 UTC (西洋占星依據)
  utcTime: string;               // ISO 8601 格式 (例: 1990-05-20T06:30:00.000Z)
  utcTimestamp: number;          // UTC 毫秒時間戳

  // 中間過程：地方平太陽時 (LMT)
  longitudeDegree: number;       // 採用之經度 (度)
  longitudeDiffMinutes: number;  // 經度換算的時間差距 (分) = 經度 * 4 分鐘
  localMeanTime: string;         // 地方平太陽時字串 (YYYY-MM-DD HH:mm:ss)

  // 中間過程：均時差 (Equation of Time, EoT)
  equationOfTimeMinutes: number; // 均時差分數 (含小數，正負數)
  equationOfTimeFormatted: string; // 均時差格式化字串 (例: +03分42秒 或 -11分15秒)

  // 核心輸出 (b) 真太陽時 (八字與紫微斗數依據)
  trueSolarTime: string;         // 真太陽時字串 (YYYY-MM-DD HH:mm:ss)
  trueSolarTimestamp: number;    // 真太陽時毫秒時間戳
  trueSolarDate: string;         // 換算後真太陽時日期 (YYYY-MM-DD)
  trueSolarTimeOnly: string;     // 換算後真太陽時時間 (HH:mm:ss)

  // 命理專用輔助欄位：十二時辰對應
  solarHourBranch: string;       // 真太陽時地支時辰 (子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥)
  isEarlyZiHour: boolean;        // 是否為早子時 (00:00 - 01:00)
  isLateZiHour: boolean;         // 是否為夜子時 / 晚子時 (23:00 - 24:00)
}
