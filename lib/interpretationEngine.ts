/**
 * 14 維度命理解析與跨體系演算引擎 (interpretationEngine.ts)
 * 嚴禁隨機亂數，完全依據真實命盤參數推導：
 * - 西洋占星：十大行星、宮位、上升/天頂、象限
 * - 八字命理：四柱干支、日主五行、十神格局、五行強弱分值、驛馬神煞
 * - 紫微斗數：十二宮位、十四主星、四化星、大限歲數、三方四正
 * - 生命靈數：畢達哥拉斯命運數、天賦數、連線能量
 */

import {
  WesternAstrologyChartData,
  BaziChartData,
  ZiweiChartData,
  NumerologyChartData,
} from '@/types/astrology';
import { FourteenDimensionsReport } from '@/types/fortune';
import { Gender } from '@/types/profile';

export interface InterpretationEngineInput {
  western: WesternAstrologyChartData;
  bazi: BaziChartData;
  ziwei: ZiweiChartData;
  numerology: NumerologyChartData;
  profile: {
    name: string;
    gender: Gender;
    birthDate: string;
    birthTime: string;
    locationName?: string;
  };
}

/**
 * 計算五行最弱與最旺之元素
 */
function getElementStatus(elementScores: Record<string, number>) {
  const entries = Object.entries(elementScores);
  let minElement = entries[0][0];
  let maxElement = entries[0][0];
  let minScore = entries[0][1];
  let maxScore = entries[0][1];

  for (const [el, score] of entries) {
    if (score < minScore) {
      minScore = score;
      minElement = el;
    }
    if (score > maxScore) {
      maxScore = score;
      maxElement = el;
    }
  }

  return {
    weakest: minElement,
    weakestScore: minScore,
    strongest: maxElement,
    strongestScore: maxScore,
  };
}

/**
 * 查找紫微斗數指定名稱的宮位
 */
function findPalace(ziwei: ZiweiChartData, palaceName: string) {
  return ziwei.palaces.find((p) => p.name === palaceName) || ziwei.palaces[0];
}

/**
 * 14 維度命理解析核心主函數
 */
