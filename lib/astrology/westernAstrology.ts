/**
 * 西洋占星排盤演算法核心 (Western Astrology Engine)
 * 使用 astronomy-engine 計算十大行星黃道經度、宮位與行星相位
 */

import * as Astronomy from 'astronomy-engine';
import {
  PlanetPosition,
  HouseCusp,
  AspectData,
  WesternAstrologyChartData,
} from '@/types/astrology';

// 十二星座清單
export const ZODIAC_SIGNS = [
  { name: '牡羊座', english: 'Aries', symbol: '♈', element: '火', ruler: '火星' },
  { name: '金牛座', english: 'Taurus', symbol: '♉', element: '土', ruler: '金星' },
  { name: '雙子座', english: 'Gemini', symbol: '♊', element: '風', ruler: '水星' },
  { name: '巨蟹座', english: 'Cancer', symbol: '♋', element: '水', ruler: '月亮' },
  { name: '獅子座', english: 'Leo', symbol: '♌', element: '火', ruler: '太陽' },
  { name: '處女座', english: 'Virgo', symbol: '♍', element: '風', ruler: '水星' },
  { name: '天秤座', english: 'Libra', symbol: '♎', element: '風', ruler: '金星' },
  { name: '天蠍座', english: 'Scorpio', symbol: '♏', element: '水', ruler: '冥王星' },
  { name: '射手座', english: 'Sagittarius', symbol: '♐', element: '火', ruler: '木星' },
  { name: '摩羯座', english: 'Capricorn', symbol: '♑', element: '土', ruler: '土星' },
  { name: '水瓶座', english: 'Aquarius', symbol: '♒', element: '風', ruler: '天王星' },
  { name: '雙魚座', english: 'Pisces', symbol: '♓', element: '水', ruler: '海王星' },
];

// 行星中文對照與符號
export const PLANET_META: Record<string, { chineseName: string; symbol: string }> = {
  Sun: { chineseName: '太陽', symbol: '☉' },
  Moon: { chineseName: '月亮', symbol: '☽' },
  Mercury: { chineseName: '水星', symbol: '☿' },
  Venus: { chineseName: '金星', symbol: '♀' },
  Mars: { chineseName: '火星', symbol: '♂' },
  Jupiter: { chineseName: '木星', symbol: '♃' },
  Saturn: { chineseName: '土星', symbol: '♄' },
  Uranus: { chineseName: '天王星', symbol: '♅' },
  Neptune: { chineseName: '海王星', symbol: '♆' },
  Pluto: { chineseName: '冥王星', symbol: '♇' },
};

/**
 * 將 0~360 度的黃道經度換算為所屬星座、度與分
 */
export function getSignFromLongitude(longitude: number): {
  sign: string;
  signIndex: number;
  degreeInSign: number;
  minuteInSign: number;
} {
  const normLon = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normLon / 30);
  const remainder = normLon - signIndex * 30;
  const degreeInSign = Math.floor(remainder);
  const minuteInSign = Math.floor((remainder - degreeInSign) * 60);

  return {
    sign: ZODIAC_SIGNS[signIndex].name,
    signIndex,
    degreeInSign,
    minuteInSign,
  };
}

/**
 * 計算上升點 (Ascendant) 與天頂 (Midheaven, MC)
 */
export function calculateAngles(
  time: Astronomy.AstroTime,
  latitude: number,
  longitude: number
): {
  ascendant: { longitude: number; sign: string; degree: number };
  midheaven: { longitude: number; sign: string; degree: number };
} {
  // 格林威治平恆星時 (GMST，小時)
  const gmstHours = Astronomy.SiderealTime(time);
  // 地方平恆星時 (LST，度數 0~360)
  const ramc = (((gmstHours * 15 + longitude) % 360) + 360) % 360;

  // 黃赤交角 epsilon (約 23.439 度)
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const eps = 23.439 * rad;

  const ramcRad = ramc * rad;
  const latRad = latitude * rad;

  // 計算天頂 Midheaven (MC)
  // tan(MC) = tan(RAMC) / cos(eps)
  const mcLonRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps));
  let mcLon = (mcLonRad * deg + 360) % 360;

  // 計算上升點 Ascendant (ASC)
  // tan(ASC) = -cos(RAMC) / (sin(RAMC) * cos(eps) + tan(lat) * sin(eps))
  const yAsc = -Math.cos(ramcRad);
  const xAsc = Math.sin(ramcRad) * Math.cos(eps) + Math.tan(latRad) * Math.sin(eps);
  let ascLonRad = Math.atan2(yAsc, xAsc);
  let ascLon = (ascLonRad * deg + 360) % 360;

  const ascSign = getSignFromLongitude(ascLon);
  const mcSign = getSignFromLongitude(mcLon);

  return {
    ascendant: {
      longitude: ascLon,
      sign: ascSign.sign,
      degree: ascSign.degreeInSign,
    },
    midheaven: {
      longitude: mcLon,
      sign: mcSign.sign,
      degree: mcSign.degreeInSign,
    },
  };
}

