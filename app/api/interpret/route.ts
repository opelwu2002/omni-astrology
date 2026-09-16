import { NextResponse } from 'next/server';
import numerologyDb from '@/data/numerology_db.json';
import astrologyDb from '@/data/astrology_planets_db.json';
import baziDb from '@/data/bazi_db.json';
import ziweiDb from '@/data/ziwei_stars_db.json';
import { InterpretationReport } from '@/types/astrology';
import {
  generateCrossFaithSanctuary,
  formatDayMaster,
  generateThreeYearStrategicDossier,
  generateDimension4ActionPrescription,
} from '@/lib/interpretationEngine';

// 生成生動風趣的靈魂白話人設標籤
function generateSoulPersona(sunSign: string, destinyNumber: number, mingMajorStar: string): string {
  const titles: Record<number, string> = {
    1: '拓荒先鋒・獨立大女主/男主型',
    2: '讀心偵探・高情商共情大師',
    3: '點子造球機・行走的幽默發電機',
    4: '人間清醒・專治混亂的架構狂魔',
    5: '野生風之子・拒絕被定義的冒險家',
    6: '護短狂魔・溫柔且堅定的守護者',
    7: '靈魂觀察者・洞察人性的冷靜哲學家',
    8: '搞錢天花板・自帶威嚴的幕後掌舵人',
    9: '格局天花板・胸懷天下的浪漫理想家',
    11: '高頻直覺體・自帶光環的靈感燈塔',
    22: '造夢建築師・降維打擊的頂級操盤手',
    33: '宇宙治癒源・能量爆棚的靈魂導師',
  };

  const prefix = titles[destinyNumber] || '全能實戰派';
  return `【${sunSign} × ${mingMajorStar}星】${prefix}`;
}

// 生成職場生存犀利金句
function generateWorkplaceQuote(destinyNumber: number, dayMaster: string, mingMajorStar: string): { quote: string; context: string } {
  const quotes: Record<string, string> = {
    七殺: '「別在別人的情緒裡內耗，要在自己的戰場上稱王。」',
    破軍: '「不破不立，所有的危機都是我重新制定規則的墊腳石。」',
    廉貞: '「野心不需要隱藏，實力就是我最優雅的名片。」',
    紫微: '「不爭一時之氣，只看大局之成；位置要坐穩，格局要放寬。」',
    天機: '「智者借力，愚者死磕；用策略解決的事，絕不動用蠻力。」',
    武曲: '「少講情懷多看產出，數字與結果從不會說謊。」',
    太陽: '「自帶光源的人，無需刻意蹭別人的熱度。」',
    天府: '「厚積薄發，把防禦做到極致，勝利自然會來敲門。」',
    太陰: '「細節是魔鬼也是護身符，不動聲色才是最高級的掌控。」',
    貪狼: '「八面玲瓏是手段，直抵目標才是靈魂真諦。」',
    巨門: '「話說三分留七分，開口必中要害，刀刀見骨。」',
    天相: '「做好中流砥柱，讓所有人都依賴你的不可替代性。」',
    天梁: '「行得正坐得端，經得起歲月淘洗的才是真正贏家。」',
    天同: '「知足常樂不等於躺平，用最舒服的節奏拿下最硬的仗。」',
  };

  const selectedQuote = quotes[mingMajorStar] || '「保持專注與熱愛，天下沒有跨不過去的坎。」';
  const cleanDayMaster = formatDayMaster(dayMaster);
  const context = `身為【${cleanDayMaster}】日主搭配靈數【${destinyNumber}】數，職場上最忌諱「既要又要還要」導致精力發散。切記「只對成果負責，不對他人情緒買單」！`;

  return { quote: selectedQuote, context };
}

