/**
 * 四大神聖線上占卜引擎資料庫 (Divination Database)
 * 嚴格遵循消費者心理學三層交付架構：
 * 1. 【當前能量鏡像】：同理並反射使用者當下的焦慮或卡關現狀
 * 2. 【盲點與因果提醒】：點名心理盲區或現實障礙
 * 3. 【具體破局指引】：給予立刻能在生活中執行的行動建議
 */

// ==========================================
// 1. 塔羅牌 (大阿爾克那 22 張)
// ==========================================
export interface TarotCard {
  id: number;
  name: string;
  nameEn: string;
  symbol: string;
  element: string;
  upright: {
    title: string;
    keywords: string[];
    energyMirror: string;
    blindSpot: string;
    actionAdvice: string;
  };
  reversed: {
    title: string;
    keywords: string[];
    energyMirror: string;
    blindSpot: string;
    actionAdvice: string;
  };
}

export const TAROT_MAJOR_ARCANA: TarotCard[] = [
  {
    id: 0,
    name: '愚者',
    nameEn: 'The Fool',
    symbol: '🃏',
    element: '風',
    upright: {
      title: '踏入未知的純粹勇氣',
      keywords: ['新開始', '天真無畏', '潛力無限', '冒險之旅'],
      energyMirror: '你正站在人生的新懸崖邊緣，心中既有對未知的渴望，也有難以言說的忐忑。過去的框架已無法承載你，你渴望一場不受世俗拘束的跳躍。',
      blindSpot: '過於樂觀忽視腳下的懸崖碎石。你以為只要有熱忱就足夠，卻可能欠缺應對最壞情況的備案。',
      actionAdvice: '本週試著放下過度縝密的盤算，帶著輕裝上陣的心態踏出第一步；但切記設立停損點，別把盲目當作勇敢。',
    },
    reversed: {
      title: '猶豫不決與魯莽衝動的拉扯',
      keywords: ['魯莽行事', '過度冒險', '裹足不前', '缺乏準備'],
      energyMirror: '你感到一種被動的停滯，明明知道該變革，內在卻被莫名的恐懼釘在原地；或急於擺脫困局而做出了草率決定。',
      blindSpot: '逃避現實承擔。你可能把未經深思的衝動包裝成「隨緣」，或者因為害怕犯錯而乾脆不做決定。',
      actionAdvice: '停下腳步，重新檢視現實條件。問自己：「若失敗的最糟結果是什麼？我能否承受？」先做好安全繩再起跳。',
    },
  },
  {
    id: 1,
    name: '魔術師',
    nameEn: 'The Magician',
    symbol: '🪄',
    element: '風',
    upright: {
      title: '顯化現實的創生之力',
      keywords: ['主動創造', '資源整合', '溝通表達', '顯化法則'],
      energyMirror: '你桌上已具備土、水、火、風四項神器，象徵你的能力、人脈與資源其實早已齊全。你渴望展現掌控感，將抽象的靈感鍛造成具體成果。',
      blindSpot: '容易自恃才智過人而忽略團隊協同，或同時開啟過多戰場，導致精力分散無法深耕。',
      actionAdvice: '本週是你推動關鍵專案、對外溝通提案的黃金期。把精力聚焦在最重要的核心單點，全力以赴貫穿到底。',
    },
    reversed: {
      title: '才能錯用與溝通暗流',
      keywords: ['言過其實', '手忙腳亂', '隱瞞意圖', '能量阻滯'],
      energyMirror: '你可能感覺到自己的巧思被他人懷疑，或是自己明明說盡好話，事情發展卻與預期背道而馳，產生嚴重的無力感。',
      blindSpot: '急於求成時可能出現畫大餅、言語包裝過度。你試圖用技巧掩蓋實力不足，反而引發信任危機。',
      actionAdvice: '真誠是唯一的解藥。收起華麗話術，踏實地補齊缺失環節；對於不擅長的事務，勇於對外尋求專家協助。',
    },
  },
  {
    id: 2,
    name: '女祭司',
    nameEn: 'The High Priestess',
    symbol: '📜',
    element: '水',
    upright: {
      title: '深層直覺與靜默智慧',
      keywords: ['內在直覺', '秘密潛能', '洞察本質', '靜心以待'],
      energyMirror: '外在世界喧囂浮躁，但你的深層靈魂正召喚你回歸內在。你對人際動態有極其敏銳的第六感，但往往選擇隱忍不語。',
      blindSpot: '將直覺誤用為冷眼旁觀。過度封閉自我情感，可能讓身邊想幫助你的夥伴感到疏離與高冷。',
      actionAdvice: '信任你在安靜時刻閃過的第一直覺。本週避免在急躁的情緒下簽約或做出承諾，給自己一段獨處書寫時光。',
    },
    reversed: {
      title: '直覺失真與過度壓抑',
      keywords: ['內在焦慮', '過度理智', '忽視直覺', '暗處蜚語'],
      energyMirror: '你的內心正在掀起無聲風暴。你用理智死守著表面平靜，但身體緊繃與睡眠障礙已經在向你發出求救信號。',
      blindSpot: '把猜忌當成直覺。你可能因過去的背叛創傷，對眼前的人事物產生不客觀的預設立場。',
      actionAdvice: '深呼吸，讓緊縮的胃部放鬆。區分什麼是「客觀事實」，什麼是「腦中劇場」；主動與信任的摯友傾訴心事。',
    },
  },
  {
    id: 3,
    name: '皇后',
    nameEn: 'The Empress',
    symbol: '👑',
    element: '土',
    upright: {
      title: '豐饒繁盛與母性慈愛',
      keywords: ['財富豐饒', '滋養照顧', '感官喜悅', '自然孕育'],
      energyMirror: '這是一段能量飽滿、收穫在望的時刻。無論是生活、創作或財務，只要你過去曾細心灌溉，現在都即將迎來綻放。',
      blindSpot: '太習慣照顧他人、過度討好，導致自身能量耗竭；或沉溺於安逸舒適圈，忽視了未雨綢繆的必要性。',
      actionAdvice: '給予自己最好的感官療癒（精油沐浴、優質飲食或大自然漫步）。記得：先把自己注滿，愛才會自然溢向他人。',
    },
    reversed: {
      title: '滋養匱乏與過度控制',
      keywords: ['匱乏焦慮', '過度干涉', '忽視自我', '收穫延遲'],
      energyMirror: '你感到心累氣竭，覺得自己付出了那麼多，卻沒有換來同等的回報與感謝，內在滋生了微小的怨懟。',
      blindSpot: '用付出作為交換認同的手段。當你試圖掌控身邊人的生活時，其實源於你自身對失去控制的深層恐懼。',
      actionAdvice: '立刻停止為他人承擔不屬於你的責任。劃清心理邊界，把時間與資源重新收回投資在自己身上。',
    },
  },
  {
    id: 4,
    name: '皇帝',
    nameEn: 'The Emperor',
    symbol: '🏛️',
    element: '火',
    upright: {
      title: '穩固秩序與領袖權威',
      keywords: ['組織架構', '意志堅定', '世俗成就', '邊界防禦'],
      energyMirror: '現實要求你必須成為遮風擋雨的棟樑。你扛起了沈重的責任，在混亂局面中努力建立秩序與規則。',
      blindSpot: '缺乏彈性。為了捍衛權威與原則，你可能對異見採取打壓姿態，讓身邊的人因敬畏而不敢對你說真話。',
      actionAdvice: '建立清晰的 SOP 與時間管理日程。但在對人態度上，多一點傾聽與包容，真正的權威來自定海神針般的格局。',
    },
    reversed: {
      title: '權力濫用與失控焦慮',
      keywords: ['固執己見', '缺乏秩序', '挫敗失衡', '情緒化決策'],
      energyMirror: '你感到局勢正逐漸脫離你的掌控，下屬或家人的抗拒讓你備感挫折，自尊心受到強烈衝擊。',
      blindSpot: '外強中乾的恐慌防衛。當你用憤怒或強硬手段壓制反彈時，其實只是在掩飾自己的無措。',
      actionAdvice: '承認自己的局限性並不丟臉。適度下放權力，給予夥伴嘗試與犯錯的空間，組織反而能展現韌性。',
    },
  },
  {
    id: 5,
    name: '教皇',
    nameEn: 'The Hierophant',
    symbol: '⛪',
    element: '土',
    upright: {
      title: '神聖傳承與心靈導引',
      keywords: ['傳統價值', '良師益友', '精神皈依', '團體歸屬'],
      energyMirror: '你在人生十字路口渴望得到可靠的指引。傳統典章、體制規範或長輩貴人的智慧，將成為你最強大的靠山。',
      blindSpot: '過度盲從權威與教條，不敢質疑既有的規則，可能扼殺了更具突破性的創新解法。',
      actionAdvice: '主動向行業前輩、專業顧問或值得尊敬的長者請益；本週遵循正規合規的途徑辦事，切忌走灰色偏門。',
    },
    reversed: {
      title: '反骨打破與教條束縛',
      keywords: ['叛逆求變', '偽善質疑', '另闢蹊徑', '思想衝突'],
      energyMirror: '你受夠了道貌岸然的說教與僵化的官僚體制。你的靈魂渴望打破傳統束縛，走出自己的道路。',
      blindSpot: '為了反叛而反叛。若只是單純對抗體制而缺乏實質能力支撐，只會讓自己撞得頭破血流。',
      actionAdvice: '檢視你的反對是源於追求真正的價值，還是單純的情緒宣洩。在成熟評估代價後，再決定你的獨立路徑。',
    },
  },
  {
    id: 6,
    name: '戀人',
    nameEn: 'The Lovers',
    symbol: '❤️',
    element: '風',
    upright: {
      title: '靈魂契合與重大抉擇',
      keywords: ['真摯連結', '價值取捨', '身心和諧', '命運交會'],
      energyMirror: '你面臨一項涉及內在核心價值觀的關鍵選擇。這可能是一段宿命般的親密關係，或是一次事業與道德的深層試煉。',
      blindSpot: '貪戀兩全其美。試圖討好所有人往往導致失去自我，猶豫不決是當前最大的時間黑洞。',
      actionAdvice: '問你的心：「哪一個選擇更符合我希望成為的那個自己？」聽從內在召喚，真誠地做出取捨。',
    },
    reversed: {
      title: '溝通斷裂與價值分歧',
      keywords: ['理念不合', '誘惑動搖', '難以抉擇', '關係冷戰'],
      energyMirror: '在親密關係或合作夥伴間出現了冰冷的隔閡。彼此看似在同一艘船上，心靈卻已駛向完全不同的方向。',
      blindSpot: '將分歧歸咎於對方「變了」，忽視了自己在相處過程中缺乏真實表達與深層聆聽。',
      actionAdvice: '放下輸贏的心態，安排一次不被手機打擾的長談。如果價值觀已無法共融，和平退後一步也是一種成熟。',
    },
  },
  {
    id: 7,
    name: '戰車',
    nameEn: 'The Chariot',
    symbol: '🛡️',
    element: '水',
    upright: {
      title: '堅毅意志與克服逆境',
      keywords: ['全力以赴', '自律掌控', '攻克難關', '勝利在望'],
      energyMirror: '黑白兩匹斯芬克斯象徵你內在衝突的情緒與理智。現在你已經抓緊韁繩，準備衝過那段最艱難的泥濘之路。',
      blindSpot: '把緊繃當成效率。長期處於作戰備戰狀態，可能讓你脾氣變得急躁，容易與身邊的人擦槍走火。',
      actionAdvice: '設定具體的週目標，運用強大的自律心逐一攻克。只要方向明確，任何阻礙都只是磨礪心性的墊腳石。',
    },
    reversed: {
      title: '方向迷失與精力耗竭',
      keywords: ['失控衝撞', '疲憊挫折', '缺乏耐心', '外力受阻'],
      energyMirror: '你感到車輪陷入泥沼，明明油門踩到底，車子卻在原地空轉，內在充斥著狂躁與無力。',
      blindSpot: '用蠻力對抗現實大勢。當客觀時機未到時，一味硬闖只會白白損耗自己的戰力與威信。',
      actionAdvice: '立刻把腳從油門移開！這不是前進的時機，而是進廠檢修車況的時候。先休息補眠，重新校正指南針。',
    },
  },
  {
    id: 8,
    name: '力量',
    nameEn: 'Strength',
    symbol: '🦁',
    element: '火',
    upright: {
      title: '以柔克剛的心靈韌性',
      keywords: ['內在耐性', '慈悲包容', '情緒駕馭', '真實勇氣'],
      energyMirror: '白袍少女輕撫雄獅的利齒，象徵你學會了用溫柔與同理，化解外界兇猛的敵意或自己內在的狂躁衝動。',
      blindSpot: '過度隱忍吞聲。有時你把「息事寧人」誤當成「有修養」，可能導致底線被他人一步步踐踏。',
      actionAdvice: '面對衝突時保持微笑與堅定。不需要大聲咆哮，溫和而不可動搖的態度才是最高級的制敵之道。',
    },
    reversed: {
      title: '自我懷疑與本能失控',
      keywords: ['恐懼退縮', '暴躁宣洩', '缺乏自信', '精力低迷'],
      energyMirror: '你感到內在的猛獸正在反噬自己。長期的壓力讓你的耐心降到冰點，容易因為一句話而大發雷霆或暗自垂淚。',
      blindSpot: '逃避內心軟弱。你害怕承認自己「做不到」，這種對脆弱的恐懼反而讓你顯得格外緊繃刺人。',
      actionAdvice: '擁抱你內在受驚嚇的小孩。允許自己今天表現不完美，多做幾次深呼吸，把手放在心口對自己說聲「辛苦了」。',
    },
  },
  {
    id: 9,
    name: '隱士',
    nameEn: 'The Hermit',
    symbol: '🏮',
    element: '土',
    upright: {
      title: '獨處探索與自省明燈',
      keywords: ['退思省察', '尋求真理', '沈澱歸零', '內在光明'],
      energyMirror: '你主動走向人煙稀少的雪山之巔，提著六角星燈籠尋找靈魂真正的答案。你已經不在乎外界浮華的名利評價。',
      blindSpot: '過度避世孤立。若把沈思變成了逃避社會連結的藉口，可能會陷入哲學虛無與冷漠的陷阱。',
      actionAdvice: '給自己安排一整天的「數位排毒（Digital Detox）」。關掉通訊軟體，讀一本好書，讓思緒徹底澄清。',
    },
    reversed: {
      title: '孤芳自賞與社交孤立',
      keywords: ['自怨自艾', '拒絕溝通', '過度孤僻', '走不出死胡同'],
      energyMirror: '你把自己鎖在冰冷的象牙塔中，覺得世界上沒有人真正懂你，內在被無盡的孤獨與疏離感包圍。',
      blindSpot: '傲慢的偏見。你可能暗中認定外界所有人都是膚淺庸俗的，因而關閉了讓陽光照進心房的窗戶。',
      actionAdvice: '走出房間，去市場聞聞煙火氣，或主動問候一位老朋友。世界或許不完美，但真實的連結才能溫暖靈魂。',
    },
  },
  {
    id: 10,
    name: '命運之輪',
    nameEn: 'Wheel of Fortune',
    symbol: '☸️',
    element: '火',
    upright: {
      title: '天時轉折與命運契機',
      keywords: ['順應天時', '機遇降臨', '業力輪轉', '關鍵轉捩'],
      energyMirror: '輪盤轉動，命運的風向已經改變。長期的沈悶即將被一股不可抗拒的外力打破，新的機會正在破土而出。',
      blindSpot: '誤以為好運會永遠停留而放鬆警惕；或忽視了日常積累的因果業力在當前爆發的作用。',
      actionAdvice: '順水推舟，不要抗拒改變！當機會敲門時，立刻抓住它。記得在得勢時善待他人，為未來的輪轉積福。',
    },
    reversed: {
      title: '遭遇阻滯與因果盤整',
      keywords: ['運勢波折', '等待時機', '打破循環', '接受無常'],
      energyMirror: '事情進展不如預期，你感覺自己好像被命運開了玩笑，原本唾手可得的事物突然橫生枝節。',
      blindSpot: '把所有不如意歸咎於「運氣差」。你可能正在重複某個過去未曾真正學會的行為模式或人際死結。',
      actionAdvice: '既來之，則安之。無常是生命常態，與其抱怨命運不公，不如檢視：「這件事究竟要教會我什麼功課？」',
    },
  },
  {
    id: 11,
    name: '正義',
    nameEn: 'Justice',
    symbol: '⚖️',
    element: '風',
    upright: {
      title: '因果公道與清明抉擇',
      keywords: ['公平正義', '理智客觀', '契約規範', '業力清算'],
      energyMirror: '手中高舉雙刃劍與天平，象徵清晰無偏的判斷力。一分耕耘一分收穫，你即將收到你應得的結果與公正評價。',
      blindSpot: '過度冷酷非黑即白。法律與邏輯固然重要，但若全然抹煞人情溫度，往往會贏了道理卻輸了人心。',
      actionAdvice: '仔細審核所有合約條款與文書細節，確保每一步都合法合規。對待爭議，以事實為依據，不偏不倚。',
    },
    reversed: {
      title: '遭受不公與偏見盲目',
      keywords: ['合約糾紛', '判斷失誤', '推諉責任', '道德掙扎'],
      energyMirror: '你感到自己遭到了不公正的對待，或深陷於是非糾纏的官司合約爭議中，心中滿是委屈與不忿。',
      blindSpot: '雙重標準。當你指責他人不公時，是否也曾對自己的某些疏漏或失信睜一隻眼閉一隻眼？',
      actionAdvice: '保存完整證據鏈，尋求專業法律或公正第三方的介入。先為自己做錯的部分承擔責任，才能爭取最大的公道。',
    },
  },
  {
    id: 12,
    name: '倒吊人',
    nameEn: 'The Hanged Man',
    symbol: '🪢',
    element: '水',
    upright: {
      title: '轉換視角與臣服沈潛',
      keywords: ['暫時停滯', '換位思考', '自我犧牲', '靈性頓悟'],
      energyMirror: '被倒掛在生命之樹上，外表看似受困無助，頭頂卻散發著神聖光暈。這是一場靈魂的主動臣服，而非被動受戮。',
      blindSpot: '受害者情結。如果把這段沈潛期演化成向外界勒索同情的「苦肉計」，只會讓自己的格局變得狹隘。',
      actionAdvice: '停止徒勞無功的掙扎！當局勢不允許你前進時，靜靜倒過來看世界，你會發現過去未曾注意到的全新盲點。',
    },
    reversed: {
      title: '無謂犧牲與抗拒教訓',
      keywords: ['白費心機', '固步自封', '執迷不悟', '自我折磨'],
      energyMirror: '你感到自己的犧牲完全沒有意義，像是在一場注定沈沒的船上不斷舀水，除了自我消耗之外別無所獲。',
      blindSpot: '捨不得沉沒成本。你明明知道該抽身，卻因為「已經投入太多時間金錢」而繼續深陷泥沼。',
      actionAdvice: '勇敢解開腳上的繩索！停止做無謂的烈士。學會對不值得的人事物及時止損，你的生命值得更有尊嚴的綻放。',
    },
  },
  {
    id: 13,
    name: '死神',
    nameEn: 'Death',
    symbol: '⏳',
    element: '水',
    upright: {
      title: '徹底終結與新生蛻變',
      keywords: ['告別過去', '徹底轉型', '脫胎換骨', '清理重生'],
      energyMirror: '舊時代的帷幕已經沈沈落下。雖然割捨讓人陣痛，但唯有枯萎的枝葉徹底化為春泥，新芽才有破土而出的空間。',
      blindSpot: '死抱著腐爛的過往不放。試圖給已經死去的關係或模式做「人工呼吸」，只會延長你的痛苦。',
      actionAdvice: '舉行一次微小的告別儀式（如丟棄舊信物、刪除封存無意義的對話紀錄）。大膽向過去說再見，準備迎接新生。',
    },
    reversed: {
      title: '抗拒改變與苟延殘喘',
      keywords: ['懼怕失去', '拖泥帶水', '苟延殘喘', '無法自拔'],
      energyMirror: '你明知道一切已經走到了盡頭，但恐懼如同寒冰將你凍結在原地，寧願忍受慢性折磨也不敢踏出那一步。',
      blindSpot: '以為維持現狀就是安全。現實中，最危險的處境往往是待在一座即將倒塌的危樓裡。',
      actionAdvice: '長痛不如短痛。勇敢剪斷那條讓你窒息的牽絆，給自己三個月的療傷期，你會發現天從來沒有塌下來。',
    },
  },
  {
    id: 14,
    name: '節制',
    nameEn: 'Temperance',
    symbol: '🪽',
    element: '火',
    upright: {
      title: '中庸調和與身心平衡',
      keywords: ['動態平衡', '融合轉化', '耐性調適', '療癒淨化'],
      energyMirror: '大天使一腳踏在水裡、一腳踏在岸上，手中的聖水在金銀兩只水杯間優雅流淌。你正處於極致的和諧與自癒狀態。',
      blindSpot: '過度追求中庸可能導致缺乏鋒芒，在需要決絕表態的商場戰役中顯得曖昧模糊。',
      actionAdvice: '練習在極端的兩者間尋求第三種解法（雙贏架構）。調整作息飲食，讓水分與睡眠帶走體內累積的毒素。',
    },
    reversed: {
      title: '失衡失調與溝通短路',
      keywords: ['極端失控', '身心失衡', '缺乏耐心', '理念衝突'],
      energyMirror: '你的天平嚴重傾斜。可能是工作佔據了所有生活，或是情緒像過山車般大起大落，身體正在發出發炎的警訊。',
      blindSpot: '用極端的行為來填補內心空虛（如報復性熬夜、過度暴飲暴食或瘋狂消費）。',
      actionAdvice: '立刻煞車！今天提早一小時上床睡覺。把日程表上的非必要事項刪除 30%，重新找回生活的呼吸節奏。',
    },
  },
  {
    id: 15,
    name: '惡魔',
    nameEn: 'The Devil',
    symbol: '⛓️',
    element: '土',
    upright: {
      title: '執念束縛與慾望誘惑',
      keywords: ['物質執著', '有毒關係', '短利誘惑', '隱蔽成癮'],
      energyMirror: '頸上的鎖鏈其實很寬鬆，只要願意隨時可以脫下。但你可能被巨大的金錢利益、感官激情或權力慾望所綁架。',
      blindSpot: '自我合理化。你告訴自己「我只是暫時委屈一下」，但不知不覺中已經出賣了自己的核心靈魂價值。',
      actionAdvice: '審視你目前深陷其中的合約、投資或親密關係：它帶給你的是真正的力量，還是讓你每晚難以安枕的恐懼？',
    },
    reversed: {
      title: '打破枷鎖與重獲自由',
      keywords: ['覺醒解套', '看清真相', '戒除依賴', '找回主權'],
      energyMirror: '你終於看清了謊言的本質。那層虛假的光環褪去，你意識到這段有毒的牽絆正在摧毀你，你渴望逃離。',
      blindSpot: '戒斷期的陣痛與動搖。當對方施以微小恩惠或哀求時，你容易心軟再次跌入深淵。',
      actionAdvice: '斬斷所有幻想！封鎖有毒對象的聯絡方式，堅定地走出那扇門。只要你願意，沒有人能囚禁一個覺醒的靈魂。',
    },
  },
  {
    id: 16,
    name: '高塔',
    nameEn: 'The Tower',
    symbol: '⚡',
    element: '火',
    upright: {
      title: '驟變崩塌與虛妄打破',
      keywords: ['突發震撼', '謊言粉碎', '幻象破滅', '被迫重啟'],
      energyMirror: '晴天霹靂擊中了建立在流沙上的巴別塔。那些建立在虛妄傲慢、粉飾太平之上的事物，正在面臨不可抗拒的坍塌。',
      blindSpot: '試圖修補注定毀滅的危樓。當天意要你打碎重來時，死守殘垣斷壁只會讓你受傷更重。',
      actionAdvice: '這不是世界末日，而是命運在為你掃除阻礙！坦然接受現狀的瓦解，深呼吸，真正的真金不怕烈火淬煉。',
    },
    reversed: {
      title: '災後餘波與抗拒崩塌',
      keywords: ['苟且偷安', '逃過一劫', '恐懼後怕', '重建延宕'],
      energyMirror: '最劇烈的震盪看似過去，但廢墟仍在冒著黑煙。你心中充滿了劫後餘生的驚魂未定，不知該往何處去。',
      blindSpot: '因為恐懼再次受傷而不敢動手清理現場。逃避直視問題只會讓傷口在暗中持續潰爛。',
      actionAdvice: '挽起袖子，從廢墟中挑選依然完好的基石。這是一次重新打造堅固人生的機會，這一次，把地基打得更深更牢。',
    },
  },
  {
    id: 17,
    name: '星星',
    nameEn: 'The Star',
    symbol: '⭐',
    element: '風',
    upright: {
      title: '希望曙光與靈性療癒',
      keywords: ['希望重現', '靈感湧現', '平靜澄澈', '宇宙恩典'],
      energyMirror: '風暴已過，夜空中最亮的大星靜靜閃爍。裸女將生命之泉倒向大地與河流，象徵無私的奉獻與源源不絕的滋養。',
      blindSpot: '理想過於崇高遠大，忽視了現實落地的執行細節；把希望寄託於遙遠的未來而怠忽眼前的事物。',
      actionAdvice: '保持樂觀與信心，宇宙正在為你鋪路。本週非常適合從事藝術創作、身心靈療癒或為自己制定長期願景。',
    },
    reversed: {
      title: '信心動搖與期望落空',
      keywords: ['迷失方向', '悲觀失望', '才思枯竭', '忽視善意'],
      energyMirror: '夜空中烏雲密佈，你看不到前方的光。長期的努力似乎石沉大海，內在被一股深沉的失望與無助所籠罩。',
      blindSpot: '以偏概全的絕望。只要一次失敗，你就急著宣判自己「一輩子都不會幸福」，陷入習得性無助。',
      actionAdvice: '即使在最黑暗的夜裡，星星也依然在那裡，只是被雲層遮蔽。專注做好今天的一件小事，信心會慢慢回流。',
    },
  },
  {
    id: 18,
    name: '月亮',
    nameEn: 'The Moon',
    symbol: '🌙',
    element: '水',
    upright: {
      title: '潛意識迷霧與不安幻象',
      keywords: ['焦慮恐懼', '隱秘未明', '情緒波動', '幻相迷蹤'],
      energyMirror: '狼與犬在月下嚎叫，龍蝦從幽暗水底浮出。周遭充滿了不確定性與欺騙，你常在深夜被莫名的焦慮與噩夢驚醒。',
      blindSpot: '被自己的恐懼嚇退。很多時候，你害怕的並不是現實問題，而是自己腦中無限放大的恐怖片劇場。',
      actionAdvice: '不要在夜深人靜或情緒激動時做任何重大決定！點一盞溫暖的燈，把擔憂一條條寫在紙上，白晝到來時迷霧自散。',
    },
    reversed: {
      title: '真相大白與迷霧散去',
      keywords: ['揭開謊言', '克服恐懼', '走出低谷', '撥雲見日'],
      energyMirror: '第一道晨曦正刺破黑夜。那些曾經讓你寢食難安的秘密、謠言或猜忌，真相即將水落石出。',
      blindSpot: '面對殘酷真相時的心碎與不敢置信。有時我們寧願待在謊言的溫床裡，也不想面對清醒的刺痛。',
      actionAdvice: '勇敢直視真相。無論現實有多骨感，都比活在猜忌中更有力量。清理有毒的人際幻象，腳踏實地前行。',
    },
  },
  {
    id: 19,
    name: '太陽',
    nameEn: 'The Sun',
    symbol: '☀️',
    element: '火',
    upright: {
      title: '光明熾熱與豐盛喜悅',
      keywords: ['成功勝利', '純真熱忱', '活力充沛', '備受肯定'],
      energyMirror: '金黃陽光普照萬物，赤裸孩童騎在白馬上展開笑顏。你的生命力正處於最高峰，任何陰霾都將被這股純粹的光芒融化。',
      blindSpot: '過於鋒芒畢露引起他人嫉妒，或過於自信自滿而忽略了旁人的感受與處境。',
      actionAdvice: '盡情展現你的才華與熱情！現在是爭取升遷、公開發表或慶祝成果的最佳時刻。記得用溫暖的光芒去照亮他人。',
    },
    reversed: {
      title: '暫時烏雲與過度消耗',
      keywords: ['暫時延遲', '精力過耗', '盲目自大', '缺乏耐心'],
      energyMirror: '太陽依然耀眼，但天空中飄來了一片烏雲。成果雖然沒有如預期般盛大，但實質收穫依然值得欣喜。',
      blindSpot: '期待過高引發落差感；或燃燒過度導致身心處於過勞邊緣。',
      actionAdvice: '調低不切實際的期望值。慶祝那些微小的進步，給自己放個小假曬曬太陽，補充消耗殆盡的陽性能量。',
    },
  },
  {
    id: 20,
    name: '審判',
    nameEn: 'Judgement',
    symbol: '📯',
    element: '火',
    upright: {
      title: '靈魂覺醒與重大重生',
      keywords: ['命運召喚', '洗心革面', '業力清白', '關鍵裁決'],
      energyMirror: '天使吹響最後的號角，死者從墓穴中甦醒歡呼。過去所有的付出與委屈都在這一刻得到蓋棺定論的平反與釋放。',
      blindSpot: '對過去的錯誤緊抓不放、反覆自責，無法坦然原諒自己與他人。',
      actionAdvice: '響應你靈魂最深處的天命召喚！放下所有過往的包袱與悔恨，以全新升級的姿態展開人生的下一個篇章。',
    },
    reversed: {
      title: '逃避召喚與自怨自艾',
      keywords: ['猶豫錯失', '害怕審判', '拒絕悔改', '沉溺過去'],
      energyMirror: '號角聲已在耳邊響徹，你卻捂住耳朵假裝聽不見。你害怕面對過去的錯誤，因而錯失了最佳的重生時機。',
      blindSpot: '害怕承擔改變的代價。你把一切託詞為「命運弄人」，其實只是自己不敢跨出舒適圈。',
      actionAdvice: '誠實地面對自己的良心與過失。真誠地道歉、勇敢地補償，只有真正放下愧疚，你才能重新挺直腰桿。',
    },
  },
  {
    id: 21,
    name: '世界',
    nameEn: 'The World',
    symbol: '🌍',
    element: '土',
    upright: {
      title: '圓滿大成與全新維度',
      keywords: ['圓滿成功', '整合無瑕', '世界視野', '升級跨界'],
      energyMirror: '桂冠花環圍繞著勝利女神，四角守護神獸齊聚祝福。一段漫長而艱辛的英雄之旅終於抵達完美終點，格局徹底蛻變。',
      blindSpot: '沉醉於勝利的光環無法走出，忽視了「終點即是下一個起點」的生命實相。',
      actionAdvice: '好好犒賞並感謝一路走來不曾放棄的自己！享受當下的圓滿，然後張開雙臂，準備迎接更廣闊的世界版圖。',
    },
    reversed: {
      title: '臨門一腳與未竟之志',
      keywords: ['欠缺缺憾', '延遲完成', '眼高手低', '封閉視野'],
      energyMirror: '事情已經完成了 95%，但就是差了關鍵的臨門一腳。你感到某種美中不足的遺憾，遲遲無法真正劃下句點。',
      blindSpot: '過度完美主義作祟。因為害怕最後的成果不如預期，反而在終點線前故意放慢速度拖延。',
      actionAdvice: '「完成優於完美！」深吸一口氣，把最後的收尾工作做完。先推向世界接受檢驗，再持續迭代優化。',
    },
  },
];