export function calculateFourteenDimensionsReport(
  input: InterpretationEngineInput
): FourteenDimensionsReport {
  const { western, bazi, ziwei, numerology, profile } = input;

  const { weakest: weakElem, strongest: strongElem } = getElementStatus(bazi.elementScores);

  const mingPalace = findPalace(ziwei, '命宮');
  const careerPalace = findPalace(ziwei, '官祿');
  const wealthPalace = findPalace(ziwei, '財帛');
  const travelPalace = findPalace(ziwei, '遷移');
  const spousePalace = findPalace(ziwei, '夫妻');
  const childrenPalace = findPalace(ziwei, '子女');
  const healthPalace = findPalace(ziwei, '疾厄');
  const propertyPalace = findPalace(ziwei, '田宅');
  const parentsPalace = findPalace(ziwei, '父母');

  const mingMajorStar = mingPalace.majorStars[0]?.name || '紫微';
  const spouseMajorStar = spousePalace.majorStars[0]?.name || '天相';
  const careerMajorStar = careerPalace.majorStars[0]?.name || '天府';

  // ==========================================
  // 1. I/E 人格傾向推導 (personality_mbti)
  // ==========================================
  // 占星外向因子：上升落在陽性星座（牡羊、雙子、獅子、天秤、射手、水瓶）
  const yangSigns = ['牡羊座', '雙子座', '獅子座', '天秤座', '射手座', '水瓶座'];
  const isRisingYang = yangSigns.includes(western.risingSign);
  const isSunYang = yangSigns.includes(western.sunSign);

  // 占星太陽宮位：落在東半球（10, 11, 12, 1, 2, 3 宮）自我投射強
  const sunPlanet = western.planets.find((p) => p.name === '太陽');
  const sunHouse = sunPlanet?.house || 1;
  const isSunEastern = [10, 11, 12, 1, 2, 3].includes(sunHouse);

  // 八字五行木火比重（木火為陽主外向發散，金水為陰主內斂沉著）
  const totalElements =
    bazi.elementScores.wood +
    bazi.elementScores.fire +
    bazi.elementScores.earth +
    bazi.elementScores.metal +
    bazi.elementScores.water;
  const woodFireRatio =
    totalElements > 0
      ? (bazi.elementScores.wood + bazi.elementScores.fire) / totalElements
      : 0.5;

  // 靈數因子：1, 3, 5, 8 偏外向；2, 4, 6, 7, 9 偏內省
  const extrovertNumbers = [1, 3, 5, 8];
  const isNumExtrovert = extrovertNumbers.includes(numerology.destinyNumber);

  // 綜合加權得分 (0 ~ 100)
  let extrovertScore = Math.round(woodFireRatio * 50);
  if (isRisingYang) extrovertScore += 15;
  if (isSunYang) extrovertScore += 10;
  if (isSunEastern) extrovertScore += 15;
  if (isNumExtrovert) extrovertScore += 10;
  extrovertScore = Math.max(10, Math.min(95, extrovertScore));

  const personalityType: 'I' | 'E' = extrovertScore >= 50 ? 'E' : 'I';
  const personalityExplanation =
    personalityType === 'E'
      ? `命主太陽落入【${western.sunSign}】位於第 ${sunHouse} 宮，上升星座為【${western.risingSign}】（自帶主動社交能見度）；八字四柱木火生發之氣佔比達 ${Math.round(
          woodFireRatio * 100
        )}%，靈數【${numerology.destinyNumber}】數展現積極向外探索特質。能量以主動開創、對外表達為主要導向。`
      : `命主八字五行中金水能量深沉穩重，沉潛內省氣場顯著；太陽位居第 ${sunHouse} 宮、月亮【${western.moonSign}】深具感知敏銳度。行事深思熟慮、重視內心邊界與獨立沉澱，屬於蓄積深厚後發制人的 I 型人格。`;

  // ==========================================
  // 2. 十二生肖與星座契合 (zodiac_compatibility)
  // ==========================================
  // 八字年支三合六合生肖
  const yearBranch = bazi.yearPillar.earthlyBranch;
  const zodiacCombinations: Record<string, { bestZodiacs: string[]; reasonPart: string }> = {
    子: { bestZodiacs: ['牛', '猴', '龍'], reasonPart: '子丑六合化土、申子辰三合水局，情感相濡以沫且互為貴人' },
    丑: { bestZodiacs: ['鼠', '蛇', '雞'], reasonPart: '子丑六合、巳酉丑三合金局，價值觀務實默契，互補性極高' },
    寅: { bestZodiacs: ['豬', '馬', '狗'], reasonPart: '寅亥六合化木、寅午戌三合火局，激發彼此事業野心與生命熱情' },
    卯: { bestZodiacs: ['狗', '豬', '羊'], reasonPart: '卯戌六合化火、亥卯未三合木局，相處溫柔共振，能提供深度心理支撐' },
    辰: { bestZodiacs: ['雞', '猴', '鼠'], reasonPart: '辰酉六合金、申子辰三合水局，思維步調一致，能共擔風雨成就大業' },
    巳: { bestZodiacs: ['猴', '牛', '雞'], reasonPart: '巳申六合水、巳酉丑三合金局，眼界卓越、進退有據，彼此相得益彰' },
    午: { bestZodiacs: ['羊', '虎', '狗'], reasonPart: '午未六合土、寅午戌三合火局，氣場相投、坦誠率直，攜手同心開創生機' },
    未: { bestZodiacs: ['馬', '豬', '兔'], reasonPart: '午未六合、亥卯未三合木局，性格溫和包容，家庭與事業和諧共生' },
    申: { bestZodiacs: ['蛇', '鼠', '龍'], reasonPart: '巳申六合、申子辰三合水局，智謀雙全、機變過人，合作無往不利' },
    酉: { bestZodiacs: ['龍', '牛', '蛇'], reasonPart: '辰酉六合、巳酉丑三合金局，追求極致與美感，互為最強後盾' },
    戌: { bestZodiacs: ['兔', '虎', '馬'], reasonPart: '卯戌六合、寅午戌三合火局，忠厚信實，能給予最堅定的依靠' },
    亥: { bestZodiacs: ['虎', '兔', '羊'], reasonPart: '寅亥六合、亥卯未三合木局，靈性通透，生活與情感充滿浪漫與溫煦' },
  };

  const zodiacMatch = zodiacCombinations[yearBranch] || {
    bestZodiacs: ['龍', '猴', '牛'],
    reasonPart: '天干地支相生相合，能量互補深厚',
  };

  // 占星同象三分相與對宮互補星座
  const signTriplicities: Record<string, string[]> = {
    牡羊座: ['獅子座', '射手座', '天秤座'],
    金牛座: ['處女座', '摩羯座', '天蠍座'],
    雙子座: ['天秤座', '水瓶座', '射手座'],
    巨蟹座: ['天蠍座', '雙魚座', '金牛座'],
    獅子座: ['牡羊座', '射手座', '水瓶座'],
    處女座: ['金牛座', '摩羯座', '雙魚座'],
    天秤座: ['雙子座', '水瓶座', '牡羊座'],
    天蠍座: ['巨蟹座', '雙魚座', '摩羯座'],
    射手座: ['牡羊座', '獅子座', '雙子座'],
    摩羯座: ['金牛座', '處女座', '巨蟹座'],
    水瓶座: ['雙子座', '天秤座', '獅子座'],
    雙魚座: ['巨蟹座', '天蠍座', '金牛座'],
  };

  const bestAstroSigns = signTriplicities[western.sunSign] || ['金牛座', '天蠍座', '雙魚座'];

  // ==========================================
  // 3. 人生重大轉折里程碑時間線 (timeline_milestones)
  // ==========================================
  // 由紫微大限宮位年齡與八字運限計算真實歲數
  const parsePalaceAge = (agesStr: string) => {
    const parts = agesStr.split('-');
    return parts.length === 2 ? parseInt(parts[0], 10) : 25;
  };

  const spouseAge = parsePalaceAge(spousePalace.ages) || 28;
  const careerAge = parsePalaceAge(careerPalace.ages) || 32;
  const wealthAge = parsePalaceAge(wealthPalace.ages) || 42;
  const healthAge = parsePalaceAge(healthPalace.ages) || 52;

  const timelineMilestones = [
    {
      age: Math.max(22, spouseAge - 2),
      category: 'marriage' as const,
      event: `紅鸞星動與夫妻宮大限交照，命定正緣相遇契機浮現，情感迎來重大轉折決定。`,
    },
    {
      age: Math.max(28, careerAge),
      category: 'career' as const,
      event: `官祿宮【${careerMajorStar}星】大限流年拱照，專業技術與職位權限迎來爆發式晉升，開創獨立事業版圖。`,
    },
    {
      age: Math.max(38, wealthAge),
      category: 'career' as const,
      event: `財帛宮大限啟動，八字日主生旺之時，資產結構迎來升級重組，獲得關鍵貴人資源挹注。`,
    },
    {
      age: Math.max(48, healthAge),
      category: 'health' as const,
      event: `疾厄宮運轉至此，身心靈能量轉換期。宜放慢節奏深耕養生之道，調整作息預防【${weakElem}】相關經絡失衡。`,
    },
  ];

  // ==========================================
  // 4. 職涯志業天賦與避坑指南 (ideal_careers)
  // ==========================================
  const primaryCareersByStar: Record<string, string[]> = {
    紫微: ['跨國企業高階經營管理', '政府及公營事業領袖', '產業戰略決策顧問'],
    天機: ['人工智慧與演算法架構', '商業策略分析師', '高階科技研發技術顧問'],
    太陽: ['國際貿易與外交公關', '自媒體與文化傳媒掌舵者', '新能源與跨國倡議組織'],
    武曲: ['投資銀行與私募股權管理', '國防軍工與重裝製造業', '量化金融操盤團隊'],
    天同: ['文化內容文創出版', '高端休閒旅宿經營', '公眾心理諮商與藝術療育'],
    廉貞: ['數位科技創業與平台架構', '法律政策合規專員', '高科技尖端通訊'],
    天府: ['資產管理與家族辦公室', '大型專案首席總監', '房地產開發與城鎮更新'],
    太陰: ['不動產資產活化配置', '審美設計與品牌創意總監', '國際精品與美學策展'],
    貪狼: ['跨界商務拓展 (BD)', '演藝娛樂與公關傳媒', '國際時尚與社交生態構建'],
    巨門: ['法庭訴訟辯護律師', '國際商務談判專家', '高教名師與公眾演講導師'],
    天相: ['公部門首長特別幕僚', '企業法務與誠信合規總監', '星級服務與奢華品牌經營'],
    天梁: ['專業醫療健康與醫藥研發', '教育家與學術帶頭人', '非營利慈善機構主持人'],
    七殺: ['破局型創業創辦人', '國際供應鏈開拓統帥', '特戰安全與高壓應急處理'],
    破軍: ['市場顛覆者與技術創新革命家', '海外市場拓荒先遣隊', '尖端產品重塑負責人'],
  };

  const primaryCareers = primaryCareersByStar[careerMajorStar] || [
    '科技金融專業顧問',
    '數位產品管理總監',
    '高階商務談判合夥人',
  ];

  const sideHustleOptions = [
    '知識 IP 付費社群與內容訂閱',
    '個人化數位命理與心理諮商工作坊',
    '海外跨境電商與高毛利精品選品',
    '不動產空間二房東或老屋改建美學活化',
    '自媒體影音製作與個人影響力品牌',
  ];
  // 依靈數選擇 2 項副業
  const sideHustleIndex = numerology.destinyNumber % sideHustleOptions.length;
  const sideHustle = [
    sideHustleOptions[sideHustleIndex],
    sideHustleOptions[(sideHustleIndex + 2) % sideHustleOptions.length],
  ];

  const avoidMap: Record<string, string[]> = {
    wood: ['低附加價值傳統代工製造', '過度內卷無定價權之實體餐飲'],
    fire: ['單調重複之流水線文書作業', '缺乏成長天花板之純後勤行政'],
    earth: ['高頻超短線高槓桿投機投標', '短視近利頻繁跳槽型業務'],
    metal: ['無合約保障之口頭合作項目', '邊界模糊之人情消耗型中介'],
    water: ['重資產高庫存壓力的傳統零售', '法規模糊具灰色法律風險之暴利灰產'],
  };
  const avoidCareers = avoidMap[weakElem] || [
    '高負債高槓桿重資產營運',
    '缺乏長遠護城河之人力密集代工',
  ];

  // ==========================================
  // 5. 財富來源模式判定 (wealth_origin)
  // ==========================================
  // 八字年柱代表祖德祖產；日柱與時柱代表個人自力。
  // 紫微父母宮、田宅宮得化祿或祿存代表祖產豐厚；財帛宮得七殺/武曲化祿代表白手起家。
  const parentHasLu = parentsPalace.majorStars.some((s) => s.mutagen === '祿') ||
    parentsPalace.minorStars.includes('祿存');
  const propertyHasLu = propertyPalace.majorStars.some((s) => s.mutagen === '祿') ||
    propertyPalace.minorStars.includes('祿存');
  const wealthHasLu = wealthPalace.majorStars.some((s) => s.mutagen === '祿' || s.mutagen === '權') ||
    wealthPalace.minorStars.includes('祿存');

  let wealthOrigin: 'self_made' | 'inheritance' | 'hybrid' = 'self_made';
  if ((parentHasLu || propertyHasLu) && wealthHasLu) {
    wealthOrigin = 'hybrid';
  } else if (parentHasLu || propertyHasLu) {
    wealthOrigin = 'inheritance';
  } else {
    wealthOrigin = 'self_made';
  }

  // ==========================================
  // 6. 離鄉背井與海外發展建議 (relocation_advice)
  // ==========================================
  // 八字驛馬星：年日支為寅申巳亥
  const yBranch = bazi.yearPillar.earthlyBranch;
  const dBranch = bazi.dayPillar.earthlyBranch;
  const isBaziYiMa = ['寅', '申', '巳', '亥'].includes(yBranch) || ['寅', '申', '巳', '亥'].includes(dBranch);

  // 紫微遷移宮吉星
  const travelHasJi =
    travelPalace.majorStars.some((s) => ['天同', '太陰', '太陽', '天相', '武曲'].includes(s.name) && s.mutagen !== '忌') ||
    travelPalace.minorStars.some((m) => ['天馬', '祿存', '左輔', '右弼', '天魁', '天鉞'].includes(m));

  const shouldRelocate = isBaziYiMa || travelHasJi;
  const relocationRecommendation: 'relocate' | 'stay_local' = shouldRelocate ? 'relocate' : 'stay_local';

  const relocationVerdict = shouldRelocate
    ? `命造遷移宮坐守吉曜會照【天馬/祿存】，八字驛馬星動態顯赫。格局宜動不宜靜，跨出出生地、遠赴一線大都會或海外留學工作，越動越發，貴人多在遠方與異地！`
    : `命造本命田宅與命宮根基扎實，地氣厚重。在地深耕人脈、借力原生家庭與本地長期積澱資源，比隻身在外漂泊更能穩紮穩打建立商業帝國，守成為上。`;

  // ==========================================
  // 7. 投資理財適性工具 (investment_tools)
  // ==========================================
  // 依日主偏財 vs 正財，占星第二宮與第八宮吉凶判定
  const isHighRiskTolerant =
    bazi.dayPillar.tenGod.includes('偏財') ||
    bazi.monthPillar.tenGod.includes('偏財') ||
    bazi.monthPillar.tenGod.includes('七殺') ||
    numerology.destinyNumber === 8 ||
    numerology.destinyNumber === 5;

  const highYieldTools = isHighRiskTolerant
    ? ['核心科技創新股 (AI/半導體龍頭)', '具備流動性之成長型公募基金', '優質早期新創股權投資']
    : ['追蹤大盤之全球寬基指數 ETF', '高股息績優龍頭企業股', '商業精華地段店面收益權'];

  const safeHavenTools = [
    '核心都會區自住兼抗通膨不動產',
    '評級優等之長天期主權國債與美元保單',
    '實體實重黃金與貴金屬避險儲備',
  ];

  const riskyAvoidTools = [
    '無資產支撐之高倍率衍生品與槓桿期貨',
    '無白皮書背書與無監管之高風險虛擬幣合約',
    '親友未經抵押審核之高額民間借貸',
  ];

  // ==========================================
  // 8. 性情脾氣與心智耐受力 (temperament)
  // ==========================================
  // 火旺或七殺者脾氣級別高；水木相生或正印食神者脾氣溫和
  const fireScore = bazi.elementScores.fire || 0;
  let temperLevel: 1 | 2 | 3 | 4 | 5 = 3;
  if (fireScore >= 35 || bazi.dayPillar.tenGod === '七殺') {
    temperLevel = 5;
  } else if (fireScore >= 25 || bazi.dayPillar.tenGod === '傷官') {
    temperLevel = 4;
  } else if (bazi.elementScores.earth >= 30 || bazi.dayPillar.tenGod === '正印') {
    temperLevel = 1;
  } else if (bazi.elementScores.water >= 25 || bazi.dayPillar.tenGod === '正官') {
    temperLevel = 2;
  }

  const temperDescriptions: Record<number, { patience: string; diligence: string }> = {
    1: {
      patience: '如大地般沉穩寬厚，具備頂級情緒自控力，極少在公眾場合失態動怒。',
      diligence: '厚積薄發型，習慣按部就班穩健推展，耐得住寂寞與漫長的沈潛期。',
    },
    2: {
      patience: '溫和內斂善於傾聽，懂得化干戈為玉帛，在團體中扮演高情商協調者。',
      diligence: '有條不紊且注重細節執行，凡事力求善始善終，交付品質極度可靠。',
    },
    3: {
      patience: '原則性極強，平時溫和有禮但觸及個人底線時立場堅定絕不退讓。',
      diligence: '講求效率與敏捷反覆運算，善於利用方法論借力使力，拒絕做無用功。',
    },
    4: {
      patience: '急性子、雷厲風行，對低效率與拖延零容忍，喜怒形於色、坦蕩不造作。',
      diligence: '爆發力驚人，一旦鎖定目標便日夜兼程衝刺，常能以奇兵之勢快速破局。',
    },
    5: {
      patience: '王者霸氣、眼睛裡容不下半粒沙子，直爽剛烈，具備鮮明的領袖威懾力。',
      diligence: '鋼鐵般頑強的意志力，遇到重壓愈挫愈勇，越是逆境越能激發無窮鬥志。',
    },
  };

  const currentTemper = temperDescriptions[temperLevel];

  // ==========================================
  // 9. 開運飲食與幸運蔬果 (lucky_food)
  // ==========================================
  const foodByElement: Record<
    string,
    { foods: string[]; fruits: string[]; elementBoost: string }
  > = {
    wood: {
      foods: ['菠菜', '綠花椰菜', '羽衣甘藍', '蘆筍', '九層塔'],
      fruits: ['奇異果', '青蘋果', '芭樂', '檸檬'],
      elementBoost: '補足青綠東方生發之木，舒肝理氣、提振靈魂決斷魄力與原創思維。',
    },
    fire: {
      foods: ['紅甜椒', '牛番茄', '枸杞', '紅豆', '紅蘿蔔'],
      fruits: ['火龍果', '草莓', '紅石榴', '紅蘋果'],
      elementBoost: '引動南方離火熱忱，強健心陽、提升社交人氣能見度與公眾表現力。',
    },
    earth: {
      foods: ['黃金地瓜', '日本南瓜', '山藥', '黃豆', '板栗'],
      fruits: ['香蕉', '金黃木瓜', '芒果', '哈密瓜'],
      elementBoost: '培補中央戊己中土，鞏固脾胃中焦、增進資產承載力與信譽基石。',
    },
    metal: {
      foods: ['有機白蘿蔔', '銀耳', '杏仁', '百合', '白山藥'],
      fruits: ['雪梨', '白肉水蜜桃', '椰子', '白葡萄'],
      elementBoost: '涵養西方清肅乾金，潤肺理氣、強化個人心理邊界與明斷是非之決斷。',
    },
    water: {
      foods: ['熟黑芝麻', '黑豆', '海帶芽', '黑木耳', '香菇'],
      fruits: ['野生藍莓', '黑莓', '桑椹', '紫黑葡萄'],
      elementBoost: '滋潤北方玄武壬癸之水，養腎固本、打通深層靈性直覺與心靈安寧。',
    },
  };

  const luckyFoodData = foodByElement[weakElem] || foodByElement.wood;

  // ==========================================
  // 10. 健康脆弱器官與食補療法 (health_body)
  // ==========================================
  const healthByElement: Record<
    string,
    { organs: string[]; therapy: string }
  > = {
    wood: {
      organs: ['肝臟與膽囊系統', '筋脈骨骼與肌腱韌帶', '雙眼視覺疲勞與偏頭痛'],
      therapy: '日常宜飲用「決明子枸杞菊花茶」養肝明目；少食辛辣生冷，晚上 11 點前就寢以助膽經造血。',
    },
    fire: {
      organs: ['心臟血管與微循環', '小腸吸收代謝', '精神中樞緊張引發之淺眠失眠'],
      therapy: '宜常服「西洋參百合桂圓蓮子羹」寧心安神；午後避免過量咖啡因，維持規律有氧微汗運動。',
    },
    earth: {
      organs: ['脾臟與胃部消化腺', '口腔牙齦黏膜', '四肢肌肉疲勞與水腫'],
      therapy: '推薦常燉「四神茯苓芡實淮山湯」健脾祛濕；飲食細嚼慢嚥、定時定量，嚴防暴飲暴食。',
    },
    metal: {
      organs: ['肺部呼吸道與支氣管', '大腸排泄與腸道微生態', '皮膚敏弱容易乾癢'],
      therapy: '建議食用「川貝冰糖燉雪梨」或「杏仁白木耳露」養陰潤燥；多接觸大自然清新森林芬多精。',
    },
    water: {
      organs: ['腎臟與泌尿生殖系統', '骨髓骨質與腰椎脊椎', '耳部聽力與水液代謝'],
      therapy: '宜以「杜仲黑豆何首烏排骨湯」溫補腎元；冬日注意足部保暖，避免熬夜勞傷腎陰。',
    },
  };

  const healthData = healthByElement[weakElem] || healthByElement.wood;

  // ==========================================
  // 11. 命中正緣相遇年齡與特徵 (destined_partner)
  // ==========================================
  const meetAge = Math.min(38, Math.max(24, spouseAge - (numerology.destinyNumber % 3)));

  // 由夫妻宮星曜判定伴侶特徵
  const partnerTraitsByStar: Record<string, string[]> = {
    紫微: ['自帶領袖威儀與高貴氣場', '事業心極強且目光長遠', '對伴侶呵護備至自尊心強'],
    天府: ['家世良好舉止雍容大度', '善於理財累積實質財富', '性格沉穩包容重視生活品質'],
    天機: ['眉清目秀談吐文雅睿智', '思維敏捷具備深厚專業', '喜歡深度知性心靈交流'],
    太陽: ['熱情坦率充滿陽光能量', '名聲在外人緣極佳', '樂於助人且自帶保護欲'],
    武曲: ['行事果斷幹練不尚虛華', '財務頭腦清晰經濟獨立', '性格剛毅對感情專一忠誠'],
    天同: ['氣質親切溫柔富有同理心', '天真浪漫懂得享受生活', '長相討喜易激發人保護慾'],
    廉貞: ['外貌精緻且具神秘吸引力', '極具個人魅力與自尊心', '愛憎分明、忠於內心情感'],
    太陰: ['面容清秀氣質優雅柔和', '善解人意細膩體貼入微', '重視家庭氛圍與審美情調'],
    貪狼: ['談吐幽默多才多藝', '社交圈廣泛具強大異性緣', '情商極高懂得製造生活浪漫'],
    巨門: ['觀察入微言詞犀利見血', '邏輯縝密具備深層思辨', '感情深刻專情防衛心較重'],
    天相: ['衣著得體談吐知性優雅', '處事圓融周全人際極佳', '能在事業與家庭給予雙重輔佐'],
    天梁: ['成熟穩健如長兄長姐般可靠', '具備慈悲心與社會責任感', '遇事能為你遮風擋雨指點迷津'],
    七殺: ['眼神堅毅有神獨立自主', '敢作敢當不拖泥帶水', '在自身專業領域能獨當一面'],
    破軍: ['個性鮮明具有反骨創新型格', '敢於打破傳統為愛奔赴', '熱情熾熱討厭平庸俗套'],
  };

  const partnerTraits = partnerTraitsByStar[spouseMajorStar] || [
    '沉著冷靜兼備深厚同理心',
    '眼神清澈且具專業自信',
    '能為你提供無條件的心靈港灣',
  ];

  const olderStars = ['紫微', '天梁', '太陽', '天府'];
  const youngerStars = ['天同', '太陰', '破軍', '貪狼'];
  let ageGap: 'older' | 'younger' | 'peer' = 'peer';
  if (olderStars.includes(spouseMajorStar)) {
    ageGap = 'older';
  } else if (youngerStars.includes(spouseMajorStar)) {
    ageGap = 'younger';
  }

  const marriageTiming: 'early' | 'late' = meetAge <= 29 ? 'early' : 'late';

  // ==========================================
  // 12. 專屬能量水晶開運物 (lucky_crystals)
  // ==========================================
  const crystalMap: Record<string, { name: string; reason: string }> = {
    wood: {
      name: '頂級綠幽靈 (Green Phantom Quartz) / 葡萄石',
      reason: '共振心輪與木行之氣，凝聚正財能量磁場，激發源源不絕的事業拓展機遇與決策清明。',
    },
    fire: {
      name: '紅膠花水晶 (Red Hematoid) / 頂級石榴石',
      reason: '激發海底輪熱能與南方離火之勢，驅散情緒陰霾，大幅提升個人魅力與貴人桃花引力。',
    },
    earth: {
      name: '天然巴西黃水晶 (Citrine) / 鈦晶金髮晶',
      reason: '強化太陽神經叢氣場，增強個人實踐落地自信，聚攏正偏財源並鞏固財庫守成防護罩。',
    },
    metal: {
      name: '高頻白水晶簇 (White Quartz) / 藍月光石',
      reason: '純淨強大的壓電效應能快速清理身心負面雜念，提升專注決斷力與直覺靈光。',
    },
    water: {
      name: '彩虹眼黑曜石 (Rainbow Obsidian) / 海藍寶',
      reason: '具備極高吸收負能量之防護結界，化解小人是非干擾，並深化內在直覺潛能與平靜。',
    },
  };

  const crystalData = crystalMap[weakElem] || crystalMap.wood;

  // ==========================================
  // 13. 子息緣分與教養特質 (children_fate)
  // ==========================================
  // 紫微子女宮吉星：天府、天相、天同、紫微多子顯貴；武曲、七殺多個性剛強
  const childStar = childrenPalace.majorStars[0]?.name || '天同';
  const hasGoodChildStar = ['紫微', '天府', '天相', '天同', '太陽', '太陰'].includes(childStar);
  const estimatedCount = hasGoodChildStar ? 2 : 1;

  const childrenDescriptions: Record<string, string> = {
    紫微: '命中子息氣宇軒昂，自尊心強且具備領袖稟賦，宜採用民主引導式教育，給予充分自主權。',
    天府: '子息敦厚穩健、福慧雙全，具備深厚的理財與規劃天賦，與父母感情親厚默契十足。',
    天機: '子息聰敏伶俐、求知慾旺盛，在理工、邏輯或哲學領域展現過人天賦，宜注重引導其專注力。',
    太陽: '子息樂觀慷慨、光明磊落，具備極佳的公眾感染力與責任擔當，日後能光耀門楣。',
    天同: '子息天真活潑、溫良純真，具備極高的藝術鑑賞力與人文情懷，家庭氛圍溫暖祥和。',
    天梁: '子息早熟懂事、孝悌有禮，具備長兄長姐之風範與醫藥/教育天份，為家族厚道傳承之光。',
  };

  const childrenDesc =
    childrenDescriptions[childStar] ||
    `子息聰穎有靈性，承襲命主【${western.sunSign}】之堅韌與智慧，適度引導其天賦志趣將成大器。`;

  // ==========================================
  // 14. 未來三年流年運勢與正念心咒 (annual_forecast)
  // ==========================================
  // 2026 丙午火年、2027 丁未火土年、2028 戊申土金年
  // 計算年運分數
  let base2026 = 82;
  let base2027 = 88;
  let base2028 = 85;

  // 五行調候生剋
  if (weakElem === 'fire') {
    base2026 += 8; // 丙午旺火大助
    base2027 += 6;
  } else if (weakElem === 'water') {
    base2026 -= 4; // 丙午火沖，需低調沉澱
    base2028 += 8; // 戊申金水漸旺
  } else if (weakElem === 'metal') {
    base2028 += 9; // 申金相生
  } else if (weakElem === 'earth') {
    base2027 += 8; // 丁未燥土相助
  }

  const next3YearsCurve = [
    { year: 2026, score: Math.min(96, Math.max(70, base2026)) },
    { year: 2027, score: Math.min(97, Math.max(72, base2027)) },
    { year: 2028, score: Math.min(95, Math.max(74, base2028)) },
  ];

  const keyMonths = [
    '2026年 4月、9月（天德貴人相助，突破瓶頸關鍵月）',
    '2026年 7月（注意人際合約條款，宜穩健守成）',
    '2027年 5月、10月（名利雙收、資產重組黃金爆發期）',
    '2028年 3月、8月（資源跨界整合、靈性心智晉階收穫期）',
  ];

  const mindfulnessMantra = `「天地萬物與我同根，宇宙大能皆為我用。凡所發生的，皆為助我靈魂進化而來；我懷抱篤定與感恩，從容迎向每一個璀璨晨曦。」`;

  return {
    personality_mbti: {
      type: personalityType,
      score: extrovertScore,
      explanation: personalityExplanation,
    },
    zodiac_compatibility: {
      best_signs: bestAstroSigns,
      best_zodiacs: zodiacMatch.bestZodiacs,
      reason: `西洋占星天宮四象同象和諧共振，搭配八字地支【${yearBranch}】${zodiacMatch.reasonPart}，能形成陰陽調和、剛柔並濟的高能和合磁場。`,
    },
    timeline_milestones: timelineMilestones,
    ideal_careers: {
      primary: primaryCareers,
      side_hustle: sideHustle,
      avoid: avoidCareers,
    },
    wealth_origin: wealthOrigin,
    relocation_advice: {
      recommendation: relocationRecommendation,
      study_career_verdict: relocationVerdict,
    },
    investment_tools: {
      high_yield: highYieldTools,
      safe_haven: safeHavenTools,
      risky_avoid: riskyAvoidTools,
    },
    temperament: {
      temper_level: temperLevel,
      patience: currentTemper.patience,
      diligence: currentTemper.diligence,
    },
    lucky_food: {
      foods: luckyFoodData.foods,
      fruits: luckyFoodData.fruits,
      element_boost: luckyFoodData.elementBoost,
    },
    health_body: {
      vulnerable_organs: healthData.organs,
      dietary_therapy: healthData.therapy,
    },
    destined_partner: {
      meet_age: meetAge,
      traits: partnerTraits,
      age_gap: ageGap,
      marriage_timing: marriageTiming,
    },
    lucky_crystals: {
      crystal_name: crystalData.name,
      magnetic_field_reason: crystalData.reason,
    },
    children_fate: {
      estimated_count: estimatedCount,
      description: childrenDesc,
    },
    annual_forecast: {
      next_3_years_curve: next3YearsCurve,
      key_months: keyMonths,
      mindfulness_mantra: mindfulnessMantra,
    },
    sanctuary: generateCrossFaithSanctuary({
      weakElem,
      mingMajorStar,
      sunSign: western.sunSign,
      destinyNumber: numerology.destinyNumber,
    }),
  };
}

