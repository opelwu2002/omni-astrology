/**
 * 時間與地理引擎 (Time & Geo Engine)
 * 負責將輸入之當地時間換算為：
 * 1. 絕對時間 GMT/UTC（西洋占星核心依據）
 * 2. 地方平太陽時 (Local Mean Time, LMT)
 * 3. 天文均時差 (Equation of Time, EoT)
 * 4. 真太陽時 (True Solar Time, TST)（八字與紫微斗數核心依據）
 */

import { GeoLocation, TimeCalculationResult } from '@/types/profile';

/**
 * 計算指定年份中該日期是第幾天 (Day of Year, 1-366)
 */
export function getDayOfYear(year: number, month: number, day: number): number {
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let dayOfYear = day;
  for (let i = 0; i < month - 1; i++) {
    dayOfYear += daysInMonths[i];
  }
  return dayOfYear;
}

/**
 * 依據 Spencer (1971) 天文演算法精準計算太陽均時差 (Equation of Time, EoT)
 * 單位：分鐘 (含正負符號)
 * 
 * @param year 年份
 * @param month 月份 (1-12)
 * @param day 日期 (1-31)
 * @param hour 小時 (0-23)
 * @returns 均時差（分鐘）
 */
export function calculateEquationOfTime(
  year: number,
  month: number,
  day: number,
  hour: number = 12
): number {
  const dayOfYear = getDayOfYear(year, month, day);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDays = isLeap ? 366 : 365;

  // 計算日角 gamma（弧度）
  const gamma = (2 * Math.PI / totalDays) * (dayOfYear - 1 + (hour - 12) / 24);

  // NOAA 採用之 Spencer 傅立葉級數公式
  const eotMinutes = 229.18 * (
    0.000075 +
    0.001868 * Math.cos(gamma) -
    0.032077 * Math.sin(gamma) -
    0.014615 * Math.cos(2 * gamma) -
    0.040849 * Math.sin(2 * gamma)
  );

  return eotMinutes;
}

/**
 * 格式化均時差為易讀字串，例：+03分21秒 或 -14分05秒
 */
export function formatEquationOfTime(eotMinutes: number): string {
  const sign = eotMinutes >= 0 ? '+' : '-';
  const absTotalSeconds = Math.round(Math.abs(eotMinutes) * 60);
  const minutes = Math.floor(absTotalSeconds / 60);
  const seconds = absTotalSeconds % 60;
  return `${sign}${String(minutes).padStart(2, '0')}分${String(seconds).padStart(2, '0')}秒`;
}

/**
 * 格式化時間戳為 YYYY-MM-DD HH:mm:ss 字串 (UTC 或本地)
 */
