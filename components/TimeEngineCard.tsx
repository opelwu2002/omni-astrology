'use client';

/**
 * 時間與地理引擎成果卡片 (TimeEngineCard)
 * 完整展示 UTC 絕對時間與真太陽時 (True Solar Time) 以及計算細節
 */
import React, { useState } from 'react';
import { useProfileStore } from '@/store/useProfileStore';
import { logTimeCalculationSummary } from '@/lib/timeUtils';
import {
  Compass,
  Sun,
  Globe2,
  Clock,
  Terminal,
  Copy,
  Check,
  Flame,
  Info,
} from 'lucide-react';

export default function TimeEngineCard() {
  const activeCalc = useProfileStore((state) => state.activeCalculationResult);
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);
  const [copied, setCopied] = useState(false);

  if (!activeCalc || !activeProfile) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        請先在上方建立或選擇一個命盤檔案以檢視時間引擎計算結果。
      </div>
    );
  }

  const handleCopy = () => {
    const summaryText = `【${activeProfile.name} 時間引擎運算結果】
- 輸入時間：${activeCalc.inputLocalTime}
- 所屬地點：${activeProfile.location.name} (經度: ${activeCalc.longitudeDegree}°)
- 西洋占星 UTC：${activeCalc.utcTime}
- 夏令時間 (DST)：${activeCalc.isDST ? '已實施' : '標準時間'}
- 天文均時差 (EoT)：${activeCalc.equationOfTimeFormatted}
- 最終真太陽時 (TST)：${activeCalc.trueSolarTime}
- 命理時辰：${activeCalc.solarHourBranch}時 ${activeCalc.isEarlyZiHour ? '(早子時)' : activeCalc.isLateZiHour ? '(夜子時)' : ''}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintConsole = () => {
    logTimeCalculationSummary(activeCalc);
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-purple-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md text-slate-100">
      {/* 標題與操作區 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                時間與地理引擎運算結果
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                作用對象：{activeProfile.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              已完成經緯度平太陽時校正、夏令時間判斷與Spencer天文均時差換算
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrintConsole}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 text-xs font-medium rounded-lg border border-purple-500/20 transition cursor-pointer"
            title="在瀏覽器開發者工具印出結構化報告"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>印出 Console 報告</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium rounded-lg transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? '已複製！' : '複製摘要'}</span>
          </button>
        </div>
      </div>

      {/* 雙核心時間並排重點展示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* 西洋占星：UTC 絕對時間 */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-indigo-950/40 to-slate-900/90 border border-indigo-500/40 shadow-inner">
          <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-500/20 border-b border-l border-indigo-500/30 rounded-bl-xl text-[11px] font-semibold text-indigo-300">
            Phase 2 西洋占星專用基準
          </div>
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-2">
            <Globe2 className="w-4 h-4" />
            <span>世界協調時 (GMT / UTC)</span>
          </div>
          <div className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wider mb-2">
            {activeCalc.utcTime}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              時間戳: {activeCalc.utcTimestamp}
            </span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              本地時區: {activeCalc.timezoneName} (UTC
              {activeCalc.timezoneOffsetHours >= 0 ? '+' : ''}
              {activeCalc.timezoneOffsetHours})
            </span>
          </div>
        </div>

        {/* 紫微斗數與八字：真太陽時 */}
        <div className="relative overflow-hidden p-5 rounded-xl bg-gradient-to-br from-amber-950/40 to-slate-900/90 border border-amber-500/40 shadow-inner">
          <div className="absolute top-0 right-0 px-3 py-1 bg-amber-500/20 border-b border-l border-amber-500/30 rounded-bl-xl text-[11px] font-semibold text-amber-300">
            Phase 2 八字 & 紫微專用基準
          </div>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold mb-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>真太陽時 (True Solar Time, TST)</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-xl sm:text-2xl font-mono font-bold text-amber-100 tracking-wider">
              {activeCalc.trueSolarTime}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="bg-amber-500/20 text-amber-200 px-2.5 py-0.5 rounded-md font-semibold border border-amber-500/30 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" />
              時辰：{activeCalc.solarHourBranch}時
              {activeCalc.isEarlyZiHour ? '（早子時 00:00~01:00）' : ''}
              {activeCalc.isLateZiHour ? '（夜子時 23:00~24:00）' : ''}
            </span>
            <span className="bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              時間戳: {activeCalc.trueSolarTimestamp}
            </span>
          </div>
        </div>
      </div>

      {/* 換算推導步步拆解清單 */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-purple-400" />
          天文與幾何換算細節拆解
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 輸入時間 */}
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
            <span className="block text-slate-400 text-[11px] mb-1">原始輸入時間</span>
            <span className="font-semibold text-slate-100 font-mono">
              {activeCalc.inputLocalTime}
            </span>
          </div>

          {/* 夏令時間判斷 */}
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
            <span className="block text-slate-400 text-[11px] mb-1">夏令時間 (DST)</span>
            <span
              className={`font-semibold ${
                activeCalc.isDST ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {activeCalc.isDST ? '已套用 (+60分鐘)' : '未實施 (標準時間)'}
            </span>
          </div>

          {/* 經度時差補正 */}
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
            <span className="block text-slate-400 text-[11px] mb-1">
              經度時差 (每度4分鐘)
            </span>
            <span className="font-semibold text-purple-300 font-mono">
              {activeCalc.longitudeDiffMinutes >= 0 ? '+' : ''}
              {activeCalc.longitudeDiffMinutes.toFixed(2)} 分鐘
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              經度 {activeCalc.longitudeDegree}°
            </span>
          </div>

          {/* 天文均時差 EoT */}
          <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
            <span className="block text-slate-400 text-[11px] mb-1">
              均時差 (Equation of Time)
            </span>
            <span className="font-semibold text-amber-300 font-mono">
              {activeCalc.equationOfTimeFormatted}
            </span>
            <span className="block text-[10px] text-slate-500 mt-0.5">
              Spencer 天文公式補正
            </span>
          </div>
        </div>

        {/* 真太陽時換算說明公式條 */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>
              公式：真太陽時 = 平太陽時 (UTC + 經度×4分) + 天文均時差 (EoT)
            </span>
          </div>
          <span className="text-slate-500">
            💡 按下鍵盤 F12 開啟 Console，可檢視即時結構化報表
          </span>
        </div>
      </div>
    </div>
  );
}