/**
 * 跨宗教心靈神聖處方箋生成引擎 (Cross-Faith Sanctuary Engine)
 * 依照消費心理學「神聖外部力量」與「心理控制感 (Locus of Control)」重建機制，
 * 針對命盤五行死穴與高皮質醇慢性焦慮狀態，提供四大信仰體系的深度安心解方。
 */
export function generateCrossFaithSanctuary(params: {
  weakElem: string;
  mingMajorStar: string;
  sunSign: string;
  destinyNumber: number;
}): import('@/types/astrology').CrossFaithSanctuary {
  const { weakElem, mingMajorStar, sunSign } = params;

  // 1. 漢傳佛教體系配置
  const buddhismProfiles: Record<string, { deity: string; mantra: string; ritual: string; reframing: string }> = {
    wood: {
      deity: '文殊師利菩薩 (Manjushri) / 準提觀音菩薩',
      mantra: '【文殊菩薩五字心咒】「嗡 阿 惹 巴 札 那 諦」及【準提神咒】「唵 折隸 主隸 準提 娑婆訶」',
      ritual: '清晨醒來後面向晨曦東方端身正坐，雙掌置膝掌心朝上，進行 21 次深度數息觀，將胸中鬱結之氣化為清淨呼氣，默持神咒 7 遍以激發破局智慧。',
      reframing: '凡在事業與決策上感受到的寸步難行，本質上並非外界壓迫，而是知見維度面臨升級瓶頸。接納眼前的暫時停滯，視其為智慧的沉澱蓄力期。',
    },
    fire: {
      deity: '藥師琉璃光如來 (Bhaisajyaguru) / 地藏王菩薩',
      mantra: '【藥師灌頂真言】「唵 鞞殺逝 鞞殺逝 鞞殺社 三沒揭帝 莎訶」及【心經】「照見五蘊皆空，度一切苦厄」',
      ritual: '每晚睡前 10 分鐘，遠離藍光螢幕，閉目靜心，觀想藥師佛身放藍色琉璃清涼光輝自百會穴灌注全身，平息過熱的心火與長期慢性失眠焦慮。',
      reframing: '長期的身心透支與心力交瘁，是靈魂在向你發出緊急召回令。病痛與挫敗不是命運的懲罰，而是慈悲的警鐘，提醒你必須先愛護自己的肉身神殿。',
    },
    earth: {
      deity: '大悲觀世音菩薩 (Avalokiteshvara) / 虛空藏菩薩',
      mantra: '【大悲神咒】核心心咒及【六字大明咒】「唵 嘛 呢 叭 咪 吽」',
      ritual: '取一杯乾淨溫開水置於案前，雙手合十微閉雙眼，虔誦心咒 21 遍後緩慢飲下，觀想慈悲甘露潤澤中焦脾胃與消化經絡，化解淤滯之執念。',
      reframing: '你習慣獨自承擔所有責任與期待，把別人的問題當成自己的過錯。學會放下「必須把一切掌控得完美無瑕」的沉重包袱，允許宇宙替你分擔重量。',
    },
    metal: {
      deity: '大勢至菩薩 (Mahasthamaprapta) / 普賢菩薩',
      mantra: '【準提佛母心咒】及【金剛經要義】「一切有為法，如夢幻泡影，如露亦如電，應作如是觀」',
      ritual: '每日午後預留 15 分鐘獨處冥想，雙手結禪定印，呼吸時觀想白色清淨光芒吸入胸腔肺部，吐出內在苛責與恐懼，切斷與消耗型人事物的毒性連結。',
      reframing: '凡事追求極致原則與邊界感，常讓你陷入非黑即白的孤立無援。學會像水一樣繞過障礙，退讓並不代表失敗，而是給命運轉圜的留白藝術。',
    },
    water: {
      deity: '地藏菩薩 (Ksitigarbha) / 不動明王',
      mantra: '【地藏菩薩滅定業真言】「唵 缽囉末鄰陀寧 娑婆訶」',
      ritual: '點燃一炷沉香或天然檀香，端坐雙足著地，脊椎挺拔，默念真言，將內心最深處對貧困、匱乏與背叛的恐懼全盤托出並交付給大地母親承載。',
      reframing: '恐慌往往源於對未知的過度想像。當你願意直視內心最壞的打算並接納它，恐懼便會失去對你的控制力，深層的潛能與定力才會真正破土而出。',
    },
  };

  const selectedBuddhism = buddhismProfiles[weakElem] || buddhismProfiles.wood;

  // 2. 道教與民間信仰配置
  const taoismProfiles: Record<string, { deity: string; guide: string; action: string }> = {
    wood: {
      deity: '關聖帝君 (協天大帝) / 文昌帝君',
      guide: '向帝君稟報時，需心懷正氣、據實陳述當前事業合同糾紛或是非瓶頸，不求不義偏財，但求「破除奸佞、心智明徹、忠義立身、行事磊落」。',
      action: '於農曆每月初一或初五前往當地香火鼎盛之武廟，點清香三炷，恭敬呈報出生時辰與居所，並可求取「五雷平安符」置於日常公事包內護佑氣場。',
    },
    fire: {
      deity: '保生大帝 (大道公) / 天上聖母 (媽祖娘娘)',
      guide: '向聖母或大帝祈稟時，如同孩兒向慈母哭訴，誠心交托近期積累的委屈與疲憊，懺悔心浮氣躁之過失，發願修口德、行善事以回向天地。',
      action: '至媽祖廟或保生大帝宮廟添點「光明燈」或「元神燈」，換取大悲平安水飲用，將個人被動焦慮轉化為主動向善立德之正能量。',
    },
    earth: {
      deity: '五路武財神 (趙公明元帥) / 福德正神 (土地公)',
      guide: '於財神案前稟告自身正當勞動付出之成果，承認財務決策與金錢管理上的疏漏，誓願往後以誠信待客、勤儉守成，若得利祿必提撥部分布施弱小。',
      action: '選於農曆初二、十六前往管區土地公廟或正統財神廟辦理「補庫科儀」或求取「開運錢母」，以儀式感強化守護資產財庫之心理錨定。',
    },
    metal: {
      deity: '玄天上帝 (真武大帝) / 廣澤尊王',
      guide: '面對周遭小人暗算、謠言中傷或惡意背叛時，向玄天上帝稟報，祈求以真武皂旗斬斷一切陰煞穢氣，扶正辟邪，保證自身絕不行背信忘義之事。',
      action: '參加宮廟之祭改或祭五鬼白虎法會，配戴黑曜石辟邪手珠或過爐平安吊飾，藉由神聖陽剛威儀重塑內在威嚴與心理防線。',
    },
    water: {
      deity: '月下老人 (天神良緣) / 水官大帝 (解厄水官)',
      guide: '如遇情場重創或深陷情感糾葛難以自拔，於月老案前立誓「揮別錯的人、不再自我作賤」，祈求賜予能互敬互重、成熟明理之正緣眷屬。',
      action: '農曆十五月圓之夜，攜帶甜糖或紅花至月老廟誠心祈願，祈求斬斷孽緣爛桃花，換取「姻緣紅線」置於枕下，象徵情感新生。',
    },
  };

  const selectedTaoism = taoismProfiles[weakElem] || taoismProfiles.wood;

  // 3. 基督與天主教信仰配置
  const christianityScriptures: Record<string, { scripture: string; archangel: string; serenityFocus: string }> = {
    wood: {
      scripture: '【箴言 3:5-6】「你要專心仰賴耶和華，不可倚靠自己的聰明，在你一切所行的事上都要認定祂，祂必指引你的路。」',
      archangel: '大天使米迦勒 (Archangel Michael) —— 神聖保護者，手持正義光劍斬斷恐懼枷鎖',
      serenityFocus: '學習放手將事業焦慮完全交託，深信在人不能的事，在神凡事都能。',
    },
    fire: {
      scripture: '【詩篇 23:1-3】「耶和華是我的牧者，我必不致缺乏。祂使我躺臥在青草地上，領我在可歇息的水邊。祂使我的靈魂甦醒。」',
      archangel: '大天使拉斐爾 (Archangel Raphael) —— 神聖醫治者，溫柔撫慰受損的身心與失眠神經',
      serenityFocus: '允許自己在風暴中停下腳步安靜歇息，深知平靜安穩才是力量的真正源泉。',
    },
    earth: {
      scripture: '【腓立比書 4:6-7】「應當一無罣慮，只要凡事藉著禱告、祈求，和感謝，將你們所要的告訴神。神所賜出人意外的平安，必在基督耶穌裡保守你們的心懷意念。」',
      archangel: '大天使烏列爾 (Archangel Uriel) —— 智慧之光，驅散迷霧照亮前行道路',
      serenityFocus: '停止用擔憂預支明天的苦難，用感恩數算今天已經擁有的恩典與資源。',
    },
    metal: {
      scripture: '【以賽亞書 41:10】「你不要害怕，因為我與你同在；不要驚惶，因為我是你的神。我必堅固你，我必幫助你；我必用我公義的右手扶持你。」',
      archangel: '聖本篤 (St. Benedict) —— 秩序與和平之守護主保，破除一切敵對侵擾',
      serenityFocus: '堅定內心的高貴道德與原則，堅信烏雲遮蔽的日光必會在最適當時機重現。',
    },
    water: {
      scripture: '【馬太福音 11:28】「凡勞苦擔重擔的人可以到我這裡來，我就使你們得安息。」',
      archangel: '大天使加百列 (Archangel Gabriel) —— 傳遞神聖指引與希望的信使',
      serenityFocus: '卸下壓在肩頭已久的深層恐懼與愧疚感，接受神聖無條件的寬恕與療癒。',
    },
  };

  const selectedChristianity = christianityScriptures[weakElem] || christianityScriptures.fire;

  // 4. 東南亞神祇信仰配置
  const southeastAsianProfiles: Record<string, { deity: string; vowSpirit: string; offeringAdvice: string }> = {
    wood: {
      deity: '象神 迦尼薩 (Ganesha) —— 破除千重障礙與開創財智之首尊',
      vowSpirit: '象神特別鍾愛勇敢開拓、勇於承擔責任之人。許願重點不在於乞求天上掉餡餅，而是立誓「清除心中的惰性、傲慢與猶豫不決」，承諾必將智慧用於造福他人。',
      offeringAdvice: '敬奉象神宜供奉甜乳點心、金黃鮮花或純淨椰子水，祈願時雙手合十觀想象鼻為你掃除前路一切有形絆腳石。願成之後務必捐款助學以踐行承諾。',
    },
    fire: {
      deity: '四面佛 (Phra Phrom 大梵天王) —— 全方位翻轉運勢之天神',
      vowSpirit: '四面佛具備「慈、悲、喜、捨」四無量心。祈求時必須言出必行、嚴守誠信契約。切記不可許下損人利己之願，並需明言還願之具體方式與期限。',
      offeringAdvice: '順時針方向依序參拜：一面事業學業、二面正財偏財、三面愛情人際、四面健康身心。每一面獻上萬壽菊七色花串與清香，願成後安排傳統泰式酬神舞或放生護生。',
    },
    earth: {
      deity: '拉胡天神 (Phra Rahu) —— 吞噬小人霉運與翻轉是非之星宿天神',
      vowSpirit: '當遭遇背後陷害、惡意挑撥或官司纏身時，拉胡天神能迅速吞噬一切晦氣。許願心態需以「化解冤愆、戒除貪婪」為出發點，轉化煞氣為個人事業底蘊。',
      offeringAdvice: '敬奉宜選用八種黑色食物（如黑咖啡、黑芝麻、黑豆、可可等），於每週三晚間祈敬，誠懇祈請拉胡天神吞噬職場惡意，重見朗朗乾坤。',
    },
    metal: {
      deity: '象神 迦尼薩 (Ganesha) 與 崇迪佛 (Somdej)',
      vowSpirit: '崇迪佛被譽為佛牌之王，能帶給配戴者崇高的心靈尊榮與清淨。許願精神在於「安住本心、守法守道、行事光明磊落」。',
      offeringAdvice: '每日清晨雙手合十默念崇迪心咒，觀想佛光普照心輪，化解因原則衝突帶來之孤立感，廣結各方善緣。',
    },
    water: {
      deity: '五眼四耳 (Si Hoo Ha Ta) —— 點石成金、化困厄為機遇之招財靈獸',
      vowSpirit: '傳說五眼四耳食碳排金，象徵能將人生最晦暗刻苦之磨難淬鍊為純金財富。許願者需立志「耐受磨難、不輕言放棄」，以實幹贏得財富。',
      offeringAdvice: '供奉熱木炭或紅黃鮮花，祈願給予逆風翻盤的商業眼光與堅韌定力，獲利後須主動回饋鄉里社會。',
    },
  };

  const selectedSoutheastAsian = southeastAsianProfiles[weakElem] || southeastAsianProfiles.wood;

  return {
    buddhism: {
      deity: selectedBuddhism.deity,
      mantra: selectedBuddhism.mantra,
      ritual: selectedBuddhism.ritual,
      psychologicalReframing: selectedBuddhism.reframing,
    },
    taoism: {
      deity: selectedTaoism.deity,
      petitionGuide: selectedTaoism.guide,
      templeAction: selectedTaoism.action,
    },
    christianity: {
      scripture: selectedChristianity.scripture,
      archangelOrSaint: selectedChristianity.archangel,
      serenityPrayer: `「親愛的主，求祢賜給我平靜的心，去接納那些我此刻無法改變的人與事；求祢賜給我無比的勇氣，去果斷改變那些我能夠改變的現狀；並求祢賜給我超凡的智慧，去清明分辨兩者的差別。${selectedChristianity.serenityFocus} 阿們。」`,
    },
    southeastAsian: {
      deity: selectedSoutheastAsian.deity,
      vowSpirit: selectedSoutheastAsian.vowSpirit,
      offeringAdvice: selectedSoutheastAsian.offeringAdvice,
    },
  };
}