// 生成情場避雷針
function generateLoveThunderbolts(moonSign: string, sunSign: string): { warnings: string[]; sweetSpot: string } {
  const signThunderbolts: Record<string, string[]> = {
    牡羊座: ['❌ 忌：拐彎抹角打啞謎！直球對決才是王道。', '❌ 忌：當眾潑冷水挑戰他的威嚴。'],
    金牛座: ['❌ 忌：突如其來打亂計畫或過度鋪張浪費。', '❌ 忌：逼他在憤怒時立刻表態。'],
    雙子座: ['❌ 忌：無聊呆板且無休止的日常查勤。', '❌ 忌：試圖用教條規範限制其靈活思想。'],
    巨蟹座: ['❌ 忌：冷暴力或忽略他細微的情緒暗示。', '❌ 忌：批評他在意的家人或摯友。'],
    獅子座: ['❌ 忌：踩踏他的自尊心與面子。', '❌ 忌：吝嗇你的誇獎與崇拜。'],
    處女座: ['❌ 忌：粗心大意且滿不在乎。', '❌ 忌：在他認真給建議時嫌棄他囉嗦。'],
    天秤座: ['❌ 忌：粗魯野蠻的言行與強行逼問。', '❌ 忌：把他的妥協當成理所當然。'],
    天蠍座: ['❌ 忌：任何形式的欺騙隱瞞！善意謊言也零容忍。', '❌ 忌：和異性邊界不清不楚。'],
    射手座: ['❌ 忌：拿「以愛為名」企圖栓住他。', '❌ 忌：充滿負能量且抱怨不休。'],
    摩羯座: ['❌ 忌：畫大餅、光說不練或好吃懶做！', '❌ 忌：逼他在公眾場合黏膩肉麻。'],
    水瓶座: ['❌ 忌：試圖道德綁架或強迫他遵從世俗眼光。', '❌ 忌：質疑他的奇思妙想。'],
    雙魚座: ['❌ 忌：用刻薄冷酷的現實主義摧毀他的夢想。', '❌ 忌：對他的深情付出冷眼相對。'],
  };

  const warnings = signThunderbolts[sunSign] || [
    '❌ 忌：溝通時冷戰不溝通，誤會越滾越大。',
    '❌ 忌：忽視彼此邊界感，把付出當作理所當然。',
  ];

  const sweetSpot = `【通往心門的甜蜜密碼】：月亮落在【${moonSign}】，內心最渴望的是「無條件的接納與情緒回饋」。在他疲憊時遞上一杯溫水，能瞬間融化所有防備。`;

  return { warnings, sweetSpot };
}

