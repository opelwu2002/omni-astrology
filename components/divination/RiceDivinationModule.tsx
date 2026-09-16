'use client';

/**
 * 易經米卦神聖占卜模組 (RiceDivinationModule)
 * 模擬抓取三把米，計算米粒數推演先天八卦（上卦、下卦）與動爻
 * 組合六十四卦本卦與變卦，提供易經哲學時序與心理學三層解讀
 */
import React, { useState } from 'react';
import { calculateRiceHexagram, HexagramRiceResult, BAGUA_MAP } from '@/data/divinationData';
import {
  Sparkles,
  RotateCw,
  Eye,
  AlertCircle,
  CheckCircle2,
  Compass,
  ArrowRight,
} from 'lucide-react';

export default function RiceDivinationModule() {
  const [isCasting, setIsCasting] = useState(false);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [b1, setB1] = useState<number | null>(null);
  const [b2, setB2] = useState<number | null>(null);
  const [b3, setB3] = useState<number | null>(null);
  const [result, setResult] = useState<HexagramRiceResult | null>(null);

  // 完全清空狀態回到初始等待狀態 (絕不自動抓米)
  const handleReset = () => {
    setIsCasting(false);
    setStep(0);
    setB1(null);
    setB2(null);
    setB3(null);
    setResult(null);
  };

  // 手動依序抓取每一把米
  const handleGrabBowl = (bowlIndex?: 1 | 2 | 3) => {
    if (isCasting) return;

    // 若當前 step 0：抓第一把米【上卦】
    if (step === 0 || bowlIndex === 1) {
      const num1 = Math.floor(Math.random() * 38) + 10;
      setB1(num1);
      setStep(1);
      return;
    }

    // 若當前 step 1：抓第二把米【下卦】
    if (step === 1 || bowlIndex === 2) {
      const num2 = Math.floor(Math.random() * 38) + 10;
      setB2(num2);
      setStep(2);
      return;
    }

    // 若當前 step 2：抓第三把米【動爻】並推算六十四卦
    if (step === 2 || bowlIndex === 3) {
      const num3 = Math.floor(Math.random() * 26) + 10;
      setB3(num3);
      const hex = calculateRiceHexagram(b1 || 24, b2 || 32, num3);
      setResult(hex);
      setStep(3);
      return;
    }

    // 若已完成，提示重新抓米
    if (step === 3) {
      handleReset();
    }
  };

  // 一鍵連抓便利通道
  const handleAutoCast = () => {
    handleReset();
    setIsCasting(true);

    const num1 = Math.floor(Math.random() * 38) + 10;
    setB1(num1);
    setStep(1);

    setTimeout(() => {
      const num2 = Math.floor(Math.random() * 38) + 10;
      setB2(num2);
      setStep(2);

      setTimeout(() => {
        const num3 = Math.floor(Math.random() * 26) + 10;
        setB3(num3);
        const hex = calculateRiceHexagram(num1, num2, num3);
        setResult(hex);
        setStep(3);
        setIsCasting(false);
      }, 450);
    }, 450);
  };

  // 上卦與下卦即時先天八卦推導資訊
  const upperInfo = b1 ? BAGUA_MAP[b1 % 8 || 8] : null;
  const lowerInfo = b2 ? BAGUA_MAP[b2 % 8 || 8] : null;

  return (
    <div className="space-y-6">
      {/* 頂部標題與說明 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-indigo-500/30">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>正統易經米卦・五穀通靈陰陽推演</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              手動依序抓米起卦
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            請手動依序點擊三只米碗：第一碗定上卦、第二碗定下卦、第三碗定動爻
          </p>
        </div>

        {/* 右上角控制按鈕 (有結果時點擊 Reload 僅清空，絕不自動執行) */}
        <button
          type="button"
          onClick={step === 3 || result ? handleReset : step === 0 ? handleAutoCast : handleReset}
          disabled={isCasting}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/40 transition cursor-pointer flex items-center gap-2 min-h-[44px] shrink-0 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isCasting ? 'animate-spin' : ''}`} />
          <span>
            {isCasting
              ? '五穀感應推演中...'
              : step === 3 || result
              ? '重新抓米 (Reload)'
              : step === 0
              ? '一鍵連抓三把米'
              : '重置清空 (Reset)'}
          </span>
        </button>
      </div>

      {/* 三把米抓取互動舞台 (直接手動點擊米碗依序抓米) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-indigo-500/30 shadow-2xl relative select-none">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {/* 第一把米 (上卦) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => (step === 0 ? handleGrabBowl(1) : undefined)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && step === 0) {
                handleGrabBowl(1);
              }
            }}
            className={`p-5 rounded-2xl border text-center transition-all duration-300 group ${
              step === 0
                ? 'border-indigo-400/90 bg-indigo-950/40 shadow-lg shadow-indigo-950/70 hover:scale-[1.04] cursor-pointer animate-pulse'
                : step >= 1
                ? 'bg-indigo-950/40 border-indigo-400 shadow-md shadow-indigo-950/40'
                : 'bg-slate-950/60 border-slate-800 opacity-80'
            }`}
            title={step === 0 ? '點擊抓第一把米【上卦】' : '第一把米已抓取'}
          >
            <div className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center justify-center gap-1">
              <span>第一把米【上卦】</span>
              {step === 0 && <span className="text-amber-300 text-xs animate-bounce">●</span>}
            </div>
            <div className="h-20 flex items-center justify-center">
              {step >= 1 && b1 ? (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {b1} 粒
                  </div>
                  <div className="text-xs text-white font-bold">
                    {upperInfo?.symbol} {upperInfo?.name}為{upperInfo?.nature}（{upperInfo?.element}）
                  </div>
                </div>
              ) : (
                <div className="text-4xl text-slate-500 font-mono group-hover:scale-125 group-hover:drop-shadow-[0_0_12px_rgba(129,140,248,0.6)] transition-all">
                  🍚
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {step >= 1 && b1 ? `除以 8 餘 ${b1 % 8 || 8}` : '👉 點擊抓第一把米【上卦】'}
            </div>
          </div>

          {/* 第二把米 (下卦) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => (step === 1 ? handleGrabBowl(2) : undefined)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && step === 1) {
                handleGrabBowl(2);
              }
            }}
            className={`p-5 rounded-2xl border text-center transition-all duration-300 group ${
              step === 1
                ? 'border-indigo-400/90 bg-indigo-950/40 shadow-lg shadow-indigo-950/70 hover:scale-[1.04] cursor-pointer animate-pulse'
                : step >= 2
                ? 'bg-indigo-950/40 border-indigo-400 shadow-md shadow-indigo-950/40'
                : 'bg-slate-950/60 border-slate-800 opacity-60'
            }`}
            title={step === 1 ? '點擊抓第二把米【下卦】' : step === 0 ? '請先抓第一把米' : '第二把米已抓取'}
          >
            <div className="text-[11px] font-bold text-indigo-300 mb-1 flex items-center justify-center gap-1">
              <span>第二把米【下卦】</span>
              {step === 1 && <span className="text-amber-300 text-xs animate-bounce">●</span>}
            </div>
            <div className="h-20 flex items-center justify-center">
              {step >= 2 && b2 ? (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {b2} 粒
                  </div>
                  <div className="text-xs text-white font-bold">
                    {lowerInfo?.symbol} {lowerInfo?.name}為{lowerInfo?.nature}（{lowerInfo?.element}）
                  </div>
                </div>
              ) : (
                <div className="text-4xl text-slate-600 font-mono group-hover:scale-110 transition-all">
                  🍚
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {step >= 2 && b2
                ? `除以 8 餘 ${b2 % 8 || 8}`
                : step === 1
                ? '👉 點擊抓第二把米【下卦】'
                : '等候抓第一把米'}
            </div>
          </div>

          {/* 第三把米 (動爻) */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => (step === 2 ? handleGrabBowl(3) : undefined)}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && step === 2) {
                handleGrabBowl(3);
              }
            }}
            className={`p-5 rounded-2xl border text-center transition-all duration-300 group ${
              step === 2
                ? 'border-purple-400/90 bg-purple-950/40 shadow-lg shadow-purple-950/70 hover:scale-[1.04] cursor-pointer animate-pulse'
                : step >= 3
                ? 'bg-purple-950/40 border-purple-400 shadow-md shadow-purple-950/40'
                : 'bg-slate-950/60 border-slate-800 opacity-60'
            }`}
            title={step === 2 ? '點擊抓第三把米【動爻】' : step < 2 ? '請先完成前兩把米' : '動爻已定'}
          >
            <div className="text-[11px] font-bold text-purple-300 mb-1 flex items-center justify-center gap-1">
              <span>第三把米【動爻】</span>
              {step === 2 && <span className="text-amber-300 text-xs animate-bounce">●</span>}
            </div>
            <div className="h-20 flex items-center justify-center">
              {step >= 3 && b3 ? (
                <div className="space-y-1 animate-fade-in">
                  <div className="text-2xl font-black text-amber-300 font-mono">
                    {b3} 粒
                  </div>
                  <div className="text-xs text-white font-bold">
                    第 {result?.movingLine || (b3 % 6 || 6)} 爻發動
                  </div>
                </div>
              ) : (
                <div className="text-4xl text-slate-600 font-mono group-hover:scale-110 transition-all">
                  🍚
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">
              {step >= 3 && b3
                ? `除以 6 餘 ${b3 % 6 || 6}`
                : step === 2
                ? '👉 點擊抓第三把米【動爻】'
                : '等候完成前兩把米'}
            </div>
          </div>
        </div>

        {/* 互動引導指引膠囊 */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {isCasting
                ? '五穀真靈正在為您感應易理天機...'
                : step === 0
                ? '✨ 請點擊第 1 只米碗抓【上卦】（亦可點擊右上角一鍵連抓）'
                : step === 1
                ? '✨ 第 1 把米已成！請點擊第 2 只米碗抓【下卦】'
                : step === 2
                ? '✨ 上下卦已定！請點擊第 3 只米碗定【動爻】'
                : '✨ 六十四卦本卦變卦推演完畢！點擊右上角【重新抓米 (Reload)】即可清空重置'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            深呼吸三次，在心中默念所求問題，手動點擊米碗依序推演先天八卦與動爻。
          </p>
        </div>
      </div>

      {/* 卦象解析展示 */}
      {result && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-4 animate-fade-in">
          {/* 本卦與變卦對比 */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            {/* 本卦 */}
            <div className="flex items-center gap-3 text-center md:text-left">
              <div className="text-4xl text-amber-300 font-serif">
                {result.upperTrigram.symbol}
                <br />
                {result.lowerTrigram.symbol}
              </div>
              <div>
                <span className="text-[11px] text-indigo-400 font-bold block">【起得本卦】</span>
                <h4 className="text-lg font-black text-white">{result.name}</h4>
                <span className="text-xs text-slate-400">
                  動爻：第 {result.movingLine} 爻陰陽逆轉
                </span>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-indigo-400 shrink-0 hidden md:block" />

            {/* 變卦 */}
            <div className="text-center md:text-right border-t md:border-t-0 border-slate-800 pt-2 md:pt-0 w-full md:w-auto">
              <span className="text-[11px] text-purple-400 font-bold block">【未來演化・變卦】</span>
              <h5 className="text-base font-black text-purple-200">{result.transformedHexagramName}</h5>
              <span className="text-xs text-slate-400">預示事態轉折後的發展時序</span>
            </div>
          </div>

          {/* 卦辭 */}
          <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-xs">
            <span className="font-bold text-indigo-300 block mb-1">【易經經文卦辭】</span>
            <p className="text-slate-200 leading-relaxed font-serif text-sm">{result.judgment}</p>
          </div>

          {/* 心理學三層結構解讀 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
              <span className="font-bold text-purple-300 flex items-center gap-1 text-[11px]">
                <Eye className="w-3.5 h-3.5" />
                <span>【當前能量鏡像】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{result.energyMirror}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>【盲點與因果提醒】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{result.blindSpot}</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>【具體破局指引】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{result.actionAdvice}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
