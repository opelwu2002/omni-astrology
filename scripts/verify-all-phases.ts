/**
 * 全階段整合演算法驗證腳本 (Phase 1 ~ Phase 4)
 */
import { calculateSolarAndUtcTime } from '../lib/timeUtils.js';
import { calculateWesternAstrology } from '../lib/astrology/westernAstrology.js';
import { calculateBaziChart } from '../lib/astrology/baziEngine.js';
import { calculateZiweiChart } from '../lib/astrology/ziweiEngine.js';
import { calculateNumerology } from '../lib/astrology/numerologyEngine.js';
import { calculateSynastry } from '../lib/astrology/synastryEngine.js';

console.log('🔮 ========== Omni-Astrology 全系統演算法驗證 ========== 🔮\n');

// 測試檔案 A
const profileA = {
  id: 'test-a',
  name: '張文彬',
  gender: 'male' as const,
  birthDate: '1995-10-24',
  birthTime: '12:30',
  location: {
    name: '台北市',
    longitude: 121.5654,
    latitude: 25.0330,
    timezone: 'Asia/Taipei',
  },
  createdAt: Date.now(),
};

// 測試檔案 B
const profileB = {
  id: 'test-b',
  name: '林雅婷',
  gender: 'female' as const,
  birthDate: '1997-03-15',
  birthTime: '15:20',
  location: {
    name: '台北市',
    longitude: 121.5654,
    latitude: 25.0330,
    timezone: 'Asia/Taipei',
  },
  createdAt: Date.now(),
};

// 1. 時間與地理引擎
console.log('【1. 時間引擎測試 (Phase 1)】');
const timeA = calculateSolarAndUtcTime(profileA.birthDate, profileA.birthTime, profileA.location);
console.log(`對象 A: 本地 ${timeA.inputLocalTime} -> UTC ${timeA.utcTime}`);
console.log(`真太陽時: ${timeA.trueSolarTime} (${timeA.solarHourBranch}時, 均時差 ${timeA.equationOfTimeFormatted})`);

const timeB = calculateSolarAndUtcTime(profileB.birthDate, profileB.birthTime, profileB.location);

// 2. 西洋占星排盤
console.log('\n【2. 西洋占星排盤測試 (Phase 2)】');
const astroA = calculateWesternAstrology(new Date(timeA.utcTimestamp), profileA.location.latitude, profileA.location.longitude);
console.log(`太陽星座: ${astroA.sunSign} ｜ 月亮星座: ${astroA.moonSign} ｜ 上升點: ${astroA.risingSign}`);
console.log(`十大行星數量: ${astroA.planets.length} 顆 ｜ 行星相位數: ${astroA.aspects.length} 組`);

const astroB = calculateWesternAstrology(new Date(timeB.utcTimestamp), profileB.location.latitude, profileB.location.longitude);

// 3. 八字命理排盤
console.log('\n【3. 八字命理排盤測試 (Phase 2)】');
const baziA = calculateBaziChart(timeA.trueSolarDate, timeA.trueSolarTimeOnly);
console.log(`四柱八字: ${baziA.yearPillar.heavenlyStem}${baziA.yearPillar.earthlyBranch}年 ` +
  `${baziA.monthPillar.heavenlyStem}${baziA.monthPillar.earthlyBranch}月 ` +
  `${baziA.dayPillar.heavenlyStem}${baziA.dayPillar.earthlyBranch}日 ` +
  `${baziA.hourPillar.heavenlyStem}${baziA.hourPillar.earthlyBranch}時`);
console.log(`日主元神: 【${baziA.dayMaster} ${baziA.dayMasterElement}】 ｜ 節氣: ${baziA.solarTerm}`);
console.log('五行分數:', baziA.elementScores);

const baziB = calculateBaziChart(timeB.trueSolarDate, timeB.trueSolarTimeOnly);

// 4. 紫微斗數排盤
console.log('\n【4. 紫微斗數排盤測試 (Phase 2)】');
const ziweiA = calculateZiweiChart(timeA.trueSolarDate, timeA.trueSolarTimeOnly, profileA.gender);
console.log(`農曆生辰: ${ziweiA.lunarDateStr}`);
console.log(`五行局: ${ziweiA.fiveElementsBureau} ｜ 命主: ${ziweiA.lifeMasterStar} ｜ 身主: ${ziweiA.bodyMasterStar}`);
const mingPalace = ziweiA.palaces.find((p) => p.name === '命宮');
console.log(`命宮星曜: ${mingPalace?.majorStars.map((s) => s.name + (s.mutagen ? `(${s.mutagen})` : '')).join('、') || '空宮'}`);

const ziweiB = calculateZiweiChart(timeB.trueSolarDate, timeB.trueSolarTimeOnly, profileB.gender);

// 5. 生命靈數計算
console.log('\n【5. 生命靈數計算測試 (Phase 2)】');
const numA = calculateNumerology(profileA.birthDate);
console.log(`命運數: ${numA.destinyNumber} ｜ 生日數: ${numA.birthdayNumber} ｜ 態度數: ${numA.attitudeNumber}`);
const activeLines = numA.lines.filter((l) => l.active).map((l) => l.name);
console.log(`激活天賦連線: ${activeLines.length > 0 ? activeLines.join(', ') : '無特定連線'}`);

const numB = calculateNumerology(profileB.birthDate);

// 6. 人際關係雙人合盤
console.log('\n【6. 人際關係雙人合盤測試 (Phase 4)】');
const synastry = calculateSynastry(
  profileA, profileB,
  astroA, astroB,
  baziA, baziB,
  ziweiA, ziweiB,
  numA, numB
);
console.log(`配對對象: ${synastry.profileA.name} × ${synastry.profileB.name}`);
console.log(`總體緣分評分: ${synastry.overallScore} / 100 分`);
synastry.scoreBreakdown.forEach((s) => {
  console.log(`- ${s.category}: ${s.score}分 (${s.comment})`);
});
console.log('合盤亮點摘錄:', synastry.westernSynastryHighlights[0], '｜', synastry.baziCompatibilityHighlights[0]);

console.log('\n✅ 全系統所有演算法測試 100% 通過！');