/**
 * 計算十二宮位宮首 (Equal House 基準，以 Ascendant 為第 1 宮宮首)
 */
export function calculateHouseCusps(ascendantLongitude: number): HouseCusp[] {
  const houses: HouseCusp[] = [];
  for (let i = 0; i < 12; i++) {
    const cuspLongitude = (ascendantLongitude + i * 30) % 360;
    const signInfo = getSignFromLongitude(cuspLongitude);
    houses.push({
      houseNumber: i + 1,
      longitude: cuspLongitude,
      sign: signInfo.sign,
      degree: signInfo.degreeInSign,
    });
  }
  return houses;
}

/**
 * 判定給定行星經度落在第幾宮
 */
export function getHouseForLongitude(longitude: number, ascendantLongitude: number): number {
  const diff = ((longitude - ascendantLongitude) % 360 + 360) % 360;
  return Math.floor(diff / 30) + 1;
}

/**
 * 計算兩兩行星之間的相位 (Aspects)
 */
export function calculateAspects(planets: PlanetPosition[]): AspectData[] {
  const aspects: AspectData[] = [];
  const aspectDefs = [
    { type: 'conjunction' as const, name: '合相', angle: 0, orb: 8 },
    { type: 'sextile' as const, name: '六分相', angle: 60, orb: 6 },
    { type: 'square' as const, name: '四分相', angle: 90, orb: 7 },
    { type: 'trine' as const, name: '三分相', angle: 120, orb: 8 },
    { type: 'opposition' as const, name: '對分相', angle: 180, orb: 8 },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      let angleDiff = Math.abs(p1.longitude - p2.longitude);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;

      for (const def of aspectDefs) {
        const diffFromTarget = Math.abs(angleDiff - def.angle);
        if (diffFromTarget <= def.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspectType: def.type,
            aspectName: def.name,
            angle: angleDiff,
            orb: diffFromTarget,
          });
          break;
        }
      }
    }
  }

  return aspects;
}

/**
 * 計算西洋占星全盤資料
 * 
 * @param utcDate Date 物件 (UTC 絕對時間)
 * @param latitude 緯度
 * @param longitude 經度
 */
export function calculateWesternAstrology(
  utcDate: Date,
  latitude: number,
  longitude: number
): WesternAstrologyChartData {
  const time = Astronomy.MakeTime(utcDate);

  // 1. 計算上升點與天頂
  const { ascendant, midheaven } = calculateAngles(time, latitude, longitude);

  // 2. 計算 12 宮位
  const houses = calculateHouseCusps(ascendant.longitude);

  // 3. 計算十大行星
  const planetKeys = [
    'Sun',
    'Moon',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ] as const;

  const planets: PlanetPosition[] = [];

  for (const key of planetKeys) {
    let eclipticLon = 0;

    if (key === 'Sun') {
      const sunPos = Astronomy.SunPosition(time);
      eclipticLon = sunPos.elon;
    } else {
      const vec = Astronomy.GeoVector(key as unknown as Astronomy.Body, time, true);
      const ecl = Astronomy.Ecliptic(vec);
      eclipticLon = ecl.elon;
    }

    // 檢查是否逆行 (比較 6 小時前後之黃經變化)
    const prevTime = Astronomy.MakeTime(new Date(utcDate.getTime() - 6 * 3600 * 1000));
    let prevLon = 0;
    if (key === 'Sun') {
      prevLon = Astronomy.SunPosition(prevTime).elon;
    } else {
      const pvec = Astronomy.GeoVector(key as unknown as Astronomy.Body, prevTime, true);
      prevLon = Astronomy.Ecliptic(pvec).elon;
    }
    let speed = eclipticLon - prevLon;
    if (speed < -180) speed += 360;
    if (speed > 180) speed -= 360;
    const isRetrograde = speed < 0 && key !== 'Sun' && key !== 'Moon';

    const signInfo = getSignFromLongitude(eclipticLon);
    const houseNum = getHouseForLongitude(eclipticLon, ascendant.longitude);

    planets.push({
      name: PLANET_META[key].chineseName,
      englishName: key,
      longitude: eclipticLon,
      sign: signInfo.sign,
      signIndex: signInfo.signIndex,
      degreeInSign: signInfo.degreeInSign,
      minuteInSign: signInfo.minuteInSign,
      house: houseNum,
      isRetrograde,
    });
  }

  // 4. 計算行星相位
  const aspects = calculateAspects(planets);

  const sunPlanet = planets.find((p) => p.englishName === 'Sun');
  const moonPlanet = planets.find((p) => p.englishName === 'Moon');

  return {
    planets,
    houses,
    aspects,
    ascendant,
    midheaven,
    sunSign: sunPlanet ? sunPlanet.sign : '未知',
    moonSign: moonPlanet ? moonPlanet.sign : '未知',
    risingSign: ascendant.sign,
  };
}