// ==========================================
// 2. 民間擲筊占卜 (Bwa Bwei / Moon Blocks)
// ==========================================
export type BwaBweiResultType = 'sheng' | 'xiao' | 'yin' | 'li';

export interface BwaBweiOutcome {
  type: BwaBweiResultType;
  name: string;
  blockState: { left: 'flat' | 'convex'; right: 'flat' | 'convex' } | 'upright';
  title: string;
  summary: string;
  psychology: {
    energyMirror: string;
    blindSpot: string;
    actionAdvice: string;
  };
}

export const BWA_BWEI_OUTCOMES: Record<BwaBweiResultType, BwaBweiOutcome> = {
  sheng: {
    type: 'sheng',
    name: '聖杯（一正一反）',
    blockState: { left: 'flat', right: 'convex' },
    title: '天地交泰・神意允可',
    summary: '一凸一平，陰陽相契。代表神明應允、事情方向正確、天時地利漸趨成熟。',
    psychology: {
      energyMirror: '你內在的直覺與客觀現實達成了高度共振。這件事並非你一廂情願的空想，而是具備實踐的土壤與契機。',
      blindSpot: '切忌因為獲得肯定而生傲慢放鬆之心。天助自助者，神明的應允代表大門為你開啟，但路仍需自己一步一腳印踩實。',
      actionAdvice: '放下猶豫，按照既定計畫穩健推進。保持感恩謙遜之心，行事堂堂正正，自然水到渠成。',
    },
  },
  xiao: {
    type: 'xiao',
    name: '笑杯（雙反・兩面皆平）',
    blockState: { left: 'flat', right: 'flat' },
    title: '心念未定・方向模糊',
    summary: '兩瓣皆平朝上，代表神明微笑不語。多因所求之事尚無定見、時機未到，或提問者內心游移不決。',
    psychology: {
      energyMirror: '你的心態正處於矛盾與試探之中。你可能自己都還沒想清楚到底要什麼，或者心中早有執念，擲筊只是想尋求安慰。',
      blindSpot: '企圖把人生的重大抉擇推給命運或神明代勞。當你無法為自己的決定負起全責時，宇宙也無法給你明確的答案。',
      actionAdvice: '不必沮喪！請先喝一口溫水，讓浮躁的心情安靜下來。釐清你真正的核心訴求，把問題縮小具體化後，再重新請示。',
    },
  },
  yin: {
    type: 'yin',
    name: '陰杯 / 怒杯（雙正・兩面皆凸）',
    blockState: { left: 'convex', right: 'convex' },
    title: '警示阻滯・不宜妄動',
    summary: '兩瓣皆凸朝上，代表神意不允、時機不對，或此行恐有暗礁凶險，勸君三思暫緩。',
    psychology: {
      energyMirror: '客觀條件尚未成熟，或者眼前的道路存在你看不到的巨大隱患。神明的否定，實則是對你最慈悲的及時踩煞車。',
      blindSpot: '執著於立即見效的速成利益。你可能被眼前的情緒或短利蒙蔽，無視了背後需要承擔的沉重代價。',
      actionAdvice: '切莫意氣用事強行推進！暫停原定行動，重新檢視契約條款、合作人選或健康狀況。塞翁失馬，焉知非福。',
    },
  },
  li: {
    type: 'li',
    name: '立杯（極罕見之千載吉兆）',
    blockState: 'upright',
    title: '天地驚動・罕見神蹟',
    summary: '筊杯騰空落下後竟直立不倒！民俗上代表地靈人傑、至誠通天，或有極特殊之神聖護持。',
    psychology: {
      energyMirror: '你的至誠心念已穿透世俗雜念，觸碰到了深層的宇宙智慧之網。當前所謀劃之事具有重大深遠的生命意義。',
      blindSpot: '奇蹟降臨時切莫迷失於神祕主義。越是深厚的福報，越需要以更大的德行與善念來承載。',
      actionAdvice: '雙手合十感恩神恩。發願在事情圓滿之後廣行善事、回饋社會。今日所許之善願，必蒙龍天護法加持。',
    },
  },
};

