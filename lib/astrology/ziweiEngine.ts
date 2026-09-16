/**
 * 紫微斗數排盤演算法核心 (Ziwei Dou Shu Engine)
 * 依據真太陽時農曆轉換，排定十二宮位、十四主星、四化星、吉煞星與五行局
 */

import { Solar } from 'lunar-javascript';
import { ZiweiChartData, ZiweiPalace } from '@/types/astrology';

// 十二地支順序 (0=子, 1=丑, 2=寅, 3=卯, 4=辰, 5=巳, 6=午, 7=未, 8=申, 9=酉, 10=戌, 11=亥)
export const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 十二宮位名稱固定順序
export const PALACE_NAMES = [
  '命宮', '兄弟', '夫妻', '子女',
  '財帛', '疾厄', '遷移', '僕役',
  '官祿', '田宅', '福德', '父母',
];

// 五虎遁年起月訣：根據年干求寅宮天干
// 甲己之年丙作首，乙庚之歲戊為頭，丙辛之歲尋庚上，丁壬壬位順行流，若言戊癸何方發，甲寅之上好追求
const TIGER_ESCAPE_FIRST_STEM: Record<string, number> = {
  甲: 2, 己: 2, // 丙 (2)
  乙: 4, 庚: 4, // 戊 (4)
  丙: 6, 辛: 6, // 庚 (6)
  丁: 8, 壬: 8, // 壬 (8)
  戊: 0, 癸: 0, // 甲 (0)
};

// 四化星配置表：[祿, 權, 科, 忌]
const MUTAGEN_MAP: Record<string, { lu: string; quan: string; ke: string; ji: string }> = {
  甲: { lu: '廉貞', quan: '破軍', ke: '武曲', ji: '太陽' },
  乙: { lu: '天機', quan: '天梁', ke: '紫微', ji: '太陰' },
  丙: { lu: '天同', quan: '天機', ke: '文昌', ji: '廉貞' },
  丁: { lu: '太陰', quan: '天同', ke: '天機', ji: '巨門' },
  戊: { lu: '貪狼', quan: '太陰', ke: '右弼', ji: '天機' },
  己: { lu: '武曲', quan: '貪狼', ke: '天梁', ji: '文曲' },
  庚: { lu: '太陽', quan: '武曲', ke: '太陰', ji: '天同' },
  辛: { lu: '巨門', quan: '太陽', ke: '文曲', ji: '文昌' },
  壬: { lu: '天梁', quan: '紫微', ke: '左輔', ji: '武曲' },
  癸: { lu: '破軍', quan: '巨門', ke: '太陰', ji: '貪狼' },
};

/**
 * 計算五行局數 (水二局、木三局、金四局、土五局、火六局)
 */
function getBureauNumber(stem: string, branch: string): { name: string; number: number } {
  // 六十甲子納音五行簡易速算訣
  const stemIdx = Math.floor(HEAVENLY_STEMS.indexOf(stem) / 2); // 0, 1, 2, 3, 4
  const branchIdx = Math.floor(EARTHLY_BRANCHES.indexOf(branch) / 2); // 0, 1, 2, 3, 4, 5
  
  // 納音五行數值對應：1木, 2金, 3水, 4火, 5土
  const lookup = [
    [2, 3, 1], // 甲乙: 子丑午未金(4), 寅卯申酉水(2), 辰巳戌亥火(6)
    [4, 5, 2], // 丙丁
    [1, 2, 4], // 戊己
    [3, 4, 5], // 庚辛
    [5, 1, 3], // 壬癸
  ];

  const mapTable: Record<number, { name: string; number: number }> = {
    1: { name: '木三局', number: 3 },
    2: { name: '金四局', number: 4 },
    3: { name: '水二局', number: 2 },
    4: { name: '火六局', number: 6 },
    5: { name: '土五局', number: 5 },
  };

  const groupIdx = branchIdx % 3;
  const val = lookup[stemIdx]?.[groupIdx] || 3;
  return mapTable[val] || { name: '水二局', number: 2 };
}

/**
 * 依據農曆日數與五行局數定紫微星位置 (0=子, 1=丑, ... 11=亥)
 */
