/**
 * 驗證時間與地理引擎核心演算法
 */
import { calculateSolarAndUtcTime, logTimeCalculationSummary, calculateEquationOfTime, formatEquationOfTime } from '../lib/timeUtils.js';

// 測試案例 1：台北 (1995-10-24 12:30)
console.log('=== 測試案例 1：台北標準案例 (秋季均時差最高峰期) ===');
const result1 = calculateSolarAndUtcTime('1995-10-24', '12:30', {
  name: '台北市',
  longitude: 121.5654,
  latitude: 25.0330,
  timezone: 'Asia/Taipei',
});
logTimeCalculationSummary(result1);

// 測試案例 2：子時邊界案例 (夜子時 23:45)
console.log('\n=== 測試案例 2：夜子時 (23:45) ===');
const result2 = calculateSolarAndUtcTime('2000-01-01', '23:45', {
  name: '台北市',
  longitude: 121.5654,
  latitude: 25.0330,
  timezone: 'Asia/Taipei',
});
logTimeCalculationSummary(result2);

// 測試案例 3：紐約夏令時間 (DST) 案例 (2023-07-04 14:00)
console.log('\n=== 測試案例 3：紐約夏令時間 (DST) ===');
const result3 = calculateSolarAndUtcTime('2023-07-04', '14:00', {
  name: '紐約',
  longitude: -74.0060,
  latitude: 40.7128,
  timezone: 'America/New_York',
});
logTimeCalculationSummary(result3);