// 連續三次聖杯觸發之「天賜神諭籤詩」
export const ORACLE_LOTS = [
  {
    title: '天官賜福・萬善同歸',
    verse: '雲開月出正分明，不須進退問前程；\n花開富貴平生事，富貴榮華自此興。',
    interpretation: '大吉之兆。三聖允諾，代表天時、地利、人和皆已齊聚。過去所受之委屈已化為福田，事業名利婚姻皆現轉機，宜心存正念全力開拓。',
  },
  {
    title: '貴人相扶・枯木逢春',
    verse: '風恬浪靜可行舟，恰是中秋月一輪；\n凡事不須多憂慮，福祿重重生吉祥。',
    interpretation: '平步青雲之象。原本卡關僵持之局即將迎來貴人解圍。只要堅守誠信道德，不爭一時之快，自然得天地之助。',
  },
  {
    title: '潛龍騰淵・化險為夷',
    verse: '一年作事急如飛，君爾寬心莫遲疑；\n貴人指引登高處，萬里鵬程在此時。',
    interpretation: '蓄勢待發之吉兆。當前正是破繭而出的關鍵節點。只要目標堅定，不為旁人閒言雜語所動，定能開創全新版圖。',
  },
];

// ==========================================
// 3. 線上文鳥鳥卦 (Bird Divination)
// ==========================================
export interface BirdLot {
  id: number;
  hexagramName: string; // 易經卦名
  auspiciousLevel: '大吉' | '上吉' | '中平' | '守成' | '慎微';
  luckyDirection: string; // 貴人方位
  taboos: string; // 忌諱作法
  poem: string; // 籤詩四句
  plainExplanation: string; // 白話解籤
  psychology: {
    energyMirror: string;
    blindSpot: string;
    actionAdvice: string;
  };
}