function getZiweiIndex(day: number, bureauNum: number): number {
  let quotient = Math.floor(day / bureauNum);
  let remainder = day % bureauNum;

  let pos = 0;
  if (remainder === 0) {
    pos = 2 + quotient - 1; // 寅宮(2) 起算商數
  } else {
    const addCount = bureauNum - remainder;
    quotient = Math.floor((day + addCount) / bureauNum);
    if (addCount % 2 === 1) {
      pos = 2 + quotient - 1 - addCount;
    } else {
      pos = 2 + quotient - 1 + addCount;
    }
  }

  return ((pos % 12) + 12) % 12;
}

/**
 * 依據真太陽時計算紫微斗數排盤資料
 */
export function calculateZiweiChart(
  trueSolarDateStr: string,
  trueSolarTimeStr: string,
  gender: 'male' | 'female'
): ZiweiChartData {
  const [year, month, day] = trueSolarDateStr.split('-').map((v) => parseInt(v, 10));
  const [hour, minute, second] = trueSolarTimeStr.split(':').map((v) => parseInt(v, 10));

  const solar = Solar.fromYmdHms(year, month, day, hour, minute, second || 0);
  const lunar = solar.getLunar();

  const lunarYearGan = lunar.getYearGan();
  const lunarMonth = Math.abs(lunar.getMonth()); // 農曆月份 1~12
  const lunarDay = lunar.getDay(); // 農曆日 1~30

  // 生時地支索引 (子=0, 丑=1, ... 亥=11)
  const hourBranchIdx = Math.floor(((hour * 60 + minute + 60) % 1440) / 120);

  // 1. 安命宮與身宮
  // 寅宮(2) 起正月，順數至生月，再逆數至生時 => 命宮
  // 寅宮(2) 起正月，順數至生月，再順數至生時 => 身宮
  const mingIndex = (((2 + (lunarMonth - 1) - hourBranchIdx) % 12) + 12) % 12;
  const shenIndex = (((2 + (lunarMonth - 1) + hourBranchIdx) % 12) + 12) % 12;

  // 2. 五虎遁年起月，求 12 宮位天干 (從寅宮=2開始依序排天干)
  const firstStemIdx = TIGER_ESCAPE_FIRST_STEM[lunarYearGan] ?? 0;
  const palaceStems: string[] = new Array(12);
  for (let i = 0; i < 12; i++) {
    const branchIdx = (2 + i) % 12; // 寅, 卯, 辰...
    const stemIdx = (firstStemIdx + i) % 10;
    palaceStems[branchIdx] = HEAVENLY_STEMS[stemIdx];
  }

  // 3. 計算五行局
  const mingStem = palaceStems[mingIndex];
  const mingBranch = EARTHLY_BRANCHES[mingIndex];
  const bureau = getBureauNumber(mingStem, mingBranch);

  // 4. 定紫微星與天府星
  const ziweiIdx = getZiweiIndex(lunarDay, bureau.number);
  // 天府星與紫微星相對應於寅(2)-申(8)軸線：天府 index = (16 - ziweiIdx) % 12
  const tianfuIdx = (((16 - ziweiIdx) % 12) + 12) % 12;

  // 5. 初始化 12 宮位結構
  const palaces: ZiweiPalace[] = EARTHLY_BRANCHES.map((branch, idx) => {
    // 宮位名稱推算：命宮為 0，逆時針排列 PALACE_NAMES
    // diff = (mingIndex - idx)
    const nameOffset = (((mingIndex - idx) % 12) + 12) % 12;
    const name = PALACE_NAMES[nameOffset];

    // 大限年齡推算 (陽男陰女順行，陰男陽女逆行)
    const isYangYear = ['甲', '丙', '戊', '庚', '壬'].includes(lunarYearGan);
    const isForward = (isYangYear && gender === 'male') || (!isYangYear && gender === 'female');
    const orderOffset = isForward ? (idx - mingIndex + 12) % 12 : (mingIndex - idx + 12) % 12;
    const startAge = bureau.number + orderOffset * 10;
    const endAge = startAge + 9;

    return {
      index: idx,
      earthlyBranch: branch,
      heavenlyStem: palaceStems[idx],
      name,
      isBodyPalace: idx === shenIndex,
      majorStars: [],
      minorStars: [],
      ages: `${startAge}-${endAge}`,
    };
  });

  // 6. 安十四主星
  // 紫微星系 (逆時針)：紫微、天機、(隔一)、太陽、武曲、天同、(隔二)、廉貞
  const ziweiOffsets = [
    { name: '紫微', offset: 0 },
    { name: '天機', offset: -1 },
    { name: '太陽', offset: -3 },
    { name: '武曲', offset: -4 },
    { name: '天同', offset: -5 },
    { name: '廉貞', offset: -8 },
  ];

  ziweiOffsets.forEach((item) => {
    const pIdx = (((ziweiIdx + item.offset) % 12) + 12) % 12;
    palaces[pIdx].majorStars.push({ name: item.name, brightness: '廟' });
  });

  // 天府星系 (順時針)：天府、太陰、貪狼、巨門、天相、天梁、七殺、(隔三)、破軍
  const tianfuOffsets = [
    { name: '天府', offset: 0 },
    { name: '太陰', offset: 1 },
    { name: '貪狼', offset: 2 },
    { name: '巨門', offset: 3 },
    { name: '天相', offset: 4 },
    { name: '天梁', offset: 5 },
    { name: '七殺', offset: 6 },
    { name: '破軍', offset: 10 },
  ];

  tianfuOffsets.forEach((item) => {
    const pIdx = (((tianfuIdx + item.offset) % 12) + 12) % 12;
    palaces[pIdx].majorStars.push({ name: item.name, brightness: '旺' });
  });

  // 7. 安四化星 (祿、權、科、忌)
  const mutagen = MUTAGEN_MAP[lunarYearGan] || MUTAGEN_MAP['甲'];
  palaces.forEach((palace) => {
    palace.majorStars.forEach((star) => {
      if (star.name === mutagen.lu) star.mutagen = '祿';
      if (star.name === mutagen.quan) star.mutagen = '權';
      if (star.name === mutagen.ke) star.mutagen = '科';
      if (star.name === mutagen.ji) star.mutagen = '忌';
    });
  });

  // 8. 安重要吉星與輔星 (文昌、文曲、左輔、右弼、天魁、天鉞)
  // 文昌：戌宮(10) 起子時逆數；文曲：辰宮(4) 起子時順數
  const wenchangIdx = (((10 - hourBranchIdx) % 12) + 12) % 12;
  const wenquIdx = (((4 + hourBranchIdx) % 12) + 12) % 12;
  palaces[wenchangIdx].minorStars.push('文昌');
  palaces[wenquIdx].minorStars.push('文曲');

  // 左輔：辰宮(4) 起正月順數；右弼：戌宮(10) 起正月逆數
  const zuofuIdx = (((4 + (lunarMonth - 1)) % 12) + 12) % 12;
  const youbiIdx = (((10 - (lunarMonth - 1)) % 12) + 12) % 12;
  palaces[zuofuIdx].minorStars.push('左輔');
  palaces[youbiIdx].minorStars.push('右弼');

  // 9. 命主星與身主星
  const lifeMasterMap: Record<string, string> = {
    子: '貪狼', 丑: '巨門', 寅: '祿存', 卯: '文曲',
    辰: '廉貞', 巳: '武曲', 午: '破軍', 未: '武曲',
    申: '廉貞', 酉: '文曲', 戌: '祿存', 亥: '巨門',
  };
  const bodyMasterMap: Record<string, string> = {
    子: '火星', 丑: '天相', 寅: '天梁', 卯: '天同',
    辰: '文昌', 巳: '天機', 午: '火星', 未: '天相',
    申: '天梁', 酉: '天同', 戌: '文昌', 亥: '天機',
  };

  const lifeMasterStar = lifeMasterMap[mingBranch] || '貪狼';
  const bodyMasterStar = bodyMasterMap[EARTHLY_BRANCHES[hourBranchIdx]] || '天相';

  return {
    lunarDateStr: `農曆 ${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}日 ${EARTHLY_BRANCHES[hourBranchIdx]}時`,
    fiveElementsBureau: bureau.name,
    lifeMasterStar,
    bodyMasterStar,
    palaces,
    mingPalaceIndex: mingIndex,
    shenPalaceIndex: shenIndex,
  };
}
