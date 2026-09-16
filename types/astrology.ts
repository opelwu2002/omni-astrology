/**
 * 四合一命理平台核心型別定義 (Astrology, Bazi, Ziwei, Numerology, Synastry)
 */

// ==================== 西洋占星型別 ====================
export interface PlanetPosition {
  name: string;          // 行星名稱 (太陽, 月亮, 水星, 金星, 火星, 木星, 土星, 天王星, 海王星, 冥王星)
  englishName: string;   // Sun, Moon, Mercury, etc.
  longitude: number;     // 0 ~ 360 度黃道經度
  sign: string;          // 牡羊座, 金牛座, 雙子座...
  signIndex: number;     // 0 ~ 11
  degreeInSign: number;  // 0 ~ 30 度
  minuteInSign: number;  // 0 ~ 60 分
  house: number;         // 1 ~ 12 宮
  isRetrograde: boolean; // 是否逆行
}

export interface HouseCusp {
  houseNumber: number;   // 1 ~ 12
  longitude: number;     // 宮首黃道經度
  sign: string;          // 落入星座
  degree: number;        // 宮首度數
}

export interface AspectData {
  planet1: string;
  planet2: string;
  aspectType: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  aspectName: string;   // 合相 (0°), 六分相 (60°), 四分相 (90°), 三分相 (120°), 對分相 (180°)
  angle: number;        // 實際夾角
  orb: number;          // 容許度誤差
}

export interface WesternAstrologyChartData {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: AspectData[];
  ascendant: { longitude: number; sign: string; degree: number };
  midheaven: { longitude: number; sign: string; degree: number };
  sunSign: string;
  moonSign: string;
  risingSign: string;
}

// ==================== 八字命理型別 ====================
export interface BaziPillar {
  heavenlyStem: string;      // 天干 (甲、乙、丙...)
  earthlyBranch: string;     // 地支 (子、丑、寅...)
  stemFiveElement: string;   // 天干五行 (木、火、土、金、水)
  branchFiveElement: string; // 地支五行
  hiddenStems: string[];     // 地支藏干
  tenGod: string;            // 對應日主之十神 (比肩、劫財、食神...)
  nayin: string;             // 納音五行 (海中金、爐中火...)
}

export interface BaziChartData {
  yearPillar: BaziPillar;
  monthPillar: BaziPillar;
  dayPillar: BaziPillar;
  hourPillar: BaziPillar;
  dayMaster: string;            // 日主天干 (甲、乙...)
  dayMasterElement: string;     // 日主五行
  elementScores: {
    wood: number;
    fire: number;
    earth: number;
    metal: number;
    water: number;
  };
  solarTerm: string;            // 出生節氣
}

// ==================== 紫微斗數型別 ====================
export interface ZiweiPalace {
  index: number;              // 0 ~ 11 (0=子, 1=丑, ... 11=亥)
  earthlyBranch: string;       // 子、丑、寅...
  heavenlyStem: string;        // 天干 (甲、乙...)
  name: string;               // 命宮、兄弟、夫妻、子女、財帛、疾厄、遷移、僕役、官祿、田宅、福德、父母
  isBodyPalace: boolean;      // 是否為身宮
  majorStars: { name: string; brightness: string; mutagen?: string }[]; // 主星與四化 (祿、權、科、忌)
  minorStars: string[];       // 文昌、文曲、左輔、右弼、天魁、天鉞、擎羊、陀羅、火星、鈴星、天空、地劫等
  ages: string;               // 大限年齡區間 (如 2-11)
}

export interface ZiweiChartData {
  lunarDateStr: string;       // 農曆生辰
  fiveElementsBureau: string; // 五行局 (水二局、木三局、金四局、土五局、火六局)
  lifeMasterStar: string;     // 命主星
  bodyMasterStar: string;     // 身主星
  palaces: ZiweiPalace[];     // 12 宮位
  mingPalaceIndex: number;    // 命宮所在宮位索引
  shenPalaceIndex: number;    // 身宮所在宮位索引
}

// ==================== 生命靈數型別 ====================
export interface NumerologyChartData {
  destinyNumber: number;      // 命運數 (1~9，或卓越數 11, 22, 33)
  birthdayNumber: number;     // 生日數 (出生日加總至個位數)
  attitudeNumber: number;     // 態度數 / 卓越潛能數
  gridCounts: Record<number, number>; // 1~9 出現次數統計
  lines: { name: string; numbers: number[]; active: boolean; description: string }[]; // 連線分析
}