export const BIRD_LOTS: BirdLot[] = [
  {
    id: 1,
    hexagramName: '乾為天・飛龍在天卦',
    auspiciousLevel: '大吉',
    luckyDirection: '西北方（乾位・金）',
    taboos: '忌剛愎自用、忌目空一切無視基層',
    poem: '靈鳥銜籤報佳音，龍蟠鳳逸正逢春；\n莫疑時運多蹭蹬，青雲直上萬里心。',
    plainExplanation: '乾陽大動，君子展翼。小文鳥自籤筒叼出此乾卦，預示名利兩全、大展宏圖之時機已至。凡事宜主動積極，光明磊落必獲重用。',
    psychology: {
      energyMirror: '你蓄積已久的才華與能量正在噴發。你渴望在更大的舞台上證明自己，內在充滿了一展抱負的豪情。',
      blindSpot: '亢龍有悔。當身處高位或一帆風順時，最容易因為自尊心過強而聽不進忠告，導致身邊缺乏真正的諍友。',
      actionAdvice: '把握未來的 45 天關鍵期，大膽爭取核心主導權。但待人接物務必放低身段，尊賢容眾方能長治久安。',
    },
  },
  {
    id: 2,
    hexagramName: '坤為地・厚德載物卦',
    auspiciousLevel: '上吉',
    luckyDirection: '西南方（坤位・土）',
    taboos: '忌急躁冒進、忌強出鋒頭爭奪首功',
    poem: '坤德含弘育萬物，柔順從容自獲祿；\n安貧樂道靜以俟，水到渠成福壽具。',
    plainExplanation: '大地承載，柔順包容。此卦重在蓄積實力與守候時機。凡事以退為進、甘居幕後，往往能獲得比站在台前更長久的利益。',
    psychology: {
      energyMirror: '你的心靈需要沈靜與滋養。近期你可能感覺周圍節奏過快，讓你有些無所適從，渴望有一片安穩的立足之地。',
      blindSpot: '誤以為退讓就是軟弱。若缺乏內在力量的退讓，只會變成毫無原則的被動挨打。',
      actionAdvice: '本週做好後勤與地基工作。先當一個優秀的配合者與執行者，讓時間去證明你的不可替代性。',
    },
  },
  {
    id: 3,
    hexagramName: '水雷屯・破土初生卦',
    auspiciousLevel: '中平',
    luckyDirection: '正北方（坎位・水）',
    taboos: '忌孤軍奮戰、忌未查明細節前大額投資',
    poem: '草木萌芽遇春寒，初時艱難莫心酸；\n得遇春風吹雨露，他日參天立世間。',
    plainExplanation: '種子破土，春寒料峭。文鳥叼出屯卦，意味著萬事起頭難。眼前的混亂與挑戰是新生命誕生的必經陣痛，切莫輕言放棄。',
    psychology: {
      energyMirror: '你正面臨創業、轉職或新關係初期的千頭萬緒。資源匱乏與經驗不足讓你備感煎熬，經常懷疑自己的選擇。',
      blindSpot: '急於求成。企圖在第一個月就看到豐厚回報，只會讓你的焦慮壓垮原本健康的萌芽。',
      actionAdvice: '積極尋找導師與合作夥伴，切忌獨自硬扛。將大目標拆解成每日可以完成的小任務，積小勝為大勝。',
    },
  },
  {
    id: 4,
    hexagramName: '山水蒙・啟蒙待時卦',
    auspiciousLevel: '慎微',
    luckyDirection: '東北方（艮位・土）',
    taboos: '忌不懂裝懂、忌以投機取巧心態對待專業',
    poem: '山下出泉霧迷濛，童蒙求我問吉凶；\n恭敬虔誠求解惑，智慧大開路路通。',
    plainExplanation: '山泉出谷，迷霧遮道。代表眼前局勢撲朔迷離，乃因自身認知尚有盲區。此時宜虛心受教，不可憑藉主觀臆測妄下結論。',
    psychology: {
      energyMirror: '你感到迷茫而焦慮，市場或對手的打法讓你看不清底細，有一種被矇在鼓裡的挫敗感。',
      blindSpot: '死要面子。害怕被人看穿自己的不懂，因而錯失了向真正的高手請教求援的最佳時機。',
      actionAdvice: '把心空出來，像個小學生一樣去學習。花學費向專家諮詢，或者研讀相關專業法規，認知到位了迷霧自然消散。',
    },
  },
  {
    id: 5,
    hexagramName: '水天需・耐性守候卦',
    auspiciousLevel: '守成',
    luckyDirection: '正西方（兌位・金）',
    taboos: '忌焦躁暴食、忌因等待而自暴自棄',
    poem: '雲上於天雨未降，飲食宴樂且安康；\n耐心守候天時轉，甘霖普降潤滄浪。',
    plainExplanation: '天上有雲，甘霖在望。需者，等待也。所謀之事方向無差，唯時機尚未成熟。當前最佳策略為修養生息、以逸待勞。',
    psychology: {
      energyMirror: '你已經做好了所有準備，但審核、放款或對方的回覆遲遲不來，這種被吊在半空的感覺讓你身心俱疲。',
      blindSpot: '把等待時間浪費在無謂的焦慮刷手機上，徒增內耗卻無助於事態發展。',
      actionAdvice: '去吃一頓美味的餐點，好好睡個飽覺。把注意力轉移到次要專案上，時機成熟時通知自會降臨。',
    },
  },
  {
    id: 6,
    hexagramName: '天火同人・同心協力卦',
    auspiciousLevel: '大吉',
    luckyDirection: '正南方（離位・火）',
    taboos: '忌私相授受、忌排擠異己搞小圈子',
    poem: '同人於野志相同，大同世界樂融融；\n君子同心金可斷，合夥謀求建奇功。',
    plainExplanation: '天下大同，志同道合。文鳥叼出同人卦，是大興合夥、社群凝聚之絕佳神籤。凡事公開透明，得眾人之力必成大業。',
    psychology: {
      energyMirror: '你意識到單打獨鬥的局限性，渴望找到靈魂頻率一致的合夥人或團隊，共同打一場漂亮的戰役。',
      blindSpot: '以為志趣相投就不需要契約約束。模糊的利益分配是日後朋友反目成仇的最常見根源。',
      actionAdvice: '本週積極參加產業交流會或社群聚會。遇到合適的夥伴，第一時間落實白紙黑字的合約與權責劃分。',
    },
  },
];

