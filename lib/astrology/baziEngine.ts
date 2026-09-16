/**
 * 八字命理排盤演算法核心 (Bazi Engine)
 * 以真太陽時 (True Solar Time) 進行四柱、藏干、十神與五行力量精算
 */

import { Solar } from 'lunar-javascript';
import { BaziChartData, BaziPillar } from '@/types/astrology';

// 天干五行映射
const STEM_ELEMENT: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

// 地支五行映射
const BRANCH_ELEMENT: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 簡繁字詞轉換字典（確保 100% 繁體中文）
const SIMPLIFIED_TO_TRADITIONAL: Record<string, string> = {
  '山头火': '山頭火', '涧下水': '澗下水', '白蜡金': '白蠟金', '杨柳木': '楊柳木',
  '泉中水': '泉中水', '屋上土': '屋上土', '霹雳火': '霹靂火', '松柏木': '松柏木',
  '长流水': '長流水', '砂石金': '砂石金', '山下火': '山下火', '平地木': '平地木',
  '壁上土': '壁上土', '金箔金': '金箔金', '覆灯火': '覆燈火', '天河水': '天河水',
  '大驿土': '大驛土', '钗钏金': '釵釧金', '桑柘木': '桑柘木', '大溪水': '大溪水',
  '沙中土': '沙中土', '天上火': '天上火', '石榴木': '石榴木', '大海水': '大海水',
  '海中金': '海中金', '炉中火': '爐中火', '大林木': '大林木', '路旁土': '路旁土',
  '剑锋金': '劍鋒金', '城头土': '城頭土',
  '霜降': '霜降', '立冬': '立冬', '小雪': '小雪', '大雪': '大雪', '冬至': '冬至',
  '小寒': '小寒', '大寒': '大寒', '立春': '立春', '雨水': '雨水', '驚蟄': '驚蟄',
  '春分': '春分', '清明': '清明', '穀雨': '穀雨', '立夏': '立夏', '小滿': '小滿',
  '芒種': '芒種', '夏至': '夏至', '小暑': '小暑', '大暑': '大暑', '立秋': '立秋',
  '處暑': '處暑', '白露': '白露', '秋分': '秋分', '寒露': '寒露',
  '比肩': '比肩', '劫财': '劫財', '食神': '食神', '伤官': '傷官',
  '偏财': '偏財', '正财': '正財', '七杀': '七殺', '正官': '正官',
  '偏印': '偏印', '正印': '正印', '日主': '日主',
};

function toTraditional(str: string): string {
  if (!str) return '';
  return SIMPLIFIED_TO_TRADITIONAL[str] || str;
}

/**
 * 依據真太陽時計算八字四柱排盤資料
 * 
 * @param trueSolarDateStr 格式: YYYY-MM-DD
 * @param trueSolarTimeStr 格式: HH:mm:ss
 */
export function calculateBaziChart(
  trueSolarDateStr: string,
  trueSolarTimeStr: string
): BaziChartData {
  const [year, month, day] = trueSolarDateStr.split('-').map((v) => parseInt(v, 10));
  const [hour, minute, second] = trueSolarTimeStr.split(':').map((v) => parseInt(v, 10));

  // 透過真太陽時建構 Solar 物件
  const solar = Solar.fromYmdHms(year, month, day, hour, minute, second || 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const dayMaster = eightChar.getDayGan();
  const dayMasterElement = STEM_ELEMENT[dayMaster] || '土';

  // 輔助函式：建構柱物件
  const createPillar = (
    stem: string,
    branch: string,
    tenGodRaw: string,
    nayinRaw: string,
    hiddenStems: string[]
  ): BaziPillar => {
    return {
      heavenlyStem: stem,
      earthlyBranch: branch,
      stemFiveElement: STEM_ELEMENT[stem] || '木',
      branchFiveElement: BRANCH_ELEMENT[branch] || '土',
      hiddenStems,
      tenGod: toTraditional(tenGodRaw),
      nayin: toTraditional(nayinRaw),
    };
  };

  const yearPillar = createPillar(
    eightChar.getYearGan(),
    eightChar.getYearZhi(),
    eightChar.getYearShiShenGan(),
    eightChar.getYearNaYin(),
    eightChar.getYearHideGan()
  );

  const monthPillar = createPillar(
    eightChar.getMonthGan(),
    eightChar.getMonthZhi(),
    eightChar.getMonthShiShenGan(),
    eightChar.getMonthNaYin(),
    eightChar.getMonthHideGan()
  );

  const dayPillar = createPillar(
    eightChar.getDayGan(),
    eightChar.getDayZhi(),
    '日主',
    eightChar.getDayNaYin(),
    eightChar.getDayHideGan()
  );

  const hourPillar = createPillar(
    eightChar.getTimeGan(),
    eightChar.getTimeZhi(),
    eightChar.getTimeShiShenGan(),
    eightChar.getTimeNaYin(),
    eightChar.getTimeHideGan()
  );

  // 計算五行強度分數
  const elementScores = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const allStemsAndBranches = [
    yearPillar.heavenlyStem,
    yearPillar.earthlyBranch,
    monthPillar.heavenlyStem,
    monthPillar.earthlyBranch,
    dayPillar.heavenlyStem,
    dayPillar.earthlyBranch,
    hourPillar.heavenlyStem,
    hourPillar.earthlyBranch,
  ];

  allStemsAndBranches.forEach((item, idx) => {
    // 月支權重加重（佔 25% 提綱權重）
    const weight = idx === 3 ? 2.5 : 1.0;
    const elem = STEM_ELEMENT[item] || BRANCH_ELEMENT[item];
    if (elem === '木') elementScores.wood += weight;
    if (elem === '火') elementScores.fire += weight;
    if (elem === '土') elementScores.earth += weight;
    if (elem === '金') elementScores.metal += weight;
    if (elem === '水') elementScores.water += weight;
  });

  // 計算藏干微弱分數
  [yearPillar, monthPillar, dayPillar, hourPillar].forEach((pillar) => {
    pillar.hiddenStems.forEach((hStem) => {
      const elem = STEM_ELEMENT[hStem];
      if (elem === '木') elementScores.wood += 0.3;
      if (elem === '火') elementScores.fire += 0.3;
      if (elem === '土') elementScores.earth += 0.3;
      if (elem === '金') elementScores.metal += 0.3;
      if (elem === '水') elementScores.water += 0.3;
    });
  });

  // 取得節氣
  let solarTerm = '無';
  try {
    const prevJieQi = lunar.getPrevJieQi();
    solarTerm = toTraditional(prevJieQi ? prevJieQi.getName() : '');
  } catch {
    solarTerm = '中氣';
  }

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement,
    elementScores,
    solarTerm,
  };
}