/**
 * 精確天干五行名稱解析器 (formatDayMaster)
 * 徹底消滅任何寫死候選詞如 【${dayMaster}土/木/火/金/水】
 * 永遠輸出精確乾淨之天干五行（如：甲木、丙火、戊土、庚金、壬水）
 */
export function formatDayMaster(dayMaster: string): string {
  if (!dayMaster) return '本命日主';
  const clean = dayMaster.trim();
  const firstChar = clean.charAt(0);
  const stemMap: Record<string, string> = {
    '甲': '甲木',
    '乙': '乙木',
    '丙': '丙火',
    '丁': '丁火',
    '戊': '戊土',
    '己': '己土',
    '庚': '庚金',
    '辛': '辛金',
    '壬': '壬水',
    '癸': '癸水',
  };
  if (stemMap[firstChar]) {
    return stemMap[firstChar];
  }
  for (const [k, v] of Object.entries(stemMap)) {
    if (clean.includes(k)) return v;
  }
  return clean;
}

/**
 * 生成未來三年逐年深度年運戰略白皮書 (2026 ~ 2028 Yearly Strategic Dossier)
 * 結合八字流年干支、紫微流年四化與占星重大外行星換位（單年 800~1,200 字規格）
 */
export function generateThreeYearStrategicDossier(params: {
  dayMaster: string;
  mingMajorStar: string;
  sunSign: string;
  destinyNumber: number;
  profileName: string;
}) {
  const cleanDayMaster = formatDayMaster(params.dayMaster);
  const { mingMajorStar, sunSign, destinyNumber, profileName } = params;

  // 2026 丙午年
  const dossier2026 = {
    year: 2026,
    yearGanZhi: '2026 丙午年（歲次丙午・赤馬烈火）',
    score: 87,
    trend: '浴火破局・資產重組與權力邊界劃分年',
    astrologicalTheme: `【2026 丙午年天時大勢與底層能量基調】：
2026 歲次丙午，天干丙火坐午火帝旺，五行納音天河水，實為「外烈火而內藏玄機」之激烈重塑年份。紫微斗數流年四化為【天同化祿、天機化權、文昌化科、廉貞化忌】。廉貞在午宮化忌，天象上帶來極其強烈的人心浮動、合約條款隱患、稅務法規嚴查與合夥人暗流；然而天同化祿與天機化權，又為具備敏銳洞察力的創業者與專業人士提供了「用智慧槓桿撬動重型資產」的罕見機遇。
西洋占星天象上，冥王星已深度扎根水瓶座，引爆科技變革與組織去中心化；海王星與土星正式跨入牡羊座臨界點，歷史性地終結了過去幾年的迷茫濾鏡，世間不再相信虛幻的大餅，一切回歸「硬核交付能力與現金流實力」。
對於命主「${profileName}」（身為【${cleanDayMaster}】日主、紫微【${mingMajorStar}星】、太陽【${sunSign}】），2026 是您人生近五年來「最強力的破殼蛻變期」。這一年您將被迫告別過往將就妥協的人際模式，在烈火中確立專屬於您的不可替代權力領地。`,

    careerStrategy: {
      opportunityAndTiming: `【事業開拓與權力切入點】：
1. 最佳進攻時機：國曆 4 月（辰月水庫蓄勢）、9 月（酉月金氣生發）與 11 月（亥月天德化解）。在此三個月份大膽爭取大型專案主導權、主動發起加薪晉升談判、或推出個人獨立品牌。
2. 權力戰略：紫微【${mingMajorStar}星】賦予您的統帥底氣，在此年必須轉化為「專業顧問化與體系化」。拒絕再做任何消耗型低利潤跑腿事務，將自身業務標準化，做高門檻、高信任壁壘的高客單生意。`,
      pitfallAndVillains: `【職場小人情境與合約雷區警示】：
受流年【廉貞化忌】影響，6月至 7月（午月、未月火土極旺之際），極易遭遇「表面推心置腹、背後搶奪專案成果」的偽善同僚，或面臨合作夥伴企圖修改分潤協議的霸王條款。切記：所有關鍵承諾絕不可僅憑口頭協議，必須白紙黑字載明智慧財產權歸屬與違約退出機制，公事公辦不留任何灰色人情空間。`,
    },

    wealthFlow: {
      wealthExplosionPoint: `【正財與偏財爆發點】：
正財運勢穩健上揚，爆發點落在「解決行業難題的高難度交付」；秋季金水相生之時，偏財運會有意料之外的顧問費、技術分紅或過往投資的階段性結算入帳。`,
      prohibitedInvestments: `【絕對不可碰的投資紅線】：
嚴禁參與任何形式的民間高利借貸、未上市公司股權代持、高槓桿虛擬貨幣合約、以及親友鼓吹的加盟開店「掛名股東」。2026 年火炎土燥，盲目擴張現金流鏈條將引發嚴重流動性枯竭。`,
      recommendedAssets: `【最適合佈局的資產類別】：
優先配置實物貴金屬（黃金防禦避險）、核心地段具備穩定租金收益之收益型不動產、以及能直接提升個人生產力的高階技術設備與認證資產。`,
    },

    relationshipHarmony: {
      singleRomance: `【單身者桃花高峰與正緣特徵】：
桃花能量最旺盛月份為國曆 5 月與 10 月。潛在對象多出現在大型跨國研討會、法務或金融專業培訓、高端行業私董會中。對方氣質幹練、眼神堅毅，兼具思維高度與家庭責任感，年齡多與命主相差 2~5 歲。`,
      partneredAdvice: `【已婚/有伴侶價值觀盲區與化解心法】：
2026 年因工作節奏劇烈加快，最容易引爆的衝突在於「一方認為自己辛苦打拼為了家，另一方卻感受到徹底被忽視與情感被霸凌」。化解心法：嚴守每週一次「手機靜音燭光共處 90 分鐘」，學會向伴侶坦誠脆弱與焦慮，而非以冷漠或挑剔掩飾內心的疲憊。`,
    },

    seasonalCalendar: {
      q1: '【Q1 策略佈局與資源盤點期（1~3月）】：嚴控預算支出，清理過往無效社交群組。深耕個人技能樹，為第二季的破局奠定技術底氣。',
      q2: '【Q2 強力衝刺與威權確立期（4~6月）】：貴人星高照，主動爭取專案拍板權。遭遇反對意見時保持心態冷靜，以客觀數據擊碎質疑。',
      q3: '【Q3 考驗沉潛與合約防衛期（7~9月）】：人事紛擾高發期，行事力求低調。仔細審查所有法律文件，預防合作方臨時變卦。',
      q4: '【Q4 成果收割與複盤結算期（10~12月）】：資金回流期，大方犒賞核心助力。提撥 30% 收益封存入獨立安全帳戶，籌備次年擴張。',
    },
  };

  // 2027 丁未年
  const dossier2027 = {
    year: 2027,
    yearGanZhi: '2027 丁未年（歲次丁未・紅羊納福）',
    score: 93,
    trend: '大展宏圖・名利共振與資產定錨大年',
    astrologicalTheme: `【2027 丁未年天時大勢與底層能量基調】：
歲次丁未，丁火柔順而內蘊文明之光，未土為木庫、含丁火乙木己土，五行納音天河水。紫微流年四化為【太陰化祿、天同化權、天機化科、巨門化忌】。
太陰化祿為天下帶來無比豐饒的財富滋養，尤其利於女性貴人提攜、房產不動產佈局、高端審美服務與精緻私域運營；天機化科賦予命主極強的智囊名聲與演講公信力；唯需警惕【巨門化忌】帶來暗室私語、同業眼紅構陷與溝通誤會。
占星天象上，天王星深耕雙子座，數位媒介與跨境合作百花齊放；木星行經獅子至處女座，為認真踏實的工匠型領導者送來聚光燈。
身為【${cleanDayMaster}】日主搭配紫微【${mingMajorStar}星】，2027 是您「全面兌現過往累積、完成資產三級跳」的黃金大年。`,

    careerStrategy: {
      opportunityAndTiming: `【事業開拓與權力切入點】：
1. 最佳進攻時機：國曆 3 月（卯月三合木局）、5 月（巳月文明鼎盛）與 10 月（亥月水潤萬物）。此三年內難得一遇的大吉時空，適合啟動海外佈局、併購擴張或跨界成立旗艦工作室。
2. 權力戰略：善用「天機化科」之聲譽紅利，透過出書、發布權威白皮書或在行業峰會發表主題演講，將個人打造成該垂直賽道的意見領袖與標準制定者。`,
      pitfallAndVillains: `【職場小人情境與口舌雷區警示】：
流年【巨門化忌】提示口舌是非。切忌在任何私下聚會中議論主管、股東或競爭對手之隱私。你的每一句私下抱怨，都極可能被有心人錄音截圖轉發。面對質疑「只講事實與法規，絕不情緒化回懟」。`,
    },

    wealthFlow: {
      wealthExplosionPoint: `【正財與偏財爆發點】：
太陰化祿引動財帛宮天花板，正財收入將創下歷史新高！長期持有的資產迎來大幅增值，可趁機變現落袋為安；下半年有極佳的被動收入（版權、專利授權或租金）流水湧入。`,
      prohibitedInvestments: `【絕對不可碰的投資紅線】：
避免跟風炒作缺乏基本面支撐的概念股、外匯高頻炒作或短線當沖。切忌因手頭現金充裕而借錢給信用不佳的親戚，容易出現「借錢是恩人、要錢成仇人」的困局。`,
      recommendedAssets: `【最適合佈局的資產類別】：
核心一線都市優質住宅或具備增值潛力的商業店面、全球龍頭科技藍籌股指數ETF、家族傳承保單與高純度實物資產。`,
    },

    relationshipHarmony: {
      singleRomance: `【單身者桃花高峰與正緣特徵】：
2027 年太陰化祿，情感緣分水到渠成！桃花高峰期在國曆 3 月、6 月與 11 月。正緣對象多具備深厚的文藝修養或家族底蘊，性格溫潤包容，能在心靈層面與你產生靈魂級共鳴，有極大概率在此年閃婚定終生。`,
      partneredAdvice: `【已婚/有伴侶價值觀盲區與化解心法】：
需提防「巨門化忌」引發的無端猜忌與話語刺痛。伴侶可能因你的事業光芒過盛而產生不安全感。化解心法：主動將重大財務與資產所有權與伴侶共享，多在公眾場合讚美伴侶的幕後付出。`,
    },

    seasonalCalendar: {
      q1: '【Q1 貴人匯聚與名聲奠基期（1~3月）】：行業貴人主動登門，大膽推出全新旗艦產品或合作架構。',
      q2: '【Q2 財庫豐沛與簽約大發期（4~6月）】：簽訂重大長期合同，正財現金流洶湧湧入，落實資產定錨。',
      q3: '【Q3 謹言慎行與是非防護期（7~9月）】：面對同行嫉妒保持沉默與優雅，一切交由專業律師與制度處理。',
      q4: '【Q4 圓滿總結與福德布施期（10~12月）】：資產盤點大豐收，主動提撥利潤進行公益慈善與孝親，固化福報。',
    },
  };

  // 2028 戊申年
  const dossier2028 = {
    year: 2028,
    yearGanZhi: '2028 戊申年（歲次戊申・黃猴得金）',
    score: 89,
    trend: '沉潛守成・幕後操盤與心靈晉階年',
    astrologicalTheme: `【2028 戊申年天時大勢與底層能量基調】：
歲次戊申，天干戊土厚重高聳，地支申金為壬水之長生、庚金之本氣，五行納音大驛土。經歷了前兩年的烈火與整合，2028 年進入「萬物歸根、乾坤定局」之歷史階段。
紫微流年四化為【貪狼化祿、太陰化權、右弼化科、天機化忌】。貪狼化祿釋放龐大的靈性、娛樂、美學與跨界資源紅利，人脈社交價值連城；太陰化權則強化了對資產與核心權力的精密掌控；唯有【天機化忌】警示神經系統過勞、過度算計反而失控、以及決策層的突發性戰略誤判。
占星天象上，外行星進入全新穩態結構，世俗體系完成數位重構。身為【${cleanDayMaster}】日主、紫微【${mingMajorStar}星】，2028 年宜由「衝鋒陷陣的將軍」轉型為「坐鎮中軍的軍師與幕後操盤手」，以靜制動、以守為攻。`,

    careerStrategy: {
      opportunityAndTiming: `【事業開拓與權力切入點】：
1. 最佳進攻時機：國曆 2 月（寅月對沖激發動力）、8 月（申月當令主政）與 12 月（子月三合水局）。在此期間推動組織自動化、授權年輕骨幹、建立分潤機制，讓團隊自運轉為你賺錢。
2. 權力戰略：貪狼化祿帶動跨界出圈。適合將本業知識與文化創意、綠色健康或身心靈產業相結合，打造具備高精神溢價的終極商業生態圈。`,
      pitfallAndVillains: `【職場決策過勞與戰略失誤防範】：
天機化忌最傷腦神經與思維平衡。此年切忌「凡事親力親為、過度微觀管理」，這會導致核心幹部被架空離職，自己又身心耗竭。學會抓大放小，重大商業轉型務必經過智庫團隊三輪壓力測試。`,
    },

    wealthFlow: {
      wealthExplosionPoint: `【正財與偏財爆發點】：
貪狼化祿帶來豐沛的社交財與資源對縫財富。參加高規格商務社群、校友會或全球峰會，往往能在茶歇隨性對話中撮合重大投資案，獲取驚人居間佣金或股權分紅。`,
      prohibitedInvestments: `【絕對不可碰的投資紅線】：
嚴禁在下半年進行大規模盲目擴張重資產產線，嚴防重型庫存積壓；堅決不碰未經監管的跨國灰色套利交易與高槓桿衍生品。`,
      recommendedAssets: `【最適合佈局的資產類別】：
抗通膨高股息債券組合、醫療健康與長壽科技基金、以及能滋養全家人身心靈的優質度假避暑莊園或居所。`,
    },

    relationshipHarmony: {
      singleRomance: `【單身者桃花高峰與正緣特徵】：
貪狼化祿桃花滿天飛，但也夾雜著不少逢場作戲的虛浮爛桃花。真正具備長久正緣特質的對象會在國曆 8 月與 12 月現身，對方個性幽默豁達、見多識廣，能帶領你看見更廣闊的宇宙天地。`,
      partneredAdvice: `【已婚/有伴侶價值觀盲區與化解心法】：
此年社交邀約極多，必須嚴格劃清異性互動邊界，切忌因貪圖新鮮感或逢場作戲而引火自焚。與伴侶共同安排一次長途靈性朝聖或海外自駕旅行，能讓彼此感情重回初戀時的怦然心動。`,
    },

    seasonalCalendar: {
      q1: '【Q1 組織革新與權限下放期（1~3月）】：建立標準作業流程，扶持得力副手，將自己從日常繁瑣事務中抽離。',
      q2: '【Q2 人脈社交與資源整合期（4~6月）】：跨界串聯不同領域菁英，以利他思維撮合商機，享受貪狼化祿之紅利。',
      q3: '【Q3 慎思明辨與調養生息期（7~9月）】：天機化忌影響期，給大腦放長假。避免在此季做重大人生戰略轉折。',
      q4: '【Q4 圓融收尾與智慧沉澱期（10~12月）】：回顧三年征戰成果，著作立說或開班授徒，實現靈魂與世俗之雙重圓滿。',
    },
  };

  return [dossier2026, dossier2027, dossier2028];
}