// ==========================================
// 4. 易經米卦占卜 (Rice Divination)
// ==========================================
export interface TrigramInfo {
  number: number;
  name: string;
  nature: string;
  element: string;
  symbol: string;
}

export const BAGUA_MAP: Record<number, TrigramInfo> = {
  1: { number: 1, name: '乾', nature: '天', element: '金', symbol: '☰' },
  2: { number: 2, name: '兌', nature: '澤', element: '金', symbol: '☱' },
  3: { number: 3, name: '離', nature: '火', element: '火', symbol: '☲' },
  4: { number: 4, name: '震', nature: '雷', element: '木', symbol: '☳' },
  5: { number: 5, name: '巽', nature: '風', element: '木', symbol: '☴' },
  6: { number: 6, name: '坎', nature: '水', element: '水', symbol: '☵' },
  7: { number: 7, name: '艮', nature: '山', element: '土', symbol: '☶' },
  8: { number: 8, name: '坤', nature: '地', element: '土', symbol: '☷' },
};

export interface HexagramRiceResult {
  hexagramKey: string;
  name: string;
  upperTrigram: TrigramInfo;
  lowerTrigram: TrigramInfo;
  movingLine: number; // 動爻 1~6
  transformedHexagramName: string; // 變卦名稱
  judgment: string; // 卦辭
  energyMirror: string;
  blindSpot: string;
  actionAdvice: string;
}