export function formatDateTime(date: Date): string {
  const Y = date.getFullYear();
  const M = String(date.getMonth() + 1).padStart(2, '0');
  const D = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/**
 * 依據時分判斷地支時辰與子時類別
 */
export function getChineseHourBranch(hours: number, minutes: number): {
  branch: string;
  isEarlyZi: boolean;
  isLateZi: boolean;
} {
  // 將時間轉換為當日總分鐘數
  const totalMinutes = hours * 60 + minutes;

  // 23:00 - 24:00 (1380 - 1440 分) 為夜子時（晚子時）
  if (totalMinutes >= 1380) {
    return { branch: '子', isEarlyZi: false, isLateZi: true };
  }
  // 00:00 - 01:00 (0 - 60 分) 為早子時
  if (totalMinutes < 60) {
    return { branch: '子', isEarlyZi: true, isLateZi: false };
  }

  // 其他時辰以每兩小時為一個時辰 (01:00起)
  // 01:00-02:59 丑(1), 03:00-04:59 寅(2)...
  const branches = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const branchIndex = Math.floor((totalMinutes - 60) / 120);
  const branch = branches[Math.min(Math.max(0, branchIndex), branches.length - 1)];

  return { branch, isEarlyZi: false, isLateZi: false };
}

/**
 * 解析特定時區在特定本地時間的精確 UTC 時間戳與 DST 狀態
 */
export function getUtcTimestampFromLocal(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): { utcTimestamp: number; timezoneOffsetHours: number; isDST: boolean } {
  // 建立一個 UTC 猜測值
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute, 0);

  // 利用 Intl.DateTimeFormat 反推時區實際 offset
  const getOffsetAt = (timeMs: number): number => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hourCycle: 'h23',
    });

    const parts = formatter.formatToParts(new Date(timeMs));
    const findPart = (type: string) => {
      const val = parts.find((p) => p.type === type)?.value;
      return val ? parseInt(val, 10) : 0;
    };

    const targetYear = findPart('year');
    const targetMonth = findPart('month');
    const targetDay = findPart('day');
    const targetHour = findPart('hour');
    const targetMinute = findPart('minute');
    const targetSecond = findPart('second');

    const asUtcTime = Date.UTC(
      targetYear,
      targetMonth - 1,
      targetDay,
      targetHour,
      targetMinute,
      targetSecond
    );

    // 回傳 (時區時間 - UTC 時間) 的毫秒數
    return asUtcTime - timeMs;
  };

  // 第一次猜測與校準
  let offsetMs = getOffsetAt(naiveUtc);
  let preciseUtcMs = naiveUtc - offsetMs;

  // 再次校準以防 DST 邊界臨界點
  const correctedOffsetMs = getOffsetAt(preciseUtcMs);
  if (correctedOffsetMs !== offsetMs) {
    offsetMs = correctedOffsetMs;
    preciseUtcMs = naiveUtc - offsetMs;
  }

  const timezoneOffsetHours = offsetMs / (1000 * 60 * 60);

  // 判斷該時區在該年是否有實施 DST，比對冬令（通常以1月15日）與夏令（通常以7月15日）
  const janOffset = getOffsetAt(Date.UTC(year, 0, 15, 12, 0, 0));
  const julOffset = getOffsetAt(Date.UTC(year, 6, 15, 12, 0, 0));
  const standardOffsetMs = Math.min(janOffset, julOffset); // 標準冬令時間通常偏移量較小（或在南半球反之）
  
  // 若當前 offset 大於該年最小 offset，代表處於夏令節約時間
  const isDST = offsetMs > standardOffsetMs && (janOffset !== julOffset);

  return {
    utcTimestamp: preciseUtcMs,
    timezoneOffsetHours,
    isDST,
  };
}

/**
 * 核心函數：計算真太陽時與所有關聯時間數值
 * 
 * @param birthDate 出生日期 YYYY-MM-DD
 * @param birthTime 出生時間 HH:mm
 * @param location 地理座標與時區
 * @returns 完整時間運算結果
 */