/**
 * 生成維度四：現代量子顯化與跨宗教神聖處方手冊 (Dimension 4 Manifestation Manual)
 */
export function generateDimension4ActionPrescription(params: {
  dayMaster: string;
  mingMajorStar: string;
  sunSign: string;
  destinyNumber: number;
  weakElem: string;
}) {
  const cleanDayMaster = formatDayMaster(params.dayMaster);
  const { destinyNumber, sunSign, weakElem } = params;

  // 1. 現代量子顯化心法 (Modern Manifestation)
  const affirmationsByDestiny: Record<number, string> = {
    1: '我全然信任自己的原創力量，宇宙的所有豐盛與榮耀，正透過我堅定的步伐平靜顯化。',
    2: '我是一座寧靜的愛之燈塔，所有滋養我的真摯關係與資源，正溫柔且源源不絕地流向我。',
    3: '我的靈感與喜悅源自宇宙本源，我輕鬆吸引無窮的財富，並以我的光彩照亮人間。',
    4: '我的根基堅不可摧，所有的秩序與繁榮皆以我為錨，我在每一步中穩健累積恆久財富。',
    5: '我超越一切恐懼與框架，宇宙的無限可能為我敞開，我勇敢航向豐盛與自由的汪洋。',
    6: '我深具接納與給予的慈悲力量，天地的甘霖豐盛環繞我與我所愛之人，內外圓滿富足。',
    7: '我與至高智慧全然合一，所有的迷霧皆已消散，宇宙的真理與奇蹟正在此時此刻顯現。',
    8: '我是財富與權力的大師，至高無上的豐盛流經我並造福眾生，我理所當然擁有人間一切美好。',
    9: '我放下一切執念，成為宇宙大愛的純淨容器，無上的和平、富足與喜悅永遠常駐我心。',
  };

  const selectedAffirmation =
    affirmationsByDestiny[destinyNumber] ||
    '我全然接納神聖豐盛的流動，凡所發生的，皆在不可逆地成就我最輝煌的靈魂晉階。';

  const quantumManifestation = {
    teslaMethod369: {
      affirmation: `「${selectedAffirmation}」`,
      practiceSOP: `【3-6-9 特斯拉書寫顯化法 21 天實踐 SOP】：
1. 晨起之際（寫 3 遍）：早晨甦醒離開被窩後 10 分鐘內，在專屬金色或深色筆記本上，專注以工整字跡親手寫下肯定句 3 遍。此時大腦尚處於 Alpha/Theta 腦波交界，能最直接將意圖烙印進潛意識深處。
2. 午後充能（寫 6 遍）：午後 13:00~15:00 精力容易渙散時，洗淨雙手，找一安靜角落寫下肯定句 6 遍。每一筆劃皆觀想字體散發純金光芒，將自己從白日的瑣碎焦慮中拉回豐盛核心頻率。
3. 睡前封存（寫 9 遍）：入睡熄燈前 15 分鐘，放慢呼吸節奏，寫下肯定句 9 遍。每寫一遍皆在心中默讀一聲「感謝宇宙已然為我成就」，帶著無比的安心與確信合上筆記本。
持續不間斷執行 21 天，形成不可逆的神經突觸連結，徹底改寫大腦匱乏濾鏡！`,
    },
    satsTechnique: {
      guide: `【SATS (State Akin To Sleep) 睡前 Theta 腦波預演法】：
入睡前 5~10 分鐘，平躺於床，將全身肌肉由腳趾至頭頂逐一放鬆，進入半睡半醒之 Theta 腦波極致催眠狀態。
不要去思考「事情要如何發生」，而是直接跳到「事情早已圓滿成功之後的微小感官切片」：
• 事業成功：觀想與合夥人熱烈握手時掌心的溫暖觸感，聽見對方真誠說道「恭喜，這筆合約太漂亮了！」
• 財務自由：觀想自己悠閒坐在灑滿陽光的露台，手機銀行 APP 跳出通知，看見那一串令人踏實的七位數餘額數字，感受心中升起的深沉寧靜。
在腦海中將這個 5 秒的感官片段像短視頻般不斷重複循環播放，直到自己帶著這份「已然實現的欣慰與感激」自然沉入夢鄉。`,
    },
    wealthAttunement: {
      walletPurification: `【八字喜用神錢母製作與錢包磁場淨化】：
1. 錢包除煞：每週日晚間清理錢包，扔掉所有過期發票、廢棄折價券與破損卡片。鈔票必須同向整齊排列，保持錢包內部呼吸順暢。
2. 喜用神聚財錢母：選用一張號碼尾數帶 6、8、9 的全新未使用百元或千元大鈔，以天然檀香或艾草煙薰 3 圈。將其裝入專屬紅金小福袋中，置入錢包暗格作為「吸金母種」，誓言永不花費，以此錨定源源不絕的財源。`,
      frequencyBoost: `【金錢豐盛高頻啟動心法】：
每當對外支付任何款項（買咖啡、付水電房租或發工資）時，在心中默念：「感謝金錢陪伴我並提供價值，我祝福這筆錢流向世界帶去繁榮，並以百倍的豐盛回流我的生命！」徹底消滅付款時的「匱乏心痛感」，以感恩取代恐懼，你的財富磁場將從此翻轉！`,
    },
  };

  // 2. 東方佛道心靈寄託與民間轉運秘法
  const easternWisdom = {
    buddhismSoulCalm: {
      deity: '準提佛母・文殊師利菩薩・藥師琉璃光如來',
      mantraAndSutra: `【漢傳佛教解厄安魂與抄經心法】：
1. 專屬真言持誦：每日晨昏合掌念誦【準提神咒】或【六字大明咒】108 遍（音律：「嗡 嘛 呢 叭 咪 吽」），觀想清淨白光自心輪擴散，洗滌累世積壓之焦慮與恐懼種子。
2. 抄經淨化業力：選在清晨或沐浴後，以金色或黑色軟筆恭敬抄寫《般若波羅蜜多心經》一卷。抄寫前洗手漱口，每抄一字皆默念「照見五蘊皆空，度一切苦厄」，將功德回向法界與個人歷代宗親，能迅速平息心浮氣躁，開顯超凡世俗智慧。`,
    },
    taoismProtection: {
      deities: '關聖帝君（降伏小人・堅守正道）與 玄壇真君趙公明（招財進寶・固本培元）',
      negativeCleansingRitual: `【道教民間秘法：午時水除穢沐浴與粗鹽艾草包空間淨化】：
1. 午時水除穢浴：若感到近期運勢低迷、惡夢連連或頻繁遭遇無端口舌，取端午節午時水（或正午 11:00~13:00 接取之陽光純水），加入芙蓉葉 7 片、抹草 7 片與少許粗鹽，用於洗臉沐浴，能迅速驅散附著於乙太體之陰煞晦氣。
2. 粗鹽艾草包空間結界：準備天然粗海鹽 300g 與乾燥艾草末 100g 充分拌勻，分裝於四個透氣小紅布袋中，分別置於臥室或辦公室之四個角落（青龍、白虎、朱雀、玄武位）。每隔 21 天更換一次並將舊鹽沖入馬桶，能徹底淨化磁場、吸附濁氣、穩固居家安寧。`,
    },
  };

  // 3. 西方靈修與東南亞神聖護持
  const westernAndSouthEast = {
    christianDevotion: {
      psalmsContemplation: `【聖經詩篇神聖默想（急救心靈方舟）】：
當現實危機襲來、失眠恐慌蔓延時，請手撫胸口大聲朗讀《詩篇 23 篇》：
「耶和華是我的牧者，我必不致缺乏。祂使我躺臥在青草地上，領我在可安歇的水邊。祂使我的靈魂甦醒，為自己的名引導我走義路。我雖然行過死陰的幽谷，也不怕遭害，因為祢與我同在；祢的杖，祢的竿，都安慰我。在我敵人面前，祢為我擺設筵席；祢用油膏了我的頭，使我的福杯滿溢。」
在真理之光中，讓恐懼在屬天的平安裡徹底融化。`,
      archangelInvocation: `【大天使米迦勒與拉斐爾神聖祈請】：
• 大天使米迦勒（Archangel Michael）：雙手合十祈請：「祈請大天使米迦勒，以祢神聖的藍色光劍，斬斷一切附著於我身上的負面能量索、恐懼投射與匱乏信念。願祢的勇氣之盾守護我，使我行在至高真理中！」
• 大天使拉斐爾（Archangel Raphael）：祈請綠色療癒光芒籠罩心輪，修復疲憊的經絡與神經系統，重獲生命充沛活力。`,
    },
    southeastAsianGrace: {
      ganeshaWisdom: `【象神迦尼薩 (Ganesha) 破障智慧】：
象神代表「掃除前路一切障礙、賜予無上智慧與財富」。敬奉象神最核心的靈性心態，在於向內觀照「我自己是否成為了前進路上的最大障礙？」。祈請象神以神斧斬斷自身的惰性、猶豫與傲慢，願成之後以布施孤兒、資助教育來踐行神聖承諾。`,
      phraPhromVow: {
        phraPhromVow: `【四面佛 (Phra Phrom) 四面發願與守信還願】：
大梵天王以慈、悲、喜、捨四面護佑眾生。參拜或心中觀想時依序祈請：第一面功名事業、第二面婚姻感情、第三面財庫豐盛、第四面健康平安。許願時必須具體明確（不可含糊），並承諾如願後之具體還願方式（如獻七色花串、木象或助印善書）。四面佛極重誠信，言出必行，必得天神不可思議之神聖加持庇佑！`,
      },
    },
  };

  // 4. 互動式開運待辦檢核清單 (Interactive Checklist Tasks)
  const checklistTasks = [
    {
      id: 'task-369-day1',
      title: '啟動 3-6-9 特斯拉書寫顯化法（Day 1）',
      category: 'manifest' as const,
      description: '晨起寫 3 遍、午後寫 6 遍、睡前寫 9 遍專屬肯定句，錨定 21 天神經迴路。',
    },
    {
      id: 'task-sats-theta',
      title: '睡前 5 分鐘 SATS 腦波預演視覺化',
      category: 'manifest' as const,
      description: '在半睡半醒中，反覆播放願望已圓滿達成的 5 秒具體感官切片。',
    },
    {
      id: 'task-wallet-cleansing',
      title: '清理錢包雜物並製作專屬開運錢母',
      category: 'ritual' as const,
      description: '扔掉廢棄發票，將薰香淨化後的幸運大鈔放入錢包暗格作為吸金種子。',
    },
    {
      id: 'task-salt-purification',
      title: '擺放粗鹽艾草包淨化空間負能量',
      category: 'ritual' as const,
      description: '將粗鹽與艾草混合分裝，置於臥室或辦公室四角吸附晦氣。',
    },
    {
      id: 'task-sacred-mantra',
      title: '持誦準提神咒 / 默想詩篇 23 篇',
      category: 'mindset' as const,
      description: '專注念誦 108 遍心咒或朗誦大衛詩篇，撫平交感神經風暴，重獲平靜。',
    },
    {
      id: 'task-72h-stop-loss',
      title: '嚴格落實 72 小時重大財務/情緒冷靜期',
      category: 'mindset' as const,
      description: '重大開支或劇烈口角時啟動冷靜協議，杜絕衝動決策帶來的不可逆損耗。',
    },
  ];

  return {
    quantumManifestation,
    easternWisdom,
    westernAndSouthEast: {
      christianDevotion: westernAndSouthEast.christianDevotion,
      southeastAsianGrace: {
        ganeshaWisdom: westernAndSouthEast.southeastAsianGrace.ganeshaWisdom,
        phraPhromVow: (westernAndSouthEast.southeastAsianGrace.phraPhromVow as any).phraPhromVow || '大梵天王四面護佑，誠信還願利他善行。',
      },
    },
    checklistTasks,
  };
}