// ==================== 綜合解析與合盤型別 ====================
export interface InterpretationReport {
  profileName: string;
  soulPersona: string;             // 靈魂白話人設標籤
  workplaceQuote: {
    quote: string;                 // 職場生存犀利金句
    context: string;               // 職場情境應用指引
  };
  loveThunderbolts: {
    warnings: string[];            // 情場致命避雷針
    sweetSpot: string;             // 破冰與情感甜蜜點
  };
  breakthroughGuide: {
    actionTip: string;             // 落地破局行動
    luckyColor: string;            // 轉運幸運色/元素
    mantra: string;                // 每日賦能開運心咒
  };
  coreTraits: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
  };
  career: {
    title: string;
    advice: string;
    suitableFields: string[];
  };
  relationship: {
    title: string;
    advice: string;
    mateTraits: string;
  };
  comprehensiveSummary: string;

  // ===== 維度一：核心命理特質與深度自我認知 (Level 1 免費) =====
  dimension1_selfAwareness: {
    outerVsInnerConflict: string; // 外在表現與內在真實自我的衝突點
    fourDimensionalEnergy: {
      communication: number;      // 溝通力 (0~100)
      execution: number;          // 執行力 (0~100)
      creativity: number;         // 創造力 (0~100)
      resilience: number;         // 抗壓力 (0~100)
    };
    soulMission: string;          // 人生終極天命使命
  };

  // ===== 維度二：精準痛點解方：三大核心人生課題 (Level 2 初階解鎖 NT$199) =====
  dimension2_lifeProblems: {
    careerWealth: {
      startupModel: string;       // 適合的創業/副業模式
      moneyLeakage: string;       // 財政漏洞與漏財陷阱
      goldenBreakthroughPeriod: string; // 轉職爆發黃金期
    };
    loveRelationship: {
      soulmateTraits: string;     // 正緣特徵與相遇時機
      fatalBlindspots: string[];  // 戀愛致命盲點 (冷暴力、過度控制等)
      harmonyKey: string;         // 雙人長久相處保鮮指南
    };
    healthVitality: {
      psychologicalStressSource: string; // 心理核心壓力源
      energyFatigueArea: string;  // 能量中心對應之身體疲勞區
      wellnessRx: string;         // 調養身心靈之處方箋
    };
  };

  // ===== 維度三：動態時間線：未來運勢與關鍵時機點 (Level 3 高階解鎖 NT$699) =====
  dimension3_futureTimeline: {
    yearlyCurves: {
      year: number;
      score: number;              // 運勢指數 (0~100)
      trend: string;              // 走勢標籤 (起飛期、沉潛蓄力、大豐收)
      peakMonths: string;         // 衝刺黃金月
      cautionMonths: string;      // 需低調保守月
      advice: string;
    }[];
    yearlyDossiers?: YearlyStrategicDossier[]; // 未來三年逐年深度戰略檔案 (單年800-1200字)
    crisisWarningAndRemedy: {
      warning: string;            // 潛在危機警示
      actionStep: string;         // 避凶趨吉行動清單
    }[];
  };

  // ===== 維度四：落地行動指南與專屬心理處方 (Level 3 高階解鎖 NT$699) =====
  dimension4_actionPrescription: {
    dailyMeditationManifest: string; // 每日/每週冥想與顯化心法
    customAmuletAndColor: {
      amulet: string;             // 客製化幸運轉運物建議
      luckyColor: string;         // 專屬開運色
      luckyDirection: string;     // 貴人幸運方位
    };
    healingSoupMessage: string;   // 樹洞心靈雞湯結語

    // 現代量子顯化心法 (Modern Manifestation)
    quantumManifestation?: {
      teslaMethod369: {
        affirmation: string;      // 命盤調校之專屬顯化肯定句
        practiceSOP: string;      // 晨3午6晚9之21天實踐SOP
      };
      satsTechnique: {
        guide: string;            // SATS 睡前 Theta 腦波預演視覺化指導
      };
      wealthAttunement: {
        walletPurification: string; // 淨化錢包與聚財錢母製作
        frequencyBoost: string;    // 啟動金錢豐盛頻率
      };
    };

    // 東方佛道心靈寄託與民間轉運秘法
    easternWisdom?: {
      buddhismSoulCalm: {
        deity: string;            // 相應本尊
        mantraAndSutra: string;   // 專屬心咒與抄經心法 (心經/金剛經)
      };
      taoismProtection: {
        deities: string;          // 參拜守護大神 (關聖帝君/武財神/媽祖)
        negativeCleansingRitual: string; // 午時水除穢沐浴與粗鹽艾草包空間淨化步驟
      };
    };

    // 西方靈修與東南亞神聖護持
    westernAndSouthEast?: {
      christianDevotion: {
        psalmsContemplation: string; // 聖經詩篇默想 (詩篇23/91篇)
        archangelInvocation: string;  // 大天使米迦勒與拉斐爾祈請
      };
      southeastAsianGrace: {
        ganeshaWisdom: string;    // 象神破除事業障礙祈請
        phraPhromVow: string;     // 四面佛四面發願與還願功德觀
      };
    };

    // 互動式開運待辦檢核清單
    checklistTasks?: {
      id: string;
      title: string;
      category: 'manifest' | 'ritual' | 'mindset';
      description: string;
    }[];
  };

  // 跨宗教心靈神聖處方箋
  sanctuary?: CrossFaithSanctuary;
}