export function calculateSolarAndUtcTime(
  birthDate: string,
  birthTime: string,
  location: GeoLocation
): TimeCalculationResult {
  const [yearStr, monthStr, dayStr] = birthDate.split('-');
  const [hourStr, minuteStr] = birthTime.split(':');

  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // 1. 取得精準 UTC 時間戳與時區資訊
  const { utcTimestamp, timezoneOffsetHours, isDST } = getUtcTimestampFromLocal(
    year,
    month,
    day,
    hour,
    minute,
    location.timezone
  );

  const utcDate = new Date(utcTimestamp);
  const utcIsoString = utcDate.toISOString();

  // 2. 地方平太陽時 (Local Mean Time, LMT)
  // LMT = UTC + 經度 * 4 分鐘 (每度 4 分鐘 = 240,000 毫秒)
  const longitudeDiffMinutes = location.longitude * 4;
  const lmtOffsetMs = location.longitude * 4 * 60 * 1000;
  const lmtTimestamp = utcTimestamp + lmtOffsetMs;
  const lmtDate = new Date(lmtTimestamp);
  // 地方平太陽時字串以其在 UTC 的數值直接格式化呈現本地時鐘時間
  const lmtFormatted = formatDateTime(new Date(lmtTimestamp + (lmtDate.getTimezoneOffset() * 60 * 1000)));

  // 3. 均時差 (Equation of Time, EoT)
  const eotMinutes = calculateEquationOfTime(year, month, day, hour);
  const eotMs = eotMinutes * 60 * 1000;
  const equationOfTimeFormatted = formatEquationOfTime(eotMinutes);

  // 4. 真太陽時 (True Solar Time, TST)
  // TST = LMT + EoT
  const trueSolarTimestamp = lmtTimestamp + eotMs;
  // 將真太陽時轉換為標準時間呈現物件（使用純 UTC 組成以消除主機時區干擾）
  const tstUtcDate = new Date(trueSolarTimestamp);
  const tstYear = tstUtcDate.getUTCFullYear();
  const tstMonth = String(tstUtcDate.getUTCMonth() + 1).padStart(2, '0');
  const tstDay = String(tstUtcDate.getUTCDate()).padStart(2, '0');
  const tstHourNum = tstUtcDate.getUTCHours();
  const tstMinuteNum = tstUtcDate.getUTCMinutes();
  const tstSecondNum = tstUtcDate.getUTCSeconds();

  const tstHourStr = String(tstHourNum).padStart(2, '0');
  const tstMinuteStr = String(tstMinuteNum).padStart(2, '0');
  const tstSecondStr = String(tstSecondNum).padStart(2, '0');

  const trueSolarDate = `${tstYear}-${tstMonth}-${tstDay}`;
  const trueSolarTimeOnly = `${tstHourStr}:${tstMinuteStr}:${tstSecondStr}`;
  const trueSolarTime = `${trueSolarDate} ${trueSolarTimeOnly}`;

  // 5. 判定真太陽時所屬地支時辰
  const { branch: solarHourBranch, isEarlyZi: isEarlyZiHour, isLateZi: isLateZiHour } =
    getChineseHourBranch(tstHourNum, tstMinuteNum);

  return {
    inputLocalTime: `${birthDate} ${birthTime}`,
    timezoneName: location.timezone,
    timezoneOffsetHours,
    isDST,
    dstOffsetMinutes: isDST ? 60 : 0,

    utcTime: utcIsoString,
    utcTimestamp,

    longitudeDegree: location.longitude,
    longitudeDiffMinutes,
    localMeanTime: `${tstYear}-${tstMonth}-${tstDay} (LMT 參考)`,

    equationOfTimeMinutes: eotMinutes,
    equationOfTimeFormatted,

    trueSolarTime,
    trueSolarTimestamp,
    trueSolarDate,
    trueSolarTimeOnly,

    solarHourBranch,
    isEarlyZiHour,
    isLateZiHour,
  };
}

/**
 * 在 Console 印出結構化時間換算驗證表格
 */
export function logTimeCalculationSummary(result: TimeCalculationResult): void {
  console.group('%c🚀 [四合一命理] 時間與地理引擎換算報告', 'color: #8b5cf6; font-weight: bold; font-size: 14px;');
  console.log('📌 輸入本地時間 (Local):', result.inputLocalTime);
  console.log('🌐 所屬時區:', result.timezoneName, `(UTC${result.timezoneOffsetHours >= 0 ? '+' : ''}${result.timezoneOffsetHours})`);
  console.log('☀️ 日光節約時間 (DST):', result.isDST ? '是（已實施夏令時間）' : '否（標準時間）');
  console.log('⏳ 西洋占星 UTC 絕對時間:', result.utcTime);
  console.log('📐 經度時差調整:', `${result.longitudeDiffMinutes.toFixed(2)} 分鐘 (${result.longitudeDegree}° 經度)`);
  console.log('⏱️ 天文均時差 (EoT):', result.equationOfTimeFormatted, `(${result.equationOfTimeMinutes.toFixed(2)} 分)`);
  console.log('🌟 最終真太陽時 (True Solar Time):', result.trueSolarTime);
  console.log('🏮 時辰:', `${result.solarHourBranch}時`, result.isEarlyZiHour ? '（早子時）' : result.isLateZiHour ? '（夜子時）' : '');
  
  console.table({
    '項目': ['輸入時間 (Local)', '西洋占星 (UTC)', '真太陽時 (TST)', '均時差 (EoT)', '經度補正', '夏令時間 (DST)', '命理時辰'],
    '數值': [
      result.inputLocalTime,
      result.utcTime,
      result.trueSolarTime,
      result.equationOfTimeFormatted,
      `${result.longitudeDiffMinutes.toFixed(2)} 分`,
      result.isDST ? '已生效 (+1h)' : '無',
      `${result.solarHourBranch}時 ${result.isEarlyZiHour ? '(早子)' : result.isLateZiHour ? '(夜子)' : ''}`
    ]
  });
  console.groupEnd();
}
