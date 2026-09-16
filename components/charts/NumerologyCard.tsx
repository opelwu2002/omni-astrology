'use client';

/**
 * 生命靈數與九宮格連線分析卡片 (NumerologyCard)
 * 特色：
 * 1. 檢測到連線（如 1-5-9、2-5-8 等）時，自動觸發 canvas-confetti 慶祝粒子特效
 * 2. 啟動的連線呈現金色跑馬呼吸燈特效 (Golden Flowing Shimmer & Breathing Pulse)
 * 3. 畢達哥拉斯九宮格圈數與三大核心數值透析
 */

import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { NumerologyChartData } from '@/types/astrology';
import { Hash, Sparkles, CheckCircle2, PartyPopper, Award } from 'lucide-react';

interface Props {
  data: NumerologyChartData;
}

export default function NumerologyCard({ data }: Props) {
  // 畢達哥拉斯九宮格標準順序：
  // 第一列: 1, 2, 3
  // 第二列: 4, 5, 6
  // 第三列: 7, 8, 9
  const gridCells = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ];

  const isMasterNumber = [11, 22, 33].includes(data.destinyNumber);
  const activeLines = data.lines.filter((l) => l.active);
  const hasActiveLines = activeLines.length > 0;
  const hasTriggeredConfetti = useRef(false);

  // 當檢測到連線時，觸發 canvas-confetti 慶祝粒子特效
  const fireCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#fbbf24', '#ec4899', '#a855f7', '#6366f1'],
      });
    } catch {
      // 容錯防崩
    }
  };

  useEffect(() => {
    if (hasActiveLines && !hasTriggeredConfetti.current) {
      hasTriggeredConfetti.current = true;
      const timer = setTimeout(() => {
        fireCelebration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [hasActiveLines]);

  // 收集所有已連線中包含的數字集合
  const activeLineNumbers = new Set<number>();
  activeLines.forEach((line) => {
    line.numbers.forEach((num) => activeLineNumbers.add(num));
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* 頂部標題列 */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">畢達哥拉斯生命靈數與九宮格</h3>
              {hasActiveLines && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  已達成 {activeLines.length} 條天賦連線
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">西元生日數字能量與神聖幾何藍圖</p>
          </div>
        </div>

        {hasActiveLines && (
          <button
            type="button"
            onClick={fireCelebration}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1 cursor-pointer shadow-sm"
            title="點擊再次激發連線慶祝粒子"
          >
            <PartyPopper className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">慶祝連線</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* 左側：三大核心數字 */}
        <div className="md:col-span-5 space-y-3">
          {/* 命運數主卡片 */}
          <div className="relative overflow-hidden bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/40 rounded-xl p-4 text-center shadow-lg">
            <span className="text-xs text-pink-300 font-medium">主修命運數 (Destiny Number)</span>
            <div className="flex items-center justify-center gap-2 my-1">
              <span className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-pink-300 via-purple-200 to-amber-300 bg-clip-text text-transparent font-mono">
                {data.destinyNumber}
              </span>
              {isMasterNumber && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  卓越數大師
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">代表一生靈魂追求的最高境界與核心天命</p>
          </div>

          {/* 生日數與態度數 */}
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">生日數 (天賦能力)</span>
              <span className="text-lg font-bold text-indigo-300 font-mono">
                {data.birthdayNumber} 數
              </span>
            </div>
            <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 block">態度數 (處世風格)</span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {data.attitudeNumber} 數
              </span>
            </div>
          </div>
        </div>

        {/* 右側：3x3 畢達哥拉斯九宮格 */}
        <div className="md:col-span-7">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>畢達哥拉斯九宮格 (能量圈數)</span>
            <span className="text-[10px] text-slate-500">金色高亮為已啟動天賦連線</span>
          </div>

          <div className="grid grid-cols-3 gap-2 bg-slate-950/90 p-3 rounded-xl border border-slate-800 shadow-inner">
            {gridCells.map((row) =>
              row.map((num) => {
                const count = data.gridCounts[num] || 0;
                const hasNumber = count > 0;
                const isInActiveLine = activeLineNumbers.has(num);

                return (
                  <div
                    key={`num-${num}`}
                    className={`relative p-2.5 sm:p-3 rounded-xl border text-center transition-all overflow-hidden ${
                      isInActiveLine
                        ? 'bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-slate-900 border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)] animate-pulse'
                        : hasNumber
                        ? 'bg-purple-950/30 border-pink-500/50 shadow-sm'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-50'
                    }`}
                  >
                    {/* 金色跑馬流光飾條 */}
                    {isInActiveLine && (
                      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-amber-300/15 to-transparent animate-shimmer" />
                    )}

                    <span className="font-mono text-lg sm:text-xl font-black text-white block">
                      {num}
                    </span>
                    <span
                      className={`text-[10px] font-mono block mt-0.5 ${
                        isInActiveLine
                          ? 'text-amber-300 font-bold'
                          : hasNumber
                          ? 'text-pink-300 font-semibold'
                          : 'text-slate-600'
                      }`}
                    >
                      {hasNumber ? `(${count}個)` : '-'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 連線天賦特質列表 (具備金色跑馬呼吸燈特效) */}
      <div className="mt-5 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>靈數天賦連線深度分析</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            共 {data.lines.length} 條潛能軸線
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {data.lines.map((line, idx) => (
            <div
              key={idx}
              className={`relative p-3 rounded-xl border flex items-start gap-2.5 transition-all overflow-hidden ${
                line.active
                  ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-purple-950/30 border-amber-400/70 text-slate-100 shadow-[0_0_15px_rgba(251,191,36,0.25)] animate-pulse'
                  : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
              }`}
            >
              {/* 金色呼吸燈與核取圖示 */}
              <div className="mt-0.5 shrink-0">
                {line.active ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-400/80 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-slate-800 flex items-center justify-center text-[9px] text-slate-600 font-mono">
                    {line.numbers.join('-')}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold text-xs ${
                      line.active ? 'text-amber-300' : 'text-slate-400'
                    }`}
                  >
                    {line.name} ({line.numbers.join('-')})
                  </span>
                  {line.active && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-bold shadow-sm">
                      已啟動
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed mt-1 text-slate-300">
                  {line.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