// ==================== 未來三年逐年戰略檔案型別 ====================
export interface YearlyStrategicDossier {
  year: number;
  yearGanZhi: string;                 // 如 "2026 丙午年"
  score: number;                     // 運勢指數
  trend: string;                     // 趨勢定位
  astrologicalTheme: string;         // 1. 年度天時大勢與能量基調 (紫微四化、八字干支、占星外行星換位)
  careerStrategy: {                  // 2. 事業開拓與職場權力戰略
    opportunityAndTiming: string;    // 升遷/跳槽/創業/守成最佳切入點
    pitfallAndVillains: string;       // 合同陷阱、合夥破裂、職場小人情境
  };
  wealthFlow: {                      // 3. 財富流向與投資紅線
    wealthExplosionPoint: string;    // 正財與偏財爆發點
    prohibitedInvestments: string;    // 絕對不可碰的投資項目
    recommendedAssets: string;        // 最適合佈局的資產類別
  };
  relationshipHarmony: {             // 4. 情感婚姻與人際和合
    singleRomance: string;           // 單身桃花高峰月份與潛在對象特質
    partneredAdvice: string;         // 已婚/有伴侶價值觀盲區與化解心法
  };
  seasonalCalendar: {                // 5. 四季作戰月曆
    q1: string;                      // Q1 衝刺/調整期
    q2: string;                      // Q2 考驗/沉潛期
    q3: string;                      // Q3 收穫/突破期
    q4: string;                      // Q4 結算/防禦期
  };
}

// ==================== 跨宗教心靈神聖處方箋型別 ====================
export interface CrossFaithSanctuary {
  buddhism: {
    deity: string;             // 相應佛菩薩 (準提/文殊/藥師佛/觀音等)
    mantra: string;            // 心咒或經典心法 (如大悲咒、準提神咒、心經要義)
    ritual: string;            // 靜坐與平息焦慮儀式
    psychologicalReframing: string; // 心理認知重塑
  };
  taoism: {
    deity: string;             // 推薦宮廟主神 (關聖帝君/玄壇真君/月老/媽祖等)
    petitionGuide: string;     // 具體參拜稟報心態與向善發願指南
    templeAction: string;      // 具體行動建議 (如補財庫、安斗、點燈)
  };
  christianity: {
    scripture: string;         // 默想聖經金句 (詩篇/箴言/腓立比書)
    archangelOrSaint: string;  // 呼求大天使或主保聖人 (米迦勒/拉斐爾等)
    serenityPrayer: string;    // 現代落地版寧靜祈禱文
  };
  southeastAsian: {
    deity: string;             // 象神 Ganesha / 四面佛 Phra Phrom
    vowSpirit: string;         // 敬拜心態、承諾還願與利他精神
    offeringAdvice: string;    // 祈福與清明心態指引
  };
}

// ==================== 雙人合盤深度分析三大板塊型別 ====================
export interface SynastryDeepAnalysis {
  // 1. 靈魂化學反應與核心摩擦點
  soulDynamics: {
    title: string;
    chemistryAnalysis: string;
    moneyViewClash: string;
    communicationPaceClash: string;
    triggerScene: string;
  };
  // 2. 職場/合夥/感情致命死穴預警
  fatalPitfalls: {
    title: string;
    vulnerabilityArea: string;
    worstCaseScenario: string;
    preConflictAgreement: string[]; // 防踩雷協議清單
  };
  // 3. 跨週期長期相處錦囊（破局 SOP）
  breakthroughSOP: {
    title: string;
    coolingStep1: string; // 暫停止血
    coolingStep2: string; // 脆弱坦誠
    coolingStep3: string; // 協議校準
    starComplementaryAdvice: string; // 命宮星曜互補操作指引
  };
}

export interface SynastryScoreItem {
  category: string;  // 整體緣分、戀愛婚姻、事業合夥、溝通心靈
  score: number;     // 0 ~ 100
  comment: string;
}

export interface SynastryResult {
  profileA: { id: string; name: string };
  profileB: { id: string; name: string };
  overallScore: number;
  scoreBreakdown: SynastryScoreItem[];
  westernSynastryHighlights: string[];
  baziCompatibilityHighlights: string[];
  ziweiCompatibilityHighlights: string[];
  numerologyCompatibilityHighlights: string[];
  interactionAdvice: string;
  deepAnalysis: SynastryDeepAnalysis; // 深度三大板塊 (800+ 字)
  sanctuary?: CrossFaithSanctuary;    // 雙人關係跨宗教心靈處方箋
}
