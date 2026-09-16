'use client';

/**
 * 民間擲杯占卜模組 (BwaBweiModule)
 * 擬真 3D/SVG 拋擲動效，呈現聖杯、笑杯、陰杯、立杯
 * 連續三次聖杯觸發「吉兆神諭」籤詩特效
 * 整合消費者心理學三層解讀
 */
import React, { useState } from 'react';
import {
  BWA_BWEI_OUTCOMES,
  BwaBweiResultType,
  ORACLE_LOTS,
} from '@/data/divinationData';
import {
  Flame,
  RotateCw,
  Award,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Gift,
  HeartHandshake,
} from 'lucide-react';

export default function BwaBweiModule() {
  const [isTossing, setIsTossing] = useState(false);
  const [currentResult, setCurrentResult] = useState<BwaBweiResultType | null>(null);
  const [consecutiveShengCount, setConsecutiveShengCount] = useState(0);
  const [history, setHistory] = useState<BwaBweiResultType[]>([]);
  const [triggeredOracle, setTriggeredOracle] = useState<{
    title: string;
    verse: string;
    interpretation: string;
  } | null>(null);

  // 擲筊核心邏輯
  const handleToss = () => {
    setIsTossing(true);
    setCurrentResult(null);

    setTimeout(() => {
      // 隨機生成機率：聖杯 48%、笑杯 25%、陰杯 26.5%、立杯 0.5%
      const rand = Math.random();
      let outcome: BwaBweiResultType = 'sheng';

      if (rand < 0.005) {
        outcome = 'li';
      } else if (rand < 0.26) {
        outcome = 'xiao';
      } else if (rand < 0.52) {
        outcome = 'yin';
      } else {
        outcome = 'sheng';
      }

      setCurrentResult(outcome);
      setHistory((prev) => [outcome, ...prev].slice(0, 8));

      // 連續聖杯判定
      if (outcome === 'sheng' || outcome === 'li') {
        const nextCount = consecutiveShengCount + 1;
        setConsecutiveShengCount(nextCount);

        if (nextCount >= 3) {
          const oracle = ORACLE_LOTS[Math.floor(Math.random() * ORACLE_LOTS.length)];
          setTriggeredOracle(oracle);
        }
      } else {
        setConsecutiveShengCount(0);
        setTriggeredOracle(null);
      }

      setIsTossing(false);
    }, 850);
  };

  const handleReset = () => {
    setCurrentResult(null);
    setConsecutiveShengCount(0);
    setHistory([]);
    setTriggeredOracle(null);
  };

  const outcomeData = currentResult ? BWA_BWEI_OUTCOMES[currentResult] : null;

  return (
    <div className="space-y-6">
      {/* 標題與計數器 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/30">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>民間正統擲筊・神意請示神諭</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              連三聖杯降籤詩
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            一正一反為聖杯、雙平為笑杯、雙凸為陰杯，誠心請示內在智慧
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* 連續聖杯燈號 */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400">連續聖杯：</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((num) => (
                <div
                  key={num}
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                    consecutiveShengCount >= num
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/50 scale-110'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer min-h-[44px] flex items-center"
          >
            重置請示
          </button>
        </div>
      </div>

      {/* 擲筊互動動畫舞台 */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-amber-500/30 text-center relative overflow-hidden shadow-2xl">
        {/* 背景太極光暈 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <div className="w-80 h-80 rounded-full border-8 border-amber-400/40"></div>
        </div>

        {/* 筊杯展示容器 */}
        <div className="h-44 flex items-center justify-center gap-6 sm:gap-10 relative z-10">
          {/* 左筊瓣 */}
          <div
            className={`transition-all duration-700 ease-out transform ${
              isTossing
                ? 'animate-bounce -translate-y-12 rotate-180 scale-90 opacity-70'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
          >
            <div
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-[50%_50%_20%_20%] flex items-center justify-center shadow-2xl transition-all duration-500 border-2 ${
                currentResult === 'sheng'
                  ? 'bg-gradient-to-tr from-rose-800 via-red-600 to-amber-500 border-amber-300 rotate-12'
                  : currentResult === 'xiao'
                  ? 'bg-gradient-to-tr from-amber-700 via-amber-600 to-yellow-500 border-yellow-300 -rotate-12'
                  : currentResult === 'yin'
                  ? 'bg-gradient-to-tr from-slate-800 via-stone-700 to-stone-600 border-stone-400 rotate-45'
                  : currentResult === 'li'
                  ? 'w-10 h-32 bg-amber-400 border-white shadow-amber-400/80 shadow-2xl rotate-0'
                  : 'bg-gradient-to-tr from-red-800 to-amber-600 border-amber-400/50 rotate-12'
              }`}
            >
              <span className="font-bold text-white text-xs drop-shadow select-none">
                {currentResult === 'sheng'
                  ? '陽 (平)'
                  : currentResult === 'xiao'
                  ? '平'
                  : currentResult === 'yin'
                  ? '凸'
                  : currentResult === 'li'
                  ? '立'
                  : '聖筊'}
              </span>
            </div>
          </div>

          {/* 右筊瓣 */}
          <div
            className={`transition-all duration-700 ease-out transform ${
              isTossing
                ? 'animate-bounce -translate-y-12 -rotate-180 scale-90 opacity-70'
                : 'translate-y-0 scale-100 opacity-100'
            }`}
          >
            <div
              className={`w-20 h-28 sm:w-24 sm:h-32 rounded-[20%_20%_50%_50%] flex items-center justify-center shadow-2xl transition-all duration-500 border-2 ${
                currentResult === 'sheng'
                  ? 'bg-gradient-to-bl from-slate-800 via-red-950 to-stone-800 border-amber-400/40 -rotate-12'
                  : currentResult === 'xiao'
                  ? 'bg-gradient-to-bl from-amber-700 via-amber-600 to-yellow-500 border-yellow-300 rotate-12'
                  : currentResult === 'yin'
                  ? 'bg-gradient-to-bl from-slate-800 via-stone-700 to-stone-600 border-stone-400 -rotate-45'
                  : currentResult === 'li'
                  ? 'w-10 h-32 bg-amber-400 border-white shadow-amber-400/80 shadow-2xl rotate-0'
                  : 'bg-gradient-to-bl from-red-950 to-stone-900 border-amber-400/50 -rotate-12'
              }`}
            >
              <span className="font-bold text-white text-xs drop-shadow select-none">
                {currentResult === 'sheng'
                  ? '陰 (凸)'
                  : currentResult === 'xiao'
                  ? '平'
                  : currentResult === 'yin'
                  ? '凸'
                  : currentResult === 'li'
                  ? '立'
                  : '聖筊'}
              </span>
            </div>
          </div>
        </div>

        {/* 拋擲按鈕 */}
        <div className="mt-4 relative z-10 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleToss}
            disabled={isTossing}
            className="px-8 py-3.5 bg-gradient-to-r from-amber-500 via-red-600 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-amber-900/50 transition cursor-pointer flex items-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            <RotateCw className={`w-4 h-4 ${isTossing ? 'animate-spin' : ''}`} />
            <span>{isTossing ? '神明鑑察中...' : '敬捧雙手・虔誠拋擲'}</span>
          </button>
          <span className="text-[11px] text-slate-400">
            {consecutiveShengCount > 0 && `目前已連續獲得 ${consecutiveShengCount} 次聖杯！`}
          </span>
        </div>
      </div>

      {/* 連續三次聖杯「天賜神諭籤詩」金光彈窗 */}
      {triggeredOracle && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-purple-950/80 to-amber-950/80 border-2 border-amber-400 shadow-2xl shadow-amber-500/20 animate-fade-in text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>★ 天賜神諭・連三聖杯大吉籤詩 ★</span>
          </div>
          <h3 className="text-xl font-black text-amber-200">{triggeredOracle.title}</h3>
          <div className="p-4 bg-slate-950/80 rounded-xl border border-amber-500/30 max-w-md mx-auto font-serif text-sm text-amber-100 whitespace-pre-line leading-loose tracking-wider">
            {triggeredOracle.verse}
          </div>
          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
            {triggeredOracle.interpretation}
          </p>
        </div>
      )}

      {/* 擲筊解讀結果展示 */}
      {outcomeData && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/30 shadow-xl space-y-4 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-amber-400 font-bold block">{outcomeData.name}</span>
              <h4 className="text-base font-black text-white mt-0.5">{outcomeData.title}</h4>
            </div>
            <span className="text-xs text-slate-400">{outcomeData.summary}</span>
          </div>

          {/* 三層心理學結構 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
              <span className="font-bold text-purple-300 flex items-center gap-1 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>【當前能量鏡像】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {outcomeData.psychology.energyMirror}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>【盲點與因果提醒】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {outcomeData.psychology.blindSpot}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>【具體破局指引】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {outcomeData.psychology.actionAdvice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