// 六十四卦米卦核心精選庫
export function calculateRiceHexagram(
  riceCount1: number,
  riceCount2: number,
  riceCount3: number
): HexagramRiceResult {
  const upperNum = riceCount1 % 8 === 0 ? 8 : riceCount1 % 8;
  const lowerNum = riceCount2 % 8 === 0 ? 8 : riceCount2 % 8;
  const movingLine = riceCount3 % 6 === 0 ? 6 : riceCount3 % 6;

  const upper = BAGUA_MAP[upperNum];
  const lower = BAGUA_MAP[lowerNum];

  const key = `${upper.name}${lower.name}`;

  // 典型卦象對照表
  const hexagramLibrary: Record<string, { name: string; transName: string; judgment: string; mirror: string; blind: string; advice: string }> = {
    乾乾: {
      name: '乾為天',
      transName: '天澤履 / 變動演化卦',
      judgment: '元亨利貞。天行健，君子以自強不息。剛健純粹，大展宏圖。',
      mirror: '你體內蘊藏著極大的企圖心與抗壓韌性，目前正處於能量的高峰期，渴望主導大局。',
      blind: '過剛易折。當你以純陽之力橫衝直撞時，往往會刺傷身邊需要被照顧的合作者。',
      advice: '保持剛健的同時學會以柔克剛，在動爻所示之時序上多做傾聽，方能保全大局。',
    },
    坤坤: {
      name: '坤為地',
      transName: '地雷復 / 變動演化卦',
      judgment: '元亨，利牝馬之貞。地勢坤，君子以厚德載物。包容承載，順應天時。',
      mirror: '你承擔了許多幕後的繁雜事務，雖然辛勞默默無聞，但你正在累積深厚的人脈與口碑資產。',
      blind: '過度退縮放棄主動權。長期處於被動隨緣狀態，可能讓原本屬於你的機會被強勢者奪走。',
      advice: '以寬厚的心態對待身邊人事，但在核心原則問題上必須有自己的底線。',
    },
    坎坎: {
      name: '習坎卦',
      transName: '水澤節 / 變動演化卦',
      judgment: '有孚，維心亨，行有尚。重重險阻，唯有誠信堅定方能出險。',
      mirror: '你感到自己彷彿深陷重重迷局，走出一道難關又迎來新的考驗，心理防線即將到達極限。',
      blind: '恐慌亂動。在深水暗流中盲目掙扎，只會加速體力耗盡，更容易被漩渦吞沒。',
      advice: '保持內心清明。不說假話、不做虧心事，堅守信用慢慢挪步，險境自會化為坦途。',
    },
    離離: {
      name: '離為火',
      transName: '火雷噬嗑 / 變動演化卦',
      judgment: '利貞，亨。畜牝牛，吉。光明依附，柔順亨通。明察秋毫，宜守正道。',
      mirror: '你具備極佳的洞察力與表現欲，熱情四溢，但在光芒璀璨的同時，也容易引來周圍審視的目光。',
      blind: '情緒熱度來得快去得也快，缺乏持久耐性，容易因為三分鐘熱度而留下爛攤子。',
      advice: '尋找值得長期依附的穩固平台（如成熟企業或有威望的領袖），讓火有所依附才能長明不滅。',
    },
    泰坤: {
      name: '地天泰',
      transName: '地澤臨 / 變動演化卦',
      judgment: '小往大來，吉亨。天地交而萬物通，上下交而其志同。天下太平之象。',
      mirror: '氣運亨通，內在與外在環境達成了極度和諧，貴人提攜，前路豁然開朗。',
      blind: '居安忘危。「無平不陂，無往不復」，在極度順境中容易揮霍資源，遺忘未雨綢繆。',
      advice: '抓緊順風期佈局長遠資產與防禦性架構，在巔峰時善待他人，為未來的週期累積福報。',
    },
  };

  const matched = hexagramLibrary[key] || {
    name: `${upper.nature}${lower.nature}卦（${upper.name}上${lower.name}下）`,
    transName: '動爻化生之變卦',
    judgment: `上卦為${upper.nature}（${upper.element}），下卦為${lower.nature}（${lower.element}），動爻在第 ${movingLine} 爻。陰陽交替，剛柔相推，變化無窮。`,
    mirror: `當前事物外在呈現【${upper.nature}】的特徵，內在蘊含【${lower.nature}】的能量。第 ${movingLine} 爻的變動提示你正處於事情由量變走向質變的關鍵拐點。`,
    blind: '忽視局勢的動態轉移。死守過去的成功經驗，容易被新出現的變因打個措手不及。',
    advice: `依據動爻指示，第 ${movingLine} 爻變動象徵「順應局勢、及時調整」。本週重在彈性應變，切忌固執己見。`,
  };

  return {
    hexagramKey: key,
    name: matched.name,
    upperTrigram: upper,
    lowerTrigram: lower,
    movingLine,
    transformedHexagramName: matched.transName,
    judgment: matched.judgment,
    energyMirror: matched.mirror,
    blindSpot: matched.blind,
    actionAdvice: matched.advice,
  };
}
