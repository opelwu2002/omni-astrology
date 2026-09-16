/**
 * 人際關係雙人合盤深度引擎 (synastryEngine.ts)
 * 依照消費心理學全面升級：
 * 1. 徹底淘汰 3-4 行短評，升級為 800~1,500 字的三大實質深度板塊：
 *    - 【靈魂化學反應與核心摩擦點】(金錢觀、溝通節奏與情緒爆炸場景)
 *    - 【職場/合夥/感情致命死穴預警】(利益決策權破裂環節與防踩雷協議)
 *    - 【爭吵後 24 小時破局溝通 SOP】(三階段止血與星曜互補指引)
 * 2. 整合跨宗教心靈神聖處方箋 (Cross-Faith Sanctuary)，提供雙方關係外部神聖力量錨定
 */

import { UserProfile } from '@/types/profile';
import {
  WesternAstrologyChartData,
  BaziChartData,
  ZiweiChartData,
  NumerologyChartData,
  SynastryResult,
  SynastryDeepAnalysis,
} from '@/types/astrology';
import { generateCrossFaithSanctuary } from '@/lib/interpretationEngine';

// 五行相生相剋關係
const ELEMENT_RELATION: Record<string, { generates: string; overcomes: string }> = {
  木: { generates: '火', overcomes: '土' },
  火: { generates: '土', overcomes: '金' },
  土: { generates: '金', overcomes: '水' },
  金: { generates: '水', overcomes: '木' },
  水: { generates: '木', overcomes: '火' },
};

// 天干五合
const STEM_COMBINATIONS: Record<string, string> = {
  甲: '己', 己: '甲',
  乙: '庚', 庚: '乙',
  丙: '辛', 辛: '丙',
  丁: '壬', 壬: '丁',
  戊: '癸', 癸: '戊',
};

// 地支六合
const BRANCH_COMBINATIONS: Record<string, string> = {
  子: '丑', 丑: '子',
  寅: '亥', 亥: '寅',
  卯: '戌', 戌: '卯',
  辰: '酉', 酉: '辰',
  巳: '申', 申: '巳',
  午: '未', 未: '午',
};

// 地支六沖
const BRANCH_CLASHES: Record<string, string> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

// 星座四象元素映射
const SIGN_ELEMENT_MAP: Record<string, '火' | '土' | '風' | '水'> = {
  牡羊座: '火', 獅子座: '火', 射手座: '火',
  金牛座: '土', 處女座: '土', 摩羯座: '土',
  雙子座: '風', 天秤座: '風', 水瓶座: '風',
  巨蟹座: '水', 天蠍座: '水', 雙魚座: '水',
};

/**
 * 計算雙人合盤綜合契合度與深度三大板塊
 */
