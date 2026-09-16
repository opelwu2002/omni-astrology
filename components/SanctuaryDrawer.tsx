'use client';

/**
 * 跨宗教心靈神聖處方箋與破局抽屜組件 (SanctuaryDrawer)
 * 解決消費心理學「情緒容器」與「神聖外部力量錨定」需求：
 * 分頁 1：破局實戰行動指南 (落地 SOP 與 72 小時防踩雷檢核表)
 * 分頁 2：跨宗教心靈寄託指引 (漢傳佛教、道教民間、天主教/基督、東南亞神祇)
 * 分頁 3：每日能量心理暗示 (睡前 3 分鐘顯化練習與認知重塑)
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CrossFaithSanctuary } from '@/types/astrology';
import {
  X,
  Compass,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckSquare,
  Square,
  BookOpen,
  Copy,
  Check,
  Flame,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';

interface SanctuaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profileName?: string;
  sanctuary?: CrossFaithSanctuary;
  actionChecklist?: string[];
  mindfulnessMantra?: string;
}

export default function SanctuaryDrawer({
  isOpen,
  onClose,
  profileName = '命主',
  sanctuary,
  actionChecklist,
  mindfulnessMantra,
}: SanctuaryDrawerProps) {
  const [activeTab, setActiveTab] = useState<'action' | 'faith' | 'manifest'>('faith');
  const [copiedMantra, setCopiedMantra] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const defaultChecklist = actionChecklist || [
    '【立即止血】：啟動「72 小時重大財務與人生決策冷卻期」，凡涉及非必要開支或衝動轉職，強制暫緩拍板。',
    '【信息斷捨離】：今晚起連續 3 天，睡前 1 小時徹底遠離社交媒體與消耗型爭端群組，降低大腦皮質醇濃度。',
    '【公事公辦白紙黑字】：對外所有涉及金錢、借貸或承諾之事，一律留下文字對話備份或正式協議，拒絕人情勒索。',
    '【向內安撫肉身】：連續 7 天每日飲用溫熱紅棗枸杞或四神湯，晚上 11 點前就寢，給受創的腎上腺修復時間。',
    '【神聖發願回向】：挑選一間令你心生安寧之正統大廟或教堂靜坐 15 分鐘，將無法控制的事全盤交託，發願行一件善事。',
  ];

  const defaultMantra =
    mindfulnessMantra ||
    '「親愛的天地與更高自我，我接納生命的流動。凡此刻發生的逆境，皆是為了淬鍊我更深層的慈悲與力量；我放下緊抓不放的焦慮，深信神聖的眷顧正在護持我穿越風暴。」';

  const handleCopyMantra = () => {
    navigator.clipboard.writeText(defaultMantra);
    setCopiedMantra(true);
    setTimeout(() => setCopiedMantra(false), 2500);
  };

  // 若尚未傳入特定 sanctuary，提供預設的高維安心處方
  const currentSanctuary = sanctuary || {
    buddhism: {
      deity: '大悲觀世音菩薩 / 準提觀音菩薩',
      mantra: '【準提神咒】「唵 折隸 主隸 準提 娑婆訶」及【心經】「照見五蘊皆空，度一切苦厄」',
      ritual: '清晨面向東方端坐，數息 21 次，觀想藍色琉璃清涼光輝自頭頂灌注全身，撫平焦慮神經。',
      psychologicalReframing: '逆境並非懲罰，而是靈魂提醒你「該停下來更新心智認知架構」的慈悲鐘聲。',
    },
    taoism: {
      deity: '關聖帝君 (協天大帝) / 天上聖母 (媽祖娘娘)',
      petitionGuide: '至帝君或聖母案前點香三炷，據實陳述當前困境，不求不義之偏財，只求「破除心魔奸佞、心神朗照、正直立世」。',
      templeAction: '向廟方求取平安符過爐佩戴，立誓若安度此劫，必提撥所得行善利他，轉被動焦慮為主動向善。',
    },
    christianity: {
      scripture: '【詩篇 23:1-4】「耶和華是我的牧者，我必不致缺乏... 我雖然行過死陰的幽谷，也不怕遭害，因為祢與我同在。」',
      archangelOrSaint: '大天使米迦勒 (Archangel Michael) —— 神聖保護者，斬斷恐懼枷鎖',
      serenityPrayer: '「親愛的主，求祢賜我平靜的心去接納我無法改變的事；求祢賜我勇氣去改變我能改變的事；並求祢賜我智慧去分辨兩者的差別。阿們。」',
    },
    southeastAsian: {
      deity: '象神 迦尼薩 (Ganesha) / 四面佛 (Phra Phrom)',
      vowSpirit: '象神破除有形無形一切障礙，四面佛具備慈悲喜捨。祈求時務必言出必行、嚴守誠信承諾，願成後主動捐款助學。',
      offeringAdvice: '順時針依序參拜四面，獻上萬壽菊花串，將心靈恐慌昇華為對宇宙因果法則的敬畏。',
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 全屏深色毛玻璃遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
          />

          {/* 右側滑出抽屜本體 */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-xl h-full bg-[#080a14] border-l border-purple-500/30 shadow-2xl flex flex-col z-10 text-slate-100 overflow-hidden"
          >
            {/* 抽屜頂部標題 */}
            <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/40">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-wide flex items-center gap-2">
                    <span>跨宗教心靈神聖處方箋</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
                      情緒急救容器
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    專為【{profileName}】訂製之外部神聖力量錨定與認知重塑指南
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 三大功能分頁切換列 */}
            <div className="flex border-b border-slate-800 bg-slate-950/50 p-2 gap-1.5 shrink-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('faith')}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'faith'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>跨宗教神聖寄託</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('action')}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'action'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>破局實戰行動 SOP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('manifest')}
                className={`flex-1 py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'manifest'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>睡前 3 分鐘顯化</span>
              </button>
            </div>

            {/* 抽屜滾動內容區 */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs sm:text-sm leading-relaxed">
              {/* ================= 分頁 2：跨宗教心靈寄託指引 ================= */}
              {activeTab === 'faith' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 leading-relaxed">
                    💡 <strong>心理學外在神聖錨定效應</strong>：當個體處於高皮質醇（慢性焦慮）與現實困頓時，單靠理性無法抵禦恐慌。藉由向更高維度的神聖存在祈請與發願，能有效重組大腦控制感（Locus of Control），轉化焦慮為主動作為。
                  </div>

                  {/* 1. 漢傳佛教 */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🪷</span>
                        <div>
                          <h4 className="font-bold text-amber-300 text-sm">
                            漢傳佛教：智慧破局與身心調息
                          </h4>
                          <span className="text-[11px] text-slate-400">相應本尊與心咒經文</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/30">
                        慈悲清涼
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">相應佛菩薩：</span>
                      <strong className="text-white text-sm block mt-0.5">
                        {currentSanctuary.buddhism.deity}
                      </strong>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-amber-400 text-xs font-semibold block mb-1">
                        誦持心咒或經典心法：
                      </span>
                      <p className="text-amber-100 font-mono text-xs leading-relaxed">
                        {currentSanctuary.buddhism.mantra}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">靜坐平息焦慮儀式：</span>
                      <p className="text-slate-300 mt-1">{currentSanctuary.buddhism.ritual}</p>
                    </div>

                    <div className="p-2.5 bg-purple-950/40 rounded-lg text-xs text-purple-200 border-l-2 border-purple-400">
                      ✨ <strong>認知重塑：</strong> {currentSanctuary.buddhism.psychologicalReframing}
                    </div>
                  </div>

                  {/* 2. 道教與民間信仰 */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-red-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">⛩️</span>
                        <div>
                          <h4 className="font-bold text-rose-300 text-sm">
                            道教與民間宮廟：正氣立身與補庫轉運
                          </h4>
                          <span className="text-[11px] text-slate-400">宮廟主神與誠心稟報指南</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-200 border border-rose-500/30">
                        扶正辟邪
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">推薦參拜主神：</span>
                      <strong className="text-white text-sm block mt-0.5">
                        {currentSanctuary.taoism.deity}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">具體稟報發願指南：</span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {currentSanctuary.taoism.petitionGuide}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-rose-400 text-xs font-semibold block mb-1">
                        具體落地行動建議：
                      </span>
                      <p className="text-slate-300 text-xs">{currentSanctuary.taoism.templeAction}</p>
                    </div>
                  </div>

                  {/* 3. 天主教與基督信仰 */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">✝️</span>
                        <div>
                          <h4 className="font-bold text-blue-300 text-sm">
                            基督天主教：大能信靠與現代寧靜祈禱
                          </h4>
                          <span className="text-[11px] text-slate-400">聖經應許金句與大天使呼求</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-200 border border-blue-500/30">
                        神聖平安
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">聖經應許金句默想：</span>
                      <blockquote className="text-slate-200 italic mt-1 pl-3 border-l-2 border-blue-400">
                        {currentSanctuary.christianity.scripture}
                      </blockquote>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">呼求大天使或主保聖人：</span>
                      <p className="text-slate-300 mt-0.5 font-medium">
                        {currentSanctuary.christianity.archangelOrSaint}
                      </p>
                    </div>

                    <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-500/30">
                      <span className="text-blue-300 text-xs font-semibold block mb-1">
                        現代落地版寧靜祈禱文 (Serenity Prayer)：
                      </span>
                      <p className="text-blue-100 italic text-xs leading-relaxed">
                        {currentSanctuary.christianity.serenityPrayer}
                      </p>
                    </div>
                  </div>

                  {/* 4. 東南亞神祇信仰 */}
                  <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-600/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🪔</span>
                        <div>
                          <h4 className="font-bold text-amber-400 text-sm">
                            東南亞神祇：障礙掃除與誠信還願
                          </h4>
                          <span className="text-[11px] text-slate-400">象神迦尼薩與四面大梵天王</span>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                        大願成就
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">相應天神聖尊：</span>
                      <strong className="text-white text-sm block mt-0.5">
                        {currentSanctuary.southeastAsian.deity}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-xs">敬拜精神與還願承諾：</span>
                      <p className="text-slate-300 mt-1 leading-relaxed">
                        {currentSanctuary.southeastAsian.vowSpirit}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-amber-400 text-xs font-semibold block mb-1">
                        供奉與心理修持建議：
                      </span>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {currentSanctuary.southeastAsian.offeringAdvice}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 分頁 1：破局實戰行動指南 ================= */}
              {activeTab === 'action' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30">
                    <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>72 小時危機防範與止血檢核表</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      請依序完成以下 5 項核心自救行動，點擊方框可標記進度：
                    </p>
                  </div>

                  <div className="space-y-3">
                    {defaultChecklist.map((item, idx) => {
                      const isDone = !!checkedItems[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(idx)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-400 line-through'
                              : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-purple-500/50'
                          }`}
                        >
                          <div className="mt-0.5 shrink-0 text-emerald-400">
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                          </div>
                          <span className="text-xs sm:text-sm leading-relaxed">{item}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                      高皮質醇急性呼吸急救法 (4-7-8 Breathing)
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      當胸口緊繃、焦慮難耐時：用鼻子緩慢吸氣 4 秒 ➔ 閉氣屏息 7 秒 ➔
                      用嘴巴如吹蠟燭般深長吐氣 8 秒。重複 4 次，能迅速啟動副交感神經，阻斷恐慌風暴。
                    </p>
                  </div>
                </div>
              )}

              {/* ================= 分頁 3：每日能量心理暗示 ================= */}
              {activeTab === 'manifest' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-900 to-amber-950/30 border border-purple-500/40">
                    <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-purple-400" />
                      <span>睡前 3 分鐘顯化與認知重塑練習</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      在入睡前腦波轉為 α 波之際，向潛意識植入豐盛篤定之心理種子。
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                        專屬賦能正念金句
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyMantra}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition cursor-pointer"
                      >
                        {copiedMantra ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-300">已複製</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>複製心咒</span>
                          </>
                        )}
                      </button>
                    </div>

                    <blockquote className="text-sm sm:text-base font-bold text-white leading-relaxed italic p-4 rounded-xl bg-slate-950 border border-purple-500/30">
                      {defaultMantra}
                    </blockquote>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      💡 <strong>睡前操作指南：</strong>平躺於床，將右手輕貼心口，左手覆於丹田。深吸一口氣，在吐氣時心中默念上方金句三遍，感受胸口的緊繃逐漸融化，帶著篤定安然入眠。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 抽屜底部關閉按鈕 */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 shrink-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                宇沛實業官方跨宗教心靈處方箋
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer"
              >
                收合指南
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