// 生成轉運破局指南
function generateBreakthroughGuide(destinyNumber: number, dayMaster: string): { actionTip: string; luckyColor: string; mantra: string } {
  const luckyColors: Record<number, string> = {
    1: '耀眼緋紅 / 太陽金（激發原創魄力）',
    2: '月光銀白 / 湖水碧（強化直覺共情）',
    3: '明亮琥珀橘 / 陽光黃（釋放創意靈感）',
    4: '大地墨綠 / 穩重灰褐（鞏固長遠根基）',
    5: '深邃天空藍 / 湛藍（衝破認知疆界）',
    6: '玫瑰櫻粉 / 溫暖蜜桃（調和身心慈愛）',
    7: '神祕紫羅蘭 / 靛青（連接深層智慧）',
    8: '曜石酷黑 / 香檳金（招引豐盛財祿）',
    9: '純淨純白 / 璀璨彩虹（昇華大愛願景）',
    11: '極光白金（激發高頻靈感）',
    22: '玄武墨青（宏圖大業平穩落地）',
    33: '晨曦玫瑰金（無條件大愛治癒）',
  };

  return {
    actionTip: `今日破局第一要務：遠離「消耗你能量的無效社交」，給自己預留 30 分鐘沉澱期。在${dayMaster}日主生旺之時，專注完成手頭最重要的一件任務！`,
    luckyColor: luckyColors[destinyNumber] || '紫晶紫 / 能量白',
    mantra: '「凡是發生的，皆有利於我；所有的經歷，都在成就更強大的自己。」',
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      profileName = '命主',
      destinyNumber = 1,
      sunSign = '牡羊座',
      moonSign = '巨蟹座',
      risingSign = '獅子座',
      dayMaster = '甲',
      mingMajorStar = '紫微',
    } = body;

    // 1. 檢索資料庫
    const numData =
      (numerologyDb as Record<string, any>)[String(destinyNumber)] ||
      (numerologyDb as Record<string, any>)['1'];

    const astroSigns = (astrologyDb as any).signs || {};
    const sunData = astroSigns[sunSign] || astroSigns['牡羊座'];
    const moonData = astroSigns[moonSign] || astroSigns['巨蟹座'];
    const risingData = astroSigns[risingSign] || astroSigns['獅子座'];

    const baziMasters = (baziDb as any).day_masters || {};
    const baziData = baziMasters[dayMaster] || baziMasters['甲'];

    const ziweiStars = (ziweiDb as any).major_stars || {};
    const ziweiData = ziweiStars[mingMajorStar] || ziweiStars['紫微'];

    // 2. 基本生動文本
    const soulPersona = generateSoulPersona(sunSign, destinyNumber, mingMajorStar);
    const workplaceQuote = generateWorkplaceQuote(destinyNumber, dayMaster, mingMajorStar);
    const loveThunderbolts = generateLoveThunderbolts(moonSign, sunSign);
    const breakthroughGuide = generateBreakthroughGuide(destinyNumber, dayMaster);

    // 3. 綜合優勢與盲點
    const strengths: string[] = [
      ...(numData.strengths || []),
      `${sunSign}的熱情與爆發動力`,
      `${baziData.element}日主的堅毅定力`,
      `${mingMajorStar}星的獨特氣場格局`,
    ];

    const weaknesses: string[] = [
      ...(numData.weaknesses || []),
      `容易受${moonSign}情緒潮汐影響而內耗`,
      `注意避免${baziData.name}的偏執死理`,
    ];

    // 4. 基礎性格
    const coreTraitsSummary = `命主「${profileName}」生命靈數為【${destinyNumber}數 (${numData.title})】，在西洋占星中太陽落入【${sunSign}】、月亮落入【${moonSign}】、上升點位於【${risingSign}】；八字日主為【${baziData.name}】，紫微斗數命宮坐守【${mingMajorStar}星】。

綜合特質展現為：${numData.core_traits} 配合太陽${sunSign}「${sunData.sun_trait}」，外在給人${risingSign}「${risingData.rising_trait}」的強烈第一印象。同時，八字日主${dayMaster}賦予了您「${baziData.character}」的底層人格底蘊，與紫微${mingMajorStar}星「${ziweiData.nature}」相輔相成，構成多層次且內外調和的豐富靈魂質地。`;

    // 5. 事業與情感基礎建議
    const careerTitle = `【${numData.title} × ${baziData.name}】天賦事業路徑`;
    const careerAdvice = `在職涯規劃上，您的生命靈數${destinyNumber}提示您：${numData.career} 八字日主${dayMaster}為您指出：${baziData.career} 結合紫微${mingMajorStar}星的格局，您在工作場域最適合發揮「${ziweiData.career}」。`;

    const suitableFields: string[] = [
      ...(sunData.career_keywords || []),
      numData.title,
      ziweiData.type,
    ];

    const relationshipTitle = `【月亮${moonSign} × 紫微${mingMajorStar}】心靈情感歸宿`;
    const relationshipAdvice = `在親密關係中，您的深層情感由月亮${moonSign}主導：「${moonData.moon_trait}」。而西洋太陽${sunSign}展現的情感風格則是：「${sunData.love_style}」。紫微命宮${mingMajorStar}星在感情上的表現為：「${ziweiData.relationship}」。`;
    const mateTraits = `具備智慧與包容心、能欣賞${sunSign}獨特才華、情感穩定且能給予深層安全感的成熟靈魂伴侶。`;

    const comprehensiveSummary = `「Omni-Astrology 四合一維度整合印證」：
東方真太陽時所揭示之命盤為體，西洋占星絕對時空為用，生命靈數為靈魂藍圖核心。整體格局展現出「開創中帶穩重、理智中含深情」的和諧共振。`;

    // ===== 四大維度高階長篇深度數據擴充 (依照消費心理學情緒容器與三層交付標準) =====

    // 維度一：核心命理特質與深度自我認知
    const outerVsInnerConflict = `【外顯面具 vs 內在渴求的深層拉扯】：
您的上升【${risingSign}】讓您在公眾與職場場合，總是不自覺地穿上一件「刀槍不入、體面且凡事都能搞定」的鋼鐵盔甲。周遭所有人都在依賴你的決斷，習慣了向你索取答案；然而只有在夜深人靜、卸下防備時，月亮【${moonSign}】那顆極度渴望被無條件理解與溫柔呵護的心才會悄然浮現。很多時候，你早已身心俱疲、瀕臨皮質醇透支的極限，但嘴上依然咬緊牙關說「我沒事」。學會允許自己脆弱、停止討好與無休止的逞強，是您靈魂成熟並重新接納豐盛的第一道神聖關卡。`;

    const commScore = Math.min(88, 70 + (destinyNumber % 4) * 5);
    const execScore = Math.min(92, 75 + (destinyNumber % 3) * 6);
    const creatScore = Math.min(95, 72 + (destinyNumber % 5) * 5);
    const resilScore = Math.min(90, 78 + (destinyNumber % 2) * 8);

    const dimension1_selfAwareness = {
      outerVsInnerConflict,
      fourDimensionalEnergy: {
        communication: commScore,
        execution: execScore,
        creativity: creatScore,
        resilience: resilScore,
      },
      soulMission: `結合靈數【${destinyNumber}】與太陽【${sunSign}】之設定，您此生的終極靈魂使命是「將世間的混沌重塑為秩序，成為引領周遭人跨越恐懼與匱乏的燈塔」。您絕非來隨波逐流，而是來透過創造不可替代的專業價值，印證生命無限的擴張可能。`,
    };

    // 維度二：三大核心人生課題 (Level 2 初階付費解鎖 NT$199，單篇 1,000+ 字三層架構)
    const dimension2_lifeProblems = {
      careerWealth: {
        startupModel: `【第一層：底層病灶與現實心境同理】
你是否常感到「明明付出了常人兩倍的努力，但事業天花板卻總被無形力量卡死」？在職場或創業中，你最容易陷入「完美主義自我苛責」與「不放心假手他人」的雙重內耗。你把所有責任都扛在自己肩上，結果把精力分散在瑣碎庶務中，導致核心策略無暇顧及。

【第二層：命理根源與未來 3~6 個月連鎖危機】
從紫微【${mingMajorStar}星】與八字【${dayMaster}】日主格局來看，您的事業宮具備強大的開創爆發力，但財帛宮與官祿宮最忌諱「打價格戰或低利潤人力消耗型生意」。若在未來 3~6 個月內，您依然因焦慮而病急亂投醫、盲目跟風擴張重資產或被無效合夥人綁架，您將面臨「現金流緊縮、核心團隊內訌、身體慢性發炎」的三重連鎖危機。

【第三層：神聖處方與落地行動清單 (Checklist)】
1. 模式重組：果斷轉型為「高自主性專業顧問、垂直領域精品 IP、高附加價值知識變現」。做減法，只服務付得起高溢價的優質客戶。
2. 72 小時止血原則：任何涉及超過新台幣 3 萬元的非必要營運開支，強制啟動 72 小時冷卻期。
3. 破局防踩雷：遠離無契約保障的人情合作，所有利益分配必須在立約之初以白紙黑字寫明退出機制。`,

        moneyLeakage: `【底層漏洞剖析】：您的財政失血點往往並非生活必需品，而是源於「情緒性補償消費」與「不好意思拒絕親友借貸」。當事業面臨巨大挫折時，大腦會本能地透過購物或包攬他人開銷來換取暫時的控制感。防漏財關鍵在於設立「獨立封閉式資產防護帳戶」，每筆收入強制提撥 30% 自動轉入高防守性標的。`,

        goldenBreakthroughPeriod: `【黃金爆發轉折窗口期】：未來每逢秋季（金水相生之時），您的貴人運將迎來階段性大爆發。在此期間談判加薪、啟動新專案、獨立接案或拓展海外市場，將獲得事半功倍的成效。在此之前，請全力儲備技術與資產底氣。`,
      },
      loveRelationship: {
        soulmateTraits: `【第一層：底層心境與親密關係防禦機制】
在感情的世界裡，你最深的恐懼不是寂寞，而是「全心全意交付信任之後被辜負與背叛」。因為曾經受過傷，月亮【${moonSign}】讓你在關係初期習慣築起高聳的心牆。你一邊渴望有人能懂你的軟弱，一邊又用尖銳的考驗去試探對方的忠誠。

【第二層：命理根源與正緣特徵】
紫微夫妻宮星曜顯示，適合您的正緣絕非浮誇浪漫的花言巧語型，而是「眼神沉靜、性格沉穩、具備深厚包容心與實幹精神的成熟靈魂」。對方多半相識於專業進修場合、差旅公事或深交摯友引薦。

【第三層：破局相處 SOP 與防踩雷協議】
1. 嚴禁冷暴力：爭吵時切忌用摔門、已讀不回冰凍感情，這會徹底摧毀安全感。
2. 爭吵後 24 小時修復模板：主動表達「我現在很生氣，但我依舊在乎你，我們各自冷靜 2 小時後聊聊彼此的難過」。
3. 每週建立「無評判真心話時間」，坦誠各自的恐懼。`,

        fatalBlindspots: [
          '🚨 致命盲點一【防禦性冷暴力】：習慣用沉默或冷漠應對衝突，以為能大事化小，實則在伴侶心頭刻下深不可測的絕望鴻溝。',
          '🚨 致命盲點二【專案管理式控制】：把伴侶當成下屬或專案考核，過度苛求生活細節與行動反饋，讓親密關係窒息變質。',
          '🚨 致命盲點三【心口不一的刺蝟】：明明需要溫暖擁抱，說出口的話卻帶著尖刺與諷刺，把深愛你的人推向千里之外。',
        ],

        harmonyKey: `【相處長久保鮮法則】：建立專屬的「停火安全詞協議」。當爭執升級時，任何一方說出安全詞，雙方無條件停火 90 分鐘，各自散步或喝溫茶，等副交感神經恢復平靜再重啟對話。`,
      },
      healthVitality: {
        psychologicalStressSource: `【核心壓力源與心理病灶】：長期慢性焦慮來自於「對失控的極端恐懼」與「超我（Superego）對自我的嚴苛審判」。你總是覺得自己還不夠好，無時無刻處於應激戰鬥狀態，造成交感神經長期亢奮、皮質醇大量分泌。`,

        energyFatigueArea: `【能量受創疲勞警訊】：頸椎肩胛緊繃痠痛、消化系統失衡（神經性胃炎、脹氣消化不良）以及入睡困難、多夢早醒，皆是五臟經絡向你發出的求救信號。`,

        wellnessRx: `【神聖身心調養處方箋】：
1. 物理排毒：睡前 60 分鐘強制斷開螢幕藍光，以溫熱草本足浴（艾草、生薑）引火下行。
2. 食療滋養：每日晨間飲用溫熱「陳皮茯苓山藥飲」或「百合洋甘菊茶」，舒肝健脾。
3. 呼吸靜心：每日午休執行 5 分鐘 4-7-8 呼吸急救法（吸氣4秒、閉氣7秒、深吐8秒），阻斷交感神經風暴。`,
      },
    };

    // 維度三：未來運勢動態時間線 (Level 3 高階付費解鎖 NT$699，三年逐年戰略白皮書 3,000+ 字)
    const yearlyDossiers = generateThreeYearStrategicDossier({
      dayMaster,
      mingMajorStar,
      sunSign,
      destinyNumber,
      profileName,
    });

    const dimension3_futureTimeline = {
      yearlyCurves: [
        {
          year: 2026,
          score: 87,
          trend: '浴火破局・資產重組與權力邊界劃分年',
          peakMonths: '4月、9月、11月（突破事業瓶頸與推出旗艦品牌）',
          cautionMonths: '6月、7月（嚴防合夥內訌、廉貞化忌法規是非）',
          advice: '告別消耗型無效人脈，大膽爭取核心專案拍板權。建立防踩雷合約與退場協議，公事公辦不留灰色人情。',
        },
        {
          year: 2027,
          score: 93,
          trend: '大展宏圖・名利共振與資產定錨大年',
          peakMonths: '3月、5月、10月（太陰化祿引爆財庫、重大正緣成婚）',
          cautionMonths: '7月、8月（巨門化忌暗室私語與同行眼紅構陷）',
          advice: '天運與地氣全面共振，實體資產與高端私域經營大獲全勝。謹言慎行，以專業制度回應一切雜音。',
        },
        {
          year: 2028,
          score: 89,
          trend: '沉潛守成・幕後操盤與心靈晉階年',
          peakMonths: '2月、8月、12月（貪狼化祿跨界資源紅利大爆發）',
          cautionMonths: '5月、9月（天機化忌思維過勞、嚴禁盲目重資產擴張）',
          advice: '由前線指揮官轉型為幕後總操盤手與導師，授權骨幹團隊自運轉，實現世俗與靈魂雙重晉階。',
        },
      ],
      yearlyDossiers,
      crisisWarningAndRemedy: [
        {
          warning: '職場與合夥關係中，防範「表面親熱、背後爭權」的偽善同僚搶奪項目成果。',
          actionStep: '所有關鍵商務決策與資金往來，務必留存白紙黑字與通訊備份；建立專案進度公開透明機制，公事公辦不留灰色地帶。',
        },
        {
          warning: '在重大情緒低谷時，容易引發「報復性投資」或誤信未經審查的高利息理財騙局。',
          actionStep: '堅守「不熟不投」原則，任何超過單月儲蓄之支出，強制執行 72 小時冷靜期，並向具備客觀中立之專業財務顧問諮詢。',
        },
      ],
    };

    // 維度四：落地行動指南與心理處方 (Level 3 高階付費解鎖 NT$699，量子顯化與跨宗教手冊)
    const dim4Manual = generateDimension4ActionPrescription({
      dayMaster,
      mingMajorStar,
      sunSign,
      destinyNumber,
      weakElem: 'fire',
    });

    const dimension4_actionPrescription = {
      dailyMeditationManifest: `【每日 5 分鐘量子顯化與認知重塑練習】：
清晨甦醒之際，先不急於查看手機信息。平躺於床，將雙手輕覆於心輪中央，閉目進行 3 次深長緩慢的腹式呼吸。
在心中以堅定且溫柔的語調默念三遍：
「我全然接納此刻生命的流動。宇宙的所有豐盛、智慧與保護正在透過我彰顯；我放下所有的恐慌與對控制的執念，深信凡所發生的，皆為成就更強大且覺醒的自己而來。」
觀想一束溫暖純淨的金白色光芒自頭頂百會穴緩緩灌注全身，感受底氣與尊嚴在胸腔中穩穩扎根。`,
      customAmuletAndColor: {
        amulet: '天然巴西頂級黃水晶 / 彩虹眼黑曜石手珠（辟除是非煞氣・聚攏正偏財祿防護罩）',
        luckyColor: '香檳金、深邃墨綠與午夜皇家藍',
        luckyDirection: '正東方（事業文昌貴人文位）、西北方（乾金統帥掌權位）',
      },
      healingSoupMessage: `【樹洞深層心理雞湯結語】：
親愛的，請永遠記住：命盤不是用來把你關在宿命裡的監獄，而是上天交付給你的「靈魂藏寶圖」。世間從來沒有毫無波折的八字與星盤，只有真正覺醒並看透因果的強大靈魂。
你過去所經歷過的所有晦暗、孤立無援與心碎，不是因為你不配得到幸福，而是命運在為你褪去脆弱的舊殼，淬鍊出如今無所畏懼的你。
勇敢迎向風暴吧，天邊的破曉曙光早已為你破土而出，宇宙正在背後全力托舉著你！`,
      quantumManifestation: dim4Manual.quantumManifestation,
      easternWisdom: dim4Manual.easternWisdom,
      westernAndSouthEast: dim4Manual.westernAndSouthEast,
      checklistTasks: dim4Manual.checklistTasks,
    };

    // 6. 生成專屬跨宗教神聖處方箋
    const sanctuary = generateCrossFaithSanctuary({
      weakElem: 'fire',
      mingMajorStar,
      sunSign,
      destinyNumber,
    });

    const report: InterpretationReport = {
      profileName,
      soulPersona,
      workplaceQuote,
      loveThunderbolts,
      breakthroughGuide,
      coreTraits: {
        summary: coreTraitsSummary,
        strengths,
        weaknesses,
      },
      career: {
        title: careerTitle,
        advice: careerAdvice,
        suitableFields,
      },
      relationship: {
        title: relationshipTitle,
        advice: relationshipAdvice,
        mateTraits,
      },
      comprehensiveSummary,
      dimension1_selfAwareness,
      dimension2_lifeProblems,
      dimension3_futureTimeline,
      dimension4_actionPrescription,
      sanctuary,
    } as any;

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '解析失敗' },
      { status: 500 }
    );
  }
}