export function calculateSynastry(
  profileA: UserProfile,
  profileB: UserProfile,
  astroA: WesternAstrologyChartData,
  astroB: WesternAstrologyChartData,
  baziA: BaziChartData,
  baziB: BaziChartData,
  ziweiA: ZiweiChartData,
  ziweiB: ZiweiChartData,
  numA: NumerologyChartData,
  numB: NumerologyChartData
): SynastryResult {
  const highlightsWestern: string[] = [];
  const highlightsBazi: string[] = [];
  const highlightsZiwei: string[] = [];
  const highlightsNum: string[] = [];

  let westernScore = 78;
  let baziScore = 78;
  let ziweiScore = 76;
  let numScore = 78;

  // 1. 西洋占星維度比對
  const elemSunA = SIGN_ELEMENT_MAP[astroA.sunSign] || '火';
  const elemSunB = SIGN_ELEMENT_MAP[astroB.sunSign] || '火';
  const elemMoonA = SIGN_ELEMENT_MAP[astroA.moonSign] || '水';
  const elemMoonB = SIGN_ELEMENT_MAP[astroB.moonSign] || '水';

  if (elemSunA === elemSunB) {
    westernScore += 10;
    highlightsWestern.push(`太陽同屬${elemSunA}象（${astroA.sunSign} × ${astroB.sunSign}）：生命志趣相投，對外社交步調與人生目標高度共振。`);
  } else if (
    (elemSunA === '火' && elemSunB === '風') || (elemSunA === '風' && elemSunB === '火') ||
    (elemSunA === '水' && elemSunB === '土') || (elemSunA === '土' && elemSunB === '水')
  ) {
    westernScore += 8;
    highlightsWestern.push(`太陽元素相生（${elemSunA}象 × ${elemSunB}象）：陰陽調和、互補性強，彼此能激發源源不絕的成長靈感。`);
  } else {
    westernScore -= 6;
    highlightsWestern.push(`太陽元素相剋相沖（${elemSunA}象 × ${elemSunB}象）：做事風格與精力釋放節奏有顯著差異，需藉由明確協議化解摩擦。`);
  }

  if (elemMoonA === elemMoonB) {
    westernScore += 10;
    highlightsWestern.push(`月亮星座同氣相求（${astroA.moonSign} × ${astroB.moonSign}）：深層情緒波長同頻，極具心有靈犀的安撫默契。`);
  } else {
    highlightsWestern.push(`月亮情緒頻率差異（${astroA.moonSign} vs ${astroB.moonSign}）：一方需要空間冷靜，另一方渴望立即確認，容易在壓力下產生情緒誤判。`);
  }

  // 2. 八字維度比對
  const dayMasterA = baziA.dayMaster;
  const dayMasterB = baziB.dayMaster;
  const elemA = baziA.dayMasterElement;
  const elemB = baziB.dayMasterElement;

  if (STEM_COMBINATIONS[dayMasterA] === dayMasterB) {
    baziScore += 14;
    highlightsBazi.push(`天干作合（${dayMasterA}與${dayMasterB}天干正合）：天賜良緣，初識時彼此有難以抗拒的心靈吸引力。`);
  } else if (elemA === elemB) {
    baziScore += 6;
    highlightsBazi.push(`日主同屬【${elemA}行】：比肩同德，如同知己手足，無話不談但偶爾互不相讓。`);
  } else if (ELEMENT_RELATION[elemA]?.generates === elemB) {
    baziScore += 8;
    highlightsBazi.push(`日主五行相生（${elemA}生${elemB}）：${profileA.name}在實質資源與情感上能給予${profileB.name}極大的溫暖滋養。`);
  } else if (ELEMENT_RELATION[elemB]?.generates === elemA) {
    baziScore += 8;
    highlightsBazi.push(`日主五行相生（${elemB}生${elemA}）：${profileB.name}能在關鍵時刻成為${profileA.name}最堅實的幕後靠山。`);
  }

  // 夫妻宮地支比對
  const dayBranchA = baziA.dayPillar.earthlyBranch;
  const dayBranchB = baziB.dayPillar.earthlyBranch;
  if (BRANCH_COMBINATIONS[dayBranchA] === dayBranchB) {
    baziScore += 10;
    highlightsBazi.push(`日支夫妻宮六合（${dayBranchA}與${dayBranchB}相合）：婚姻家庭地基極度穩固，能共同抵禦外界經濟與現實風暴。`);
  } else if (BRANCH_CLASHES[dayBranchA] === dayBranchB) {
    baziScore -= 10;
    highlightsBazi.push(`日支夫妻宮逢沖（${dayBranchA}與${dayBranchB}相沖）：生活作息與親族互動常有碰撞，需嚴守私人界線避免外人挑撥。`);
  }

  // 3. 紫微斗數比對
  const starA = ziweiA.lifeMasterStar || '紫微';
  const starB = ziweiB.lifeMasterStar || '天府';
  highlightsZiwei.push(`命主星能量互動（${starA} × ${starB}）：${profileA.name}具備${starA}的決策風範，而${profileB.name}具備${starB}的氣場，形成獨特的勢力制衡。`);
  if (ziweiA.fiveElementsBureau === ziweiB.fiveElementsBureau) {
    ziweiScore += 6;
    highlightsZiwei.push(`五行局同步（同屬${ziweiA.fiveElementsBureau}）：人生十年大限起伏節奏相仿，能在相同的人生階段面臨並肩作戰的考驗。`);
  }

  // 4. 生命靈數比對
  const numDiff = Math.abs(numA.destinyNumber - numB.destinyNumber);
  if (numDiff === 0) {
    numScore += 10;
    highlightsNum.push(`命運數相同（均為${numA.destinyNumber}數）：靈魂藍圖如同雙生火焰，志向高度吻合，但也容易在同一個盲點上撞牆。`);
  } else {
    numScore += 6;
    highlightsNum.push(`靈數特質互補（${numA.destinyNumber}數 × ${numB.destinyNumber}數）：一個擅長點燃方向，一個擅長落地執行，是攻守兼備的組合。`);
  }

  const clamp = (val: number) => Math.min(Math.max(Math.round(val), 60), 98);
  const finalWestern = clamp(westernScore);
  const finalBazi = clamp(baziScore);
  const finalZiwei = clamp(ziweiScore);
  const finalNum = clamp(numScore);
  const overallScore = Math.round((finalWestern + finalBazi + finalZiwei + finalNum) / 4);

  // =========================================================================
  // 深度板塊一：靈魂化學反應與核心摩擦點 (至少 350 字)
  // =========================================================================
  const chemistryAnalysis = `【天生吸引力與靈魂鏡像】：
${profileA.name}（太陽${astroA.sunSign} / 日主${dayMasterA}${elemA}）初遇 ${profileB.name}（太陽${astroB.sunSign} / 日主${dayMasterB}${elemB}）時，往往會被對方身上「自己所缺乏的從容或魄力」深深震撼。雙方的八字天干與紫微${starA}與${starB}星曜相互投射，如同在對方身上看見了未被啟動的另一半自我。然而，這種強烈的宿命吸引力背後，隱藏著截然不同的底層心理防禦機制。`;

  const moneyViewClash = `【金錢觀與安全感建立的深層分歧】：
在金錢價值觀上，${profileA.name}偏向「${elemA === '金' || elemA === '土' ? '重視確定的資產安全感、重視預算紀律與抗通膨長遠防禦' : '重視機會擴張、擅於借力使力，願意為了願景承擔一定財務槓桿'}」，而${profileB.name}則「${elemB === '木' || elemB === '火' ? '注重生活體驗、靈活變通，在看待消費時更容易被情懷與即時價值打動' : '對每一筆未經共識的非必要大額開支高度敏感，容易產生財務失控的焦慮'}」。當雙方共同面對房產購置、大額投資或借貸擔保時，這種「防禦型思維 vs 擴張型思維」的碰撞會迅速升級為信任危機。`;

  const communicationPaceClash = `【溝通節奏與情緒爆炸引信】：
彼此最大的溝通盲點在於「情緒冷卻速度與信息消化步調的落差」。${profileA.name}習慣在衝突當下「${elemSunA === '火' || elemSunA === '風' ? '立刻攤牌對質、把事情講清楚，容不得半點含糊' : '先退回自身城堡封閉消化，不願在憤怒時吐露半句真心話'}」，而${profileB.name}則「${elemSunB === '水' || elemSunB === '土' ? '內心極度渴望情緒先被溫柔接納，一旦感受到被評判就會開啟被動防禦冷戰' : '急於要求立馬表態，把對方的沉默誤解為漠不關心甚至背叛'}」。`;

  const triggerScene = `【最易引爆衝突之日常現實場景】：
1. 涉及雙方原生家庭父母的重大支出或節慶探訪安排時，一方認為是理所當然的孝順，另一方卻感受到私人家庭邊界的被侵蝕。
2. 職場高壓疲憊返家後，一方渴望訴苦求抱抱，另一方卻開啟理智分析模式「這事本來就是你處理不當」，瞬間引爆毀滅性冷戰。`;

  // =========================================================================
  // 深度板塊二：職場/合夥/感情致命死穴預警與防踩雷協議 (至少 350 字)
  // =========================================================================
  const vulnerabilityArea = `【最易破裂之脆弱環節：決策權真空與無意識的特權爭奪】：
當兩人共同經營事業、合夥做生意或共同管理家庭財務時，最危險的死穴在於「表面講求平等，實則暗中爭奪最後拍板權」。紫微命宮【${starA}星】與【${starB}星】皆自帶鮮明的自主威嚴，若未在風平浪靜時以白紙黑字劃分權限，一旦遭遇市場低谷或現金流短缺，便會演變為「都是當初聽你的才虧損」的互相推諉，徹底摧毀多年的信任地基。`;

  const worstCaseScenario = `【未經防範之連鎖代價演變】：
若任由上述摩擦反覆發生，未來 3~6 個月內，關係將經歷「熱烈爭執 ➔ 疲憊冷漠 ➔ 情感隔離 ➔ 算計利益」的不可逆衰退。雙方會開始在財務上保留私房備份，對外人抱怨伴侶的不可理喻，最終在一次微不足道的日常口角中徹底分道揚鑣。`;

  const preConflictAgreement = [
    '協議一【72 小時重大財務冷卻期】：任何單筆超過新台幣 3 萬元的非固定支出或對外投資借貸，雙方必須啟動 72 小時評估期，任一方持有一票否決權，絕不可私自拍板後先斬後奏。',
    '協議二【公眾場合絕對護短原則】：無論在親朋好友、長輩家族或公司下屬面前，雙方意見相左時，一律由對外負責人先做定奪，私下回家後再關門復盤，絕不當眾戳破或駁斥對方。',
    '協議三【止戰金牌停火約定】：任何一方察覺心跳加速、言語開始帶刺時，有權喊出「暫停密語（如：星軌安全詞）」，雙方必須無條件分開在不同空間冷靜至少 90 分鐘，期間嚴禁透過傳訊進行文字轟炸。',
    '協議四【不翻舊帳封存條款】：每次爭執僅限於當下發生的單一事件，嚴禁使用「你每次都這樣」、「你從以前就...」等泛化字眼，過往已和解之事永遠不得作為今日攻擊之彈藥。',
  ];

  // =========================================================================
  // 深度板塊三：跨週期長期相處錦囊（爭吵後 24 小時破局 SOP）(至少 350 字)
  // =========================================================================
  const coolingStep1 = `【第 1 ~ 2 小時：物理隔離與情節止血】：
爭吵發生後，切忌強行逼問「你到底想怎樣」。由情緒較平穩的一方留下紙條或簡訊：「我現在心跳很快，需要去喝杯咖啡散步 60 分鐘。我非常在乎你，我們 2 小時後見。」讓飆升的皮質醇與腎上腺素自然代謝回落，停止互相遞送傷害性言詞。`;

  const coolingStep2 = `【第 3 ~ 12 小時：脆弱坦誠與書面破冰模板】：
嚴禁直接討論誰對誰錯，改用【非暴力溝通三步法】：
「親愛的，剛才爭吵時，我感受到（說出具體的情緒感受，如：孤單、不被信任或被貶低）。我真正在意的不是那件事本身，而是我害怕失去你的認同。如果剛才我的話刺傷了你，我很抱歉。」—— 只有當一方先展示脆弱，另一方的防禦刺蝟才會收起尖刺。`;

  const coolingStep3 = `【第 13 ~ 24 小時：協議校準與心靈復盤指引】：
選在光線柔和、無第三人打擾的環境（如安靜的咖啡館或戶外步道），點一杯溫飲。雙方各拿一張紙，各自寫下「我願意為了我們的未來退讓的一小步」，然後交換閱讀。以擁抱取代長篇大論的道理，將這場爭執化為升級雙方關係契約的寶貴基石。`;

  const starComplementaryAdvice = `【紫微星曜與八字五行長效互補之道】：
${profileA.name}的【${starA}星】代表的是關係中的「錨」，請多發揮穩健的防禦底氣與大局視野，少一些挑剔苛責；${profileB.name}的【${starB}星】代表的是關係中的「帆」，請多帶來熱情與靈性啟發，少一些負氣任性。當五行【${elemA}】與【${elemB}】陰陽相濟，這段關係必能穿越人間風雨，成為彼此此生最堅不可摧的心靈避風港。`;

  const scoreBreakdown = [
    {
      category: '整體宿世靈魂緣分',
      score: overallScore,
      comment: overallScore >= 85 ? '天作之合，極具深厚累世共振與心靈磁場' : '相得益彰，互補性極高且具備深厚轉化潛能',
    },
    {
      category: '親密相處與情感甜蜜度',
      score: Math.round((finalBazi + finalWestern) / 2),
      comment: '情感吸引力豐沛，需著重於爭吵後的 24 小時修復 SOP',
    },
    {
      category: '事業合夥與資產共富度',
      score: Math.round((finalZiwei + finalNum) / 2),
      comment: '目標方向互為後盾，落實防踩雷財務協議將成大器',
    },
    {
      category: '心靈同頻與價值觀共鳴',
      score: Math.round((finalWestern + finalNum) / 2),
      comment: '思維框架互為鏡像，能共同經歷靈魂深度的淬鍊與晉階',
    },
  ];

  const interactionAdvice = `【${profileA.name} 與 ${profileB.name} 的終生相處密碼】：
雙方命盤呈現【${overallScore >= 85 ? '宿世天命共振型' : '深度互補磨礪型'}】關係。
請永遠記住：愛不是尋找一個沒有缺點的完美對象，而是兩個覺醒的靈魂，在看清彼此脆弱與刺痛之後，依然堅定選擇攜手前行。嚴守防踩雷協議，多站在對方的恐懼深處思考，宇宙必會將這段緣分庇佑到底！`;

  // 生成合盤專屬跨宗教神聖處方箋
  const sanctuary = generateCrossFaithSanctuary({
    weakElem: baziA.elementScores.water < baziB.elementScores.water ? 'water' : 'fire',
    mingMajorStar: starA,
    sunSign: astroA.sunSign,
    destinyNumber: numA.destinyNumber,
  });

  return {
    profileA: { id: profileA.id, name: profileA.name },
    profileB: { id: profileB.id, name: profileB.name },
    overallScore,
    scoreBreakdown,
    westernSynastryHighlights: highlightsWestern,
    baziCompatibilityHighlights: highlightsBazi,
    ziweiCompatibilityHighlights: highlightsZiwei,
    numerologyCompatibilityHighlights: highlightsNum,
    interactionAdvice,
    deepAnalysis: {
      soulDynamics: {
        title: '靈魂化學反應與核心摩擦點（金錢・溝通・爆發點）',
        chemistryAnalysis,
        moneyViewClash,
        communicationPaceClash,
        triggerScene,
      },
      fatalPitfalls: {
        title: '職場/合夥/感情致命死穴預警與防踩雷協議',
        vulnerabilityArea,
        worstCaseScenario,
        preConflictAgreement,
      },
      breakthroughSOP: {
        title: '跨週期長期相處錦囊（爭吵後 24 小時破局 SOP）',
        coolingStep1,
        coolingStep2,
        coolingStep3,
        starComplementaryAdvice,
      },
    },
    sanctuary,
  };
}
