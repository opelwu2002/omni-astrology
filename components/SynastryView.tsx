'use client';

/**
 * 人際關係雙人合盤比對組件 (SynastryView)
 * 支援戀愛合婚、職場合夥、家人朋友跨維度契合度精算
 */
import React, { useState, useMemo } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { calculateSolarAndUtcTime } from '@/lib/timeUtils';
import { calculateWesternAstrology } from '@/lib/astrology/westernAstrology';
import { calculateBaziChart } from '@/lib/astrology/baziEngine';
import { calculateZiweiChart } from '@/lib/astrology/ziweiEngine';
import { calculateNumerology } from '@/lib/astrology/numerologyEngine';
import { calculateSynastry } from '@/lib/astrology/synastryEngine';
import SanctuaryDrawer from '@/components/SanctuaryDrawer';
import {
  HeartHandshake,
  Users2,
  Sparkles,
  Heart,
  Briefcase,
  MessagesSquare,
  Flame,
  PlusCircle,
  ShieldAlert,
  Clock,
  MessageCircle,
  Zap,
  CheckSquare,
} from 'lucide-react';

export default function SynastryView() {
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const addProfile = useProfileStore((state) => state.addProfile);

  const [profileAId, setProfileAId] = useState<string>(activeProfileId || profiles[0]?.id || '');
  const [profileBId, setProfileBId] = useState<string>(
    profiles.length > 1 ? profiles[1].id : profiles[0]?.id || ''
  );
  const [isSanctuaryDrawerOpen, setIsSanctuaryDrawerOpen] = useState(false);

  // 快速新增範例 B 對象以利即時體驗合盤
  const handleAddSamplePartner = () => {
    const sampleB = addProfile({
      name: '林雅婷 (合盤示範)',
      gender: 'female',
      birthDate: '1997-03-15',
      birthTime: '15:20',
      location: {
        name: '台北市',
        longitude: 121.5654,
        latitude: 25.0330,
        timezone: 'Asia/Taipei',
      },
      notes: '示範合盤伴侶檔案',
    });
    setProfileBId(sampleB.id);
  };

  const profileA = profiles.find((p) => p.id === profileAId);
  const profileB = profiles.find((p) => p.id === profileBId);

  // 計算雙方命盤並求出合盤結果
  const synastryResult = useMemo(() => {
    if (!profileA || !profileB) return null;

    // A 方命盤推算
    const calcA = calculateSolarAndUtcTime(profileA.birthDate, profileA.birthTime, profileA.location);
    const astroA = calculateWesternAstrology(new Date(calcA.utcTimestamp), profileA.location.latitude, profileA.location.longitude);
    const baziA = calculateBaziChart(calcA.trueSolarDate, calcA.trueSolarTimeOnly);
    const ziweiA = calculateZiweiChart(calcA.trueSolarDate, calcA.trueSolarTimeOnly, profileA.gender);
    const numA = calculateNumerology(profileA.birthDate);

    // B 方命盤推算
    const calcB = calculateSolarAndUtcTime(profileB.birthDate, profileB.birthTime, profileB.location);
    const astroB = calculateWesternAstrology(new Date(calcB.utcTimestamp), profileB.location.latitude, profileB.location.longitude);
    const baziB = calculateBaziChart(calcB.trueSolarDate, calcB.trueSolarTimeOnly);
    const ziweiB = calculateZiweiChart(calcB.trueSolarDate, calcB.trueSolarTimeOnly, profileB.gender);
    const numB = calculateNumerology(profileB.birthDate);

    return calculateSynastry(
      profileA,
      profileB,
      astroA,
      astroB,
      baziA,
      baziB,
      ziweiA,
      ziweiB,
      numA,
      numB
    );
  }, [profileA, profileB]);

  return (
    <div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
      {/* 跨宗教心靈神聖處方箋抽屜 */}
      <SanctuaryDrawer
        isOpen={isSanctuaryDrawerOpen}
        onClose={() => setIsSanctuaryDrawerOpen(false)}
        profileName={`${profileA?.name || '對象A'} × ${profileB?.name || '對象B'}`}
        sanctuary={synastryResult?.sanctuary}
        mindfulnessMantra={synastryResult?.deepAnalysis?.breakthroughSOP?.starComplementaryAdvice}
      />

      {/* 標題與操作列 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-purple-600 text-white shadow-lg shadow-rose-600/30">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              人際關係雙人合盤配對引擎
            </h3>
            <p className="text-xs text-slate-400">
              整合西洋占星、八字合婚、紫微星系與生命靈數之深度契合評測
            </p>
          </div>
        </div>

        {profiles.length < 2 && (
          <button
            type="button"
            onClick={handleAddSamplePartner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>新增合盤範例對象</span>
          </button>
        )}
      </div>

      {/* 雙人檔案選取選擇器 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 對象 A */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-indigo-500/30">
          <label className="block text-xs font-semibold text-indigo-300 mb-1.5 flex items-center gap-1">
            <Users2 className="w-3.5 h-3.5" />
            <span>第一位對象 (命主 A)</span>
          </label>
          <select
            value={profileAId}
            onChange={(e) => setProfileAId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          >
            {profiles.map((p) => (
              <option key={`a-${p.id}`} value={p.id}>
                {p.name} ({p.gender === 'female' ? '女' : '男'}・{p.birthDate})
              </option>
            ))}
          </select>
        </div>

        {/* 對象 B */}
        <div className="p-3.5 bg-slate-950/80 rounded-xl border border-rose-500/30">
          <label className="block text-xs font-semibold text-rose-300 mb-1.5 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>第二位對象 (配對 B)</span>
          </label>
          <select
            value={profileBId}
            onChange={(e) => setProfileBId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
          >
            {profiles.map((p) => (
              <option key={`b-${p.id}`} value={p.id}>
                {p.name} ({p.gender === 'female' ? '女' : '男'}・{p.birthDate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {profileAId === profileBId ? (
        <div className="p-8 text-center bg-slate-950/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
          請為「第一位對象」與「第二位對象」選擇不同的人員檔案以進行雙人合盤比較。
        </div>
      ) : !synastryResult ? (
        <div className="p-8 text-center text-slate-500 text-xs">合盤運算準備中...</div>
      ) : (
        <div className="space-y-6">
          {/* 總契合指數主橫幅 */}
          <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-950 to-rose-950/50 border border-purple-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-purple-300 font-semibold uppercase tracking-wider">
                雙人四合一總體緣分契合指數
              </span>
              <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                {synastryResult.profileA.name} × {synastryResult.profileB.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                基於本命占星角度、八字五行生剋、紫微命宮與生命靈數交叉驗證
              </p>
            </div>

            <div className="flex items-baseline gap-2 bg-purple-950/70 px-5 py-3 rounded-2xl border border-purple-500/50 shadow-inner">
              <span className="text-4xl sm:text-5xl font-black text-amber-300 font-mono">
                {synastryResult.overallScore}
              </span>
              <span className="text-sm text-slate-400 font-bold">/ 100 分</span>
            </div>
          </div>

          {/* 四大維度評分卡條 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {synastryResult.scoreBreakdown.map((item, idx) => {
              const icons = [Sparkles, Heart, Briefcase, MessagesSquare];
              const Icon = icons[idx] || Sparkles;

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5 text-purple-400" />
                      {item.category}
                    </span>
                    <span className="text-base font-bold font-mono text-purple-300">
                      {item.score}分
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {item.comment}
                  </p>
                </div>
              );
            })}
          </div>

          {/* 四大命理系統合盤亮點 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 西洋占星 & 八字 */}
            <div className="space-y-3">
              {/* 占星 */}
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl">
                <h5 className="font-bold text-indigo-300 text-xs mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>西洋占星合盤亮點</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {synastryResult.westernSynastryHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 八字 */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl">
                <h5 className="font-bold text-emerald-300 text-xs mb-2 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span>八字合婚與五行互動</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {synastryResult.baziCompatibilityHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 紫微斗數 & 生命靈數 */}
            <div className="space-y-3">
              {/* 紫微 */}
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl">
                <h5 className="font-bold text-amber-300 text-xs mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>紫微斗數星曜互補</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {synastryResult.ziweiCompatibilityHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 靈數 */}
              <div className="p-4 bg-pink-950/20 border border-pink-500/30 rounded-xl">
                <h5 className="font-bold text-pink-300 text-xs mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>生命靈數共鳴度</span>
                </h5>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {synastryResult.numerologyCompatibilityHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 深度相處錦囊 */}
          <div className="p-4 bg-gradient-to-r from-purple-950/30 to-indigo-950/30 rounded-xl border border-purple-500/30">
            <h5 className="font-bold text-purple-300 text-xs mb-1.5 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4 text-purple-400" />
              <span>雙人長期深度相處錦囊</span>
            </h5>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
              {synastryResult.interactionAdvice}
            </p>
          </div>

          {/* 三大實質深度合盤板塊 (800+ 字深度分析) */}
          {synastryResult.deepAnalysis && (
            <div className="space-y-4 pt-2">
              {/* 板塊一：靈魂化學反應與核心摩擦點 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950 border border-indigo-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-indigo-300 font-semibold block uppercase tracking-wider">
                      合盤深度板塊一
                    </span>
                    <h5 className="font-bold text-white text-sm sm:text-base">
                      靈魂化學反應與深層核心摩擦點
                    </h5>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-indigo-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                      宿命吸引力機制與鏡像投射
                    </span>
                    <p className="whitespace-pre-line text-slate-200">
                      {synastryResult.deepAnalysis.soulDynamics.chemistryAnalysis}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-amber-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                      金錢安全感與資源配置之深層分歧
                    </span>
                    <p className="whitespace-pre-line text-slate-200">
                      {synastryResult.deepAnalysis.soulDynamics.moneyViewClash}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-purple-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-purple-400" />
                      溝通節奏與情緒冷卻步調之落差
                    </span>
                    <p className="whitespace-pre-line text-slate-200">
                      {synastryResult.deepAnalysis.soulDynamics.communicationPaceClash}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="text-pink-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                      <MessagesSquare className="w-3.5 h-3.5 text-pink-400" />
                      最易引爆毀滅性衝突之日常真實場景
                    </span>
                    <p className="whitespace-pre-line text-slate-200">
                      {synastryResult.deepAnalysis.soulDynamics.triggerScene}
                    </p>
                  </div>
                </div>
              </div>

              {/* 板塊二：職場/合夥/感情致命死穴與防踩雷協議 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-950/40 via-pink-950/20 to-slate-950 border border-rose-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-rose-300 font-semibold block uppercase tracking-wider">
                      合盤深度板塊二
                    </span>
                    <h5 className="font-bold text-white text-sm sm:text-base">
                      致命死穴剖析與雙方防踩雷安全協議
                    </h5>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {synastryResult.deepAnalysis.fatalPitfalls.vulnerabilityArea}
                  </p>
                  <p className="text-xs text-rose-300/90 leading-relaxed whitespace-pre-line pt-1 border-t border-slate-800">
                    {synastryResult.deepAnalysis.fatalPitfalls.worstCaseScenario}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-rose-400" />
                    不可逾越的「防踩雷安全協議」清單：
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {synastryResult.deepAnalysis.fatalPitfalls.preConflictAgreement.map((rule: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/30 text-rose-200 flex items-start gap-2"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-rose-800/60 text-rose-100 font-mono text-[10px] font-bold shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <span className="leading-relaxed">{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 板塊三：爭吵後 24 小時破局溝通 SOP */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/40 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-purple-300 font-semibold block uppercase tracking-wider">
                      合盤深度板塊三
                    </span>
                    <h5 className="font-bold text-white text-sm sm:text-base">
                      爭吵後 24 小時破局冷靜溝通 SOP
                    </h5>
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  {/* 冷靜期 第一步 */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-purple-300 font-bold flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      物理隔離與情節止血
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {synastryResult.deepAnalysis.breakthroughSOP.coolingStep1}
                    </p>
                  </div>

                  {/* 溝通話術模板 第二步 */}
                  <div className="p-4 bg-indigo-950/40 rounded-xl border border-indigo-500/40 space-y-2">
                    <span className="text-indigo-300 font-bold flex items-center gap-1.5 text-xs">
                      <MessageCircle className="w-3.5 h-3.5 text-indigo-400" />
                      脆弱坦誠與書面破冰模板（直接傳訊使用）
                    </span>
                    <div className="p-3 bg-slate-950/90 rounded-lg border border-indigo-500/30 font-mono text-xs text-amber-200 leading-relaxed whitespace-pre-line">
                      {synastryResult.deepAnalysis.breakthroughSOP.coolingStep2}
                    </div>
                  </div>

                  {/* 復盤校準 第三步 */}
                  <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                      <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                      協議校準與心靈復盤指引
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {synastryResult.deepAnalysis.breakthroughSOP.coolingStep3}
                    </p>
                  </div>

                  {/* 長期星曜互補之道 */}
                  <div className="p-4 bg-purple-950/30 rounded-xl border border-purple-500/30 space-y-1.5">
                    <span className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      紫微星曜與八字五行長效互補之道
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {synastryResult.deepAnalysis.breakthroughSOP.starComplementaryAdvice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 跨宗教心靈神聖處方箋入口按鈕 */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => setIsSanctuaryDrawerOpen(true)}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-rose-900/70 via-purple-900/70 to-indigo-900/70 hover:from-rose-800/90 hover:to-indigo-800/90 border border-purple-500/50 text-purple-100 hover:text-white font-bold text-xs sm:text-sm shadow-2xl shadow-purple-950/80 flex flex-wrap items-center justify-center gap-2 transition cursor-pointer group"
            >
              <span>🕊️ 領取雙人合盤專屬心靈解方與跨宗教平安指南 ➜</span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/40 font-mono">
                佛門心咒・宮廟稟報・聖經天使・象神四面佛・72h防斷裂協議
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
