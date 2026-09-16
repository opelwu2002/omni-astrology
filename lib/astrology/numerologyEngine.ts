/**
 * 生命靈數演算法核心 (Numerology Engine)
 * 計算出生年月日命運數、卓越數、生日數、九宮格與八大連線
 */

import { NumerologyChartData } from '@/types/astrology';

// 生命靈數標準連線定義
export const NUMEROLOGY_LINES = [
  { name: '1-2-3 藝術美學線', numbers: [1, 2, 3], description: '極具美感品味、藝術直覺與創意表達天賦。' },
  { name: '4-5-6 秩序組織線', numbers: [4, 5, 6], description: '擅長條理規劃、專案執行與架構建構能力。' },
  { name: '7-8-9 權力領導線', numbers: [7, 8, 9], description: '具備宏觀願景、強大事業野心與卓越領導決策力。' },
  { name: '1-4-7 物質實踐線', numbers: [1, 4, 7], description: '腳踏實地、注重現實成效與扎實行動力。' },
  { name: '2-5-8 情感敏銳線', numbers: [2, 5, 8], description: '同理心強大、人際直覺敏銳、善於體察他人心緒。' },
  { name: '3-6-9 智慧靈性線', numbers: [3, 6, 9], description: '思維敏捷、充滿哲思遠見與靈性領悟力。' },
  { name: '1-5-9 意志成功線', numbers: [1, 5, 9], description: '目標堅定不移、執行力旺盛、百折不撓成就大業。' },
  { name: '3-5-7 直覺同理線', numbers: [3, 5, 7], description: '第六感敏銳、善於安慰治癒、擁有跨維度靈感。' },
];

/**
 * 數值折疊函數：將數字各位數相加直至個位數（卓越數 11, 22, 33 亦可判定）
 */
export function reduceToSingleDigit(num: number, allowMaster: boolean = false): number {
  if (allowMaster && (num === 11 || num === 22 || num === 33)) {
    return num;
  }
  while (num > 9) {
    if (allowMaster && (num === 11 || num === 22 || num === 33)) {
      return num;
    }
    num = String(num)
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  }
  return num;
}

/**
 * 計算生命靈數資料
 * 
 * @param birthDateStr 格式: YYYY-MM-DD
 */
export function calculateNumerology(birthDateStr: string): NumerologyChartData {
  const digits = birthDateStr.replace(/\D/g, '').split('').map((d) => parseInt(d, 10));

  // 1. 九宮格統計 (1~9 出現次數)
  const gridCounts: Record<number, number> = {
    1: 0, 2: 0, 3: 0,
    4: 0, 5: 0, 6: 0,
    7: 0, 8: 0, 9: 0,
  };

  digits.forEach((digit) => {
    if (digit >= 1 && digit <= 9) {
      gridCounts[digit] = (gridCounts[digit] || 0) + 1;
    }
  });

  // 2. 命運數 (Destiny Number)
  const totalSum = digits.reduce((acc, curr) => acc + curr, 0);
  const destinyNumber = reduceToSingleDigit(totalSum, true);

  // 3. 生日數 (Birthday Number)
  const dayPart = parseInt(birthDateStr.split('-')[2], 10) || 1;
  const birthdayNumber = reduceToSingleDigit(dayPart, false);

  // 4. 態度數 (月+日)
  const monthPart = parseInt(birthDateStr.split('-')[1], 10) || 1;
  const attitudeNumber = reduceToSingleDigit(monthPart + dayPart, false);

  // 5. 連線判定 (八大連線)
  const lines = NUMEROLOGY_LINES.map((def) => {
    const active = def.numbers.every((num) => (gridCounts[num] || 0) > 0);
    return {
      name: def.name,
      numbers: def.numbers,
      active,
      description: def.description,
    };
  });

  return {
    destinyNumber,
    birthdayNumber,
    attitudeNumber,
    gridCounts,
    lines,
  };
}
