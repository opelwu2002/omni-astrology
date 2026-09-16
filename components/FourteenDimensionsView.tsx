'use client';

/**
 * 14 維度命理解析沉浸式展示組件 (FourteenDimensionsView)
 * 強制嚴格約束 14 個維度不可缺漏，全面杜絕 Placeholder 或空函數。
 * 支援一鍵開啟 9:16 IG 限動專屬靈魂圖卡下載彈窗。
 */

import React, { useState } from 'react';
import { FourteenDimensionsReport } from '@/types/fortune';
import SoulCardModal from '@/components/SoulCardModal';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import {
  Sparkles,
  Compass,
  Heart,
  Calendar,
  Briefcase,
  Award,
  Flame,
  TrendingUp,
  AlertTriangle,
  Smile,
  Apple,
  Activity,
  Gem,
  Baby,
  Quote,
  Download,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  report: FourteenDimensionsReport;
  profileName: string;
  birthDate: string;
  birthTime: string;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dayMaster: string;
  mingMajorStar: string;
  destinyNumber: number;
}

export default function FourteenDimensionsView({
  report,
  profileName,
  birthDate,
  birthTime,
  sunSign,
  moonSign,
  risingSign,
  dayMaster,
  mingMajorStar,
  destinyNumber,
}: Props) {
  const [isSoulCardModalOpen, setIsSoulCardModalOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  return (
    <div className="space-y-6">
      {/* 官方免責聲明條款彈窗 */}
      <LegalDisclaimerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      {/* 靈魂圖卡彈窗 */}
      <SoulCardModal
        isOpen={isSoulCardModalOpen}
        onClose={() => setIsSoulCardModalOpen(false)}
        report={report}
        profileName={profileName}
        birthDate={birthDate}
        birthTime={birthTime}
        sunSign={sunSign}
        moonSign={moonSign}
        risingSign={risingSign}
        dayMaster={dayMaster}
        mingMajorStar={mingMajorStar}
        destinyNumber={destinyNumber}
      />

      {/* 法律免責聲明第二層防護：顯著警語 Warning Badge */}
      <div className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300/95 shadow-inner">
        <div className="flex items-start sm:items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong className="text-amber-200">宇沛實業法律警語：</strong>本 14 維度數值與命理指標係依傳統干支曆法與星曆推算，僅供心靈啟發、生活娛樂及個人修為參考，無任何法規醫療診斷或重大決策保證之效力。
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLegalModal(true)}
          className="shrink-0 inline-flex items-center text-amber-300 hover:text-amber-100 underline decoration-amber-400/50 hover:decoration-amber-200 transition-colors font-medium cursor-pointer self-end sm:self-auto text-[11px]"
        >
          完整條款與免責聲明 →
        </button>
      </div>

      {/* 頂部通欄 Banner 與一鍵輸出圖卡 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold">
                14 維度全方位深度命理報告
              </span>
              <span className="text-xs text-slate-400 font-mono">
                命主：<strong className="text-white">{profileName}</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              中西合璧・終身靈魂天賦與人生航道密碼
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              整合西洋占星、紫微十四主星、八字五行十神、畢達哥拉斯靈數四大體系，由底層演算法精確推導，無任何模糊模擬。
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsSoulCardModalOpen(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-900/50 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>輸出 9:16 IG 專屬靈魂圖卡</span>
          </button>
        </div>
      </div>

      {/* 14 維度卡片網格佈局 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 維度 1：I/E 人格傾向 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">維度一：I/E 心理能量導向</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/40">
                {report.personality_mbti.type} 型人格
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">外向積極導向分數</span>
                <span className="text-amber-300 font-mono font-bold">
                  {report.personality_mbti.score}%
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${report.personality_mbti.score}%` }}
                />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-2">
                {report.personality_mbti.explanation}
              </p>
            </div>
          </div>
        </div>

        {/* 維度 2：十二生肖與星座契合 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
                  <Heart className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-white">維度二：十二生肖與星座契合</h3>
              </div>
              <span className="text-xs text-pink-300 font-semibold">天宮三合共振</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">天宮同象與互補最佳星座：</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.zodiac_compatibility.best_signs.map((sign, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200 font-medium"
                    >
                      {sign}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">八字地支三合六合生肖：</span>
                <div className="flex flex-wrap gap-1.5">
                  {report.zodiac_compatibility.best_zodiacs.map((zodiac, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 font-medium"
                    >
                      生肖【{zodiac}】
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed pt-1">
                {report.zodiac_compatibility.reason}
              </p>
            </div>
          </div>
        </div>

        {/* 維度 3：人生重大轉折里程碑時間線 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm md:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度三：動態大限流年里程碑時間線</h3>
            </div>
            <span className="text-xs text-indigo-300 font-mono">
              紫微大限 × 八字起運歲數
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {report.timeline_milestones.map((m, idx) => (
              <div
                key={idx}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-black text-amber-300 font-mono">
                      {m.age} 歲
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        m.category === 'career'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : m.category === 'marriage'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {m.category === 'career'
                        ? '事業突破'
                        : m.category === 'marriage'
                        ? '情感婚契'
                        : '身心轉折'}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{m.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 維度 4：職涯志業天賦 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Briefcase className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度四：職涯天賦與避坑路徑</h3>
            </div>
            <span className="text-xs text-blue-300 font-medium">官祿星曜對應</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-emerald-400 font-semibold block mb-1">
                ⭐ 核心志業主賽道：
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {report.ideal_careers.primary.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-indigo-400 font-semibold block mb-1">
                🚀 高潛力第二曲線副業：
              </span>
              <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                {report.ideal_careers.side_hustle.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="text-rose-400 font-semibold block mb-1">
                ⚠️ 耗損精力避坑領域：
              </span>
              <ul className="list-disc list-inside text-slate-400 space-y-0.5">
                {report.ideal_careers.avoid.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 維度 5：財富來源模式 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度五：財富來源模式判定</h3>
            </div>
            <span className="text-xs text-amber-300 font-bold">田宅與財帛</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[11px]">命定財祿模式：</span>
              <span className="text-xl font-black text-amber-300 block mt-1">
                {report.wealth_origin === 'self_made'
                  ? '白手起家・開疆拓土實戰型'
                  : report.wealth_origin === 'inheritance'
                  ? '家族蔭庇・資產承繼福祿型'
                  : '雙軌共振・自立與祖德並榮型'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed pt-1">
              {report.wealth_origin === 'self_made'
                ? '年柱印綬祖基平淡，主要財祿全憑日柱與時柱個人強大技能、個人 IP 與商業敏銳度獨立開創，成就越磨礪越璀璨。'
                : report.wealth_origin === 'inheritance'
                ? '命盤父母宮與田宅宮吉星高照，自帶厚重祖德與家庭資源扶持，適合在長輩架構之堅實根基上穩健放大財庫。'
                : '兼備家族原始資本與個人破局創新力，善於利用現成平台資源借力使力，開闢全新利基市場。'}
            </p>
          </div>
        </div>

        {/* 維度 6：離鄉背井建議 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度六：離鄉驛馬與海外發展</h3>
            </div>
            <span className="text-xs text-cyan-300 font-semibold">遷移宮與驛馬</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">行動方針：</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  report.relocation_advice.recommendation === 'relocate'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {report.relocation_advice.recommendation === 'relocate'
                  ? '建議遠赴外地 / 海外發展'
                  : '建議在地深耕 / 本土立基'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed pt-1">
              {report.relocation_advice.study_career_verdict}
            </p>
          </div>
        </div>

        {/* 維度 7：投資理財工具 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度七：投資理財適性工具</h3>
            </div>
            <span className="text-xs text-emerald-300 font-mono">正偏財配置</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-amber-300 font-semibold">📈 高收益成長適性：</span>
              <p className="text-slate-300">{report.investment_tools.high_yield.join('、')}</p>
            </div>
            <div>
              <span className="text-emerald-300 font-semibold">🛡️ 穩健避險基石：</span>
              <p className="text-slate-300">{report.investment_tools.safe_haven.join('、')}</p>
            </div>
            <div>
              <span className="text-rose-400 font-semibold">🚫 嚴禁涉足高危：</span>
              <p className="text-slate-400">{report.investment_tools.risky_avoid.join('、')}</p>
            </div>
          </div>
        </div>

        {/* 維度 8：性情脾氣心智 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <Smile className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度八：性情脾氣與心智耐受</h3>
            </div>
            <span className="text-xs text-orange-300 font-bold">
              脾氣等級：{report.temperament.temper_level} / 5
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 block">情緒耐受度 (Patience)：</span>
              <p className="text-slate-200 mt-0.5">{report.temperament.patience}</p>
            </div>
            <div>
              <span className="text-slate-400 block">執行勤奮度 (Diligence)：</span>
              <p className="text-slate-200 mt-0.5">{report.temperament.diligence}</p>
            </div>
          </div>
        </div>

        {/* 維度 9：開運飲食與幸運蔬果 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-green-500/20 text-green-400 border border-green-500/30">
                <Apple className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度九：開運飲食與幸運蔬果</h3>
            </div>
            <span className="text-xs text-green-300 font-semibold">五行調候</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400">推薦食材：</span>
              <span className="text-slate-200 font-medium ml-1">
                {report.lucky_food.foods.join('、')}
              </span>
            </div>
            <div>
              <span className="text-slate-400">幸運果品：</span>
              <span className="text-slate-200 font-medium ml-1">
                {report.lucky_food.fruits.join('、')}
              </span>
            </div>
            <p className="text-slate-300 pt-1 leading-relaxed">
              {report.lucky_food.element_boost}
            </p>
          </div>
        </div>

        {/* 維度 10：健康脆弱器官與食補 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度十：健康脆弱器官與食補療法</h3>
            </div>
            <span className="text-xs text-rose-300 font-semibold">疾厄宮與五行</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-rose-400 font-semibold block mb-0.5">
                脆弱經絡器官預警：
              </span>
              <p className="text-slate-300">
                {report.health_body.vulnerable_organs.join('、')}
              </p>
            </div>
            <div>
              <span className="text-amber-400 font-semibold block mb-0.5">
                針對性對症養生食療方：
              </span>
              <p className="text-slate-300 leading-relaxed">
                {report.health_body.dietary_therapy}
              </p>
            </div>
          </div>
        </div>

        {/* 維度 11：命中正緣相遇年齡與特徵 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                <Heart className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度十一：命中正緣年齡與特徵</h3>
            </div>
            <span className="text-xs text-red-300 font-bold">
              相遇大限：{report.destined_partner.meet_age} 歲
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400">年齡差距：</span>
              <span className="text-white font-semibold">
                {report.destined_partner.age_gap === 'older'
                  ? '長兄長姐氣質 (偏年長)'
                  : report.destined_partner.age_gap === 'younger'
                  ? '討喜可愛 (偏年輕)'
                  : '同儕知己 (同年齡層)'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">婚配節奏：</span>
              <span className="text-amber-300 font-semibold">
                {report.destined_partner.marriage_timing === 'early' ? '順緣早婚' : '大器晚成成熟婚'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">伴侶特質相貌：</span>
              <div className="flex flex-wrap gap-1.5">
                {report.destined_partner.traits.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 維度 12：能量水晶開運物 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Gem className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度十二：專屬能量水晶開運物</h3>
            </div>
            <span className="text-xs text-teal-300 font-semibold">礦石磁場諧振</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-950/80 rounded-xl border border-teal-500/30">
              <span className="text-[11px] text-slate-400 block">首選開運晶石：</span>
              <span className="text-sm font-bold text-teal-300 block mt-0.5">
                {report.lucky_crystals.crystal_name}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {report.lucky_crystals.magnetic_field_reason}
            </p>
          </div>
        </div>

        {/* 維度 13：子息緣分與教養 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                <Baby className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">維度十三：子息緣分與教養特質</h3>
            </div>
            <span className="text-xs text-yellow-300 font-semibold">子女宮主星</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">命中緣分預估人數：</span>
              <span className="text-base font-bold text-yellow-300 font-mono">
                {report.children_fate.estimated_count} 位
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {report.children_fate.description}
            </p>
          </div>
        </div>

        {/* 維度 14：未來三年流年運勢與正念心咒 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm md:col-span-2">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Quote className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-white">
                維度十四：未來三年流年曲線與每日賦能正念心咒
              </h3>
            </div>
            <span className="text-xs text-amber-300 font-semibold">2026~2028 歲運合化</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* 左側：三年曲線分數 */}
            <div className="md:col-span-6 space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                三年整體運勢能階評分 (0 ~ 100)：
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                {report.annual_forecast.next_3_years_curve.map((item) => (
                  <div
                    key={item.year}
                    className="p-3 bg-slate-950/80 rounded-xl border border-slate-800"
                  >
                    <span className="text-xs text-slate-400 block font-mono">{item.year}</span>
                    <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
                      {item.score}
                    </span>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 pt-1">
                {report.annual_forecast.key_months.map((km, idx) => (
                  <p key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 shrink-0">•</span>
                    <span>{km}</span>
                  </p>
                ))}
              </div>
            </div>

            {/* 右側：正念金句 */}
            <div className="md:col-span-6 bg-gradient-to-br from-purple-950/50 via-slate-950 to-amber-950/30 p-4 sm:p-5 rounded-xl border border-purple-500/40 text-center shadow-lg">
              <span className="text-[10px] tracking-widest text-purple-300 uppercase font-semibold block">
                DAILY MINDFULNESS MANTRA
              </span>
              <blockquote className="text-sm sm:text-base font-bold text-white leading-relaxed mt-2 italic px-2">
                {report.annual_forecast.mindfulness_mantra}
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
