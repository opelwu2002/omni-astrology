'use client';

/**
 * 紫微斗數 3D 方盤與三方四正粒子光線連線組件 (ZiweiChart)
 * 特色：
 * 1. 點擊「命宮」觸發 CSS 3D perspective 翻轉卡片，背面揭露深層格局密語
 * 2. Canvas 金色粒子光線瞬間從命宮直射連向「財帛宮」、「官祿宮」、「遷移宮」，並激發光環脈衝
 * 3. 傳統 4x4 方盤佈局，中堂展現五行局與命身主星
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZiweiChartData, ZiweiPalace } from '@/types/astrology';
import { Flame, Star, Sparkles, Zap, RotateCcw } from 'lucide-react';

interface Props {
  data: ZiweiChartData;
}

interface Point {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export default function ZiweiChart({ data }: Props) {
  const [isMingFlipped, setIsMingFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const palaceRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const getPalace = (branchIndex: number): ZiweiPalace | undefined => {
    return data.palaces.find((p) => p.index === branchIndex);
  };

  const mingPalace = data.palaces.find((p) => p.name === '命宮');
  const travelPalace = data.palaces.find((p) => p.name === '遷移');
  const wealthPalace = data.palaces.find((p) => p.name === '財帛');
  const careerPalace = data.palaces.find((p) => p.name === '官祿');

  // 獲取宮位中心點座標 (相對於 Canvas 容器)
  const getPalaceCenter = useCallback((branchIdx?: number): Point | null => {
    if (branchIdx === undefined || !containerRef.current) return null;
    const el = palaceRefs.current[branchIdx];
    if (!el) return null;

    const containerRect = containerRef.current.getBoundingClientRect();
    const cellRect = el.getBoundingClientRect();

    return {
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top + cellRect.height / 2,
    };
  }, []);

  // 執行三方四正金色粒子雷射光線動畫
  const triggerSanFangSiZhengAnimation = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 校準尺寸
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const start = getPalaceCenter(mingPalace?.index);
    const targetTravel = getPalaceCenter(travelPalace?.index);
    const targetWealth = getPalaceCenter(wealthPalace?.index);
    const targetCareer = getPalaceCenter(careerPalace?.index);

    if (!start) return;

    const targets = [targetTravel, targetWealth, targetCareer].filter(
      (t): t is Point => t !== null
    );

    let progress = 0;
    const duration = 40; // 動畫影格數
    const particles: Particle[] = [];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      progress += 1 / duration;
      const currentProgress = Math.min(1, progress);

      // 繪製從命宮射向三方四正的光線
      targets.forEach((target) => {
        const curX = start.x + (target.x - start.x) * currentProgress;
        const curY = start.y + (target.y - start.y) * currentProgress;

        // 外部金色流光主束
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.stroke();

        // 內部白金耀光核心
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(curX, curY);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.shadowBlur = 5;
        ctx.stroke();

        // 在光束頭部產生粒子
        for (let i = 0; i < 3; i++) {
          particles.push({
            x: curX,
            y: curY,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            alpha: 1,
            size: Math.random() * 3 + 1.5,
            color: Math.random() > 0.3 ? '#f59e0b' : '#c084fc',
          });
        }

        // 當抵達目標宮位時，繪製擴散光環
        if (currentProgress > 0.8) {
          const ringProgress = (currentProgress - 0.8) / 0.2;
          ctx.beginPath();
          ctx.arc(target.x, target.y, ringProgress * 28, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(245, 158, 11, ${1 - ringProgress})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      // 更新與繪製粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      if (progress < 1.3 || particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    requestAnimationFrame(animate);
  }, [mingPalace, travelPalace, wealthPalace, careerPalace, getPalaceCenter]);

  // 點擊命宮處理函數
  const handleMingPalaceClick = () => {
    setIsMingFlipped((prev) => !prev);
    triggerSanFangSiZhengAnimation();
  };

  // 渲染單一宮位格
  const renderPalaceCell = (branchIdx: number) => {
    const palace = getPalace(branchIdx);
    if (!palace) return <div className="border border-slate-800 bg-slate-950/60 p-2" />;

    const isMing = palace.name === '命宮';
    const isShen = palace.isBodyPalace;
    const isSanFang = ['財帛', '官祿', '遷移'].includes(palace.name);

    if (isMing) {
      // 命宮：支援 CSS perspective 3D 翻轉
      return (
        <div
          key={`palace-${branchIdx}`}
          ref={(el) => {
            palaceRefs.current[branchIdx] = el;
          }}
          onClick={handleMingPalaceClick}
          className="relative cursor-pointer select-none group [perspective:1000px]"
          title="點擊命宮：3D 翻轉與激發三方四正粒子連線"
        >
          <div
            className={`w-full h-full duration-500 [transform-style:preserve-3d] rounded-lg transition-transform ${
              isMingFlipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* 正面：主星與宮位資訊 */}
            <div className="absolute inset-0 [backface-visibility:hidden] p-2 flex flex-col justify-between border bg-gradient-to-br from-purple-950/70 via-slate-900 to-indigo-950/80 border-amber-400/90 shadow-[0_0_15px_rgba(251,191,36,0.3)] rounded-lg">
              {/* 頂部徽章 */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-amber-500 text-slate-950 flex items-center gap-0.5 shadow-sm animate-pulse">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  命宮・點擊3D
                </span>
                <span className="text-[9px] text-amber-300 font-mono font-bold">
                  {palace.heavenlyStem}
                  {palace.earthlyBranch}
                </span>
              </div>

              {/* 主星群 */}
              <div className="my-1">
                <div className="flex flex-wrap gap-1 items-start">
                  {palace.majorStars.map((star, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-0.5">
                      <span className="font-black text-sm text-amber-300 drop-shadow-md">
                        {star.name}
                      </span>
                      {star.mutagen && (
                        <span className="text-[9px] px-1 rounded font-bold bg-rose-600 text-white shadow-sm">
                          {star.mutagen}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {palace.minorStars.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 text-[9px] text-purple-200">
                    {palace.minorStars.slice(0, 4).map((m, idx) => (
                      <span key={idx} className="bg-purple-900/50 px-1 rounded">
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部 */}
              <div className="pt-1.5 border-t border-purple-500/30 flex items-center justify-between text-[10px]">
                <span className="font-bold text-white bg-purple-600 px-1 rounded">命宮</span>
                <span className="text-slate-400">{palace.ages}歲</span>
              </div>
            </div>

            {/* 背面：深層靈魂密語 (3D 翻轉後呈現) */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] p-2 flex flex-col justify-between border bg-gradient-to-br from-amber-950/80 via-purple-950/90 to-slate-950 border-amber-300 rounded-lg shadow-2xl text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-amber-300 font-bold">
                <Sparkles className="w-3 h-3" />
                <span>三方四正共振</span>
              </div>

              <div className="my-auto">
                <p className="text-[11px] font-extrabold text-white leading-tight">
                  【{mingPalace?.majorStars[0]?.name || '紫微'}坐命】
                </p>
                <p className="text-[9px] text-amber-200/90 mt-1 leading-snug">
                  會合財帛、官祿、遷移
                  <br />
                  天命基業圓融俱足
                </p>
              </div>

              <div className="pt-1 border-t border-amber-500/40 text-[8px] text-slate-400 flex items-center justify-center gap-1">
                <RotateCcw className="w-2.5 h-2.5" />
                <span>再點一次翻回正面</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 一般宮位 (含三方四正高亮)
    return (
      <div
        key={`palace-${branchIdx}`}
        ref={(el) => {
          palaceRefs.current[branchIdx] = el;
        }}
        className={`relative p-2 flex flex-col justify-between border transition-all text-xs select-none rounded-lg ${
          isSanFang
            ? 'bg-purple-950/20 border-purple-500/50 hover:border-amber-400/80 shadow-sm'
            : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/50'
        }`}
      >
        {/* 頂部：主星與四化 */}
        <div>
          <div className="flex flex-wrap gap-1 items-start min-h-[38px]">
            {palace.majorStars.length === 0 ? (
              <span className="text-[10px] text-slate-500 italic">空宮借對宮</span>
            ) : (
              palace.majorStars.map((star, sIdx) => (
                <div key={sIdx} className="flex items-center gap-0.5">
                  <span
                    className={`font-bold text-xs ${
                      isSanFang ? 'text-purple-200' : 'text-slate-200'
                    }`}
                  >
                    {star.name}
                  </span>
                  {star.mutagen && (
                    <span
                      className={`text-[9px] px-1 rounded font-bold text-white shadow-sm ${
                        star.mutagen === '祿'
                          ? 'bg-emerald-600'
                          : star.mutagen === '權'
                          ? 'bg-amber-600'
                          : star.mutagen === '科'
                          ? 'bg-blue-600'
                          : 'bg-rose-600'
                      }`}
                    >
                      {star.mutagen}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 吉煞輔星 */}
          {palace.minorStars.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 text-[9px] text-slate-400">
              {palace.minorStars.slice(0, 3).map((star, mIdx) => (
                <span key={mIdx} className="bg-slate-800/80 px-1 py-0.2 rounded text-slate-300">
                  {star}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 底部：宮位名、干支、大限年齡 */}
        <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span
              className={`font-bold px-1 py-0.2 rounded text-[10px] ${
                isSanFang
                  ? 'bg-purple-800/80 text-purple-200 border border-purple-500/40'
                  : 'text-slate-300 bg-slate-900'
              }`}
            >
              {palace.name}
            </span>
            {isShen && (
              <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1 rounded">
                身
              </span>
            )}
          </div>

          <div className="text-right">
            <span className="font-mono text-[10px] text-slate-300 font-semibold">
              {palace.heavenlyStem}
              {palace.earthlyBranch}
            </span>
            <span className="block text-[8px] text-slate-500">{palace.ages}歲</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col">
      {/* 標題與引導提示 */}
      <div className="w-full flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">中華古法紫微斗數 3D 方盤</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 font-semibold">
                點擊命宮翻轉
              </span>
            </div>
            <p className="text-xs text-slate-400">{data.lunarDateStr}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={triggerSanFangSiZhengAnimation}
          className="text-xs text-amber-300 font-medium bg-amber-950/40 hover:bg-amber-950/70 px-2.5 py-1.5 rounded-lg border border-amber-500/40 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>三方四正粒子連線</span>
        </button>
      </div>

      {/* 4x4 方盤與覆蓋 Canvas 容器 */}
      <div
        ref={containerRef}
        className="relative grid grid-cols-4 grid-rows-4 gap-1.5 w-full aspect-square max-w-[540px] mx-auto bg-slate-950 p-2 rounded-xl border border-slate-800 shadow-inner"
      >
        {/* 金色粒子雷射光線 Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-20 w-full h-full"
        />

        {/* 第一列 (頂部 4 格): 巳(5), 午(6), 未(7), 申(8) */}
        {renderPalaceCell(5)}
        {renderPalaceCell(6)}
        {renderPalaceCell(7)}
        {renderPalaceCell(8)}

        {/* 第二列: 辰(4) [左], 【中堂 2x2】, 酉(9) [右] */}
        {renderPalaceCell(4)}

        {/* 中堂資訊 (佔據 2 欄 2 列) */}
        <div className="col-span-2 row-span-2 bg-gradient-to-br from-slate-900 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 rounded-lg p-2.5 sm:p-3 flex flex-col justify-center items-center text-center select-none shadow-sm">
          <div className="p-2 rounded-full bg-purple-500/20 text-purple-300 mb-1 border border-purple-500/30">
            <Star className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-white text-xs sm:text-sm tracking-wide">
            紫微天機玄中堂
          </h4>
          <p className="text-[10px] text-purple-300 mt-0.5 font-medium">
            {data.fiveElementsBureau}
          </p>

          <div className="grid grid-cols-2 gap-1.5 w-full mt-2 pt-2 border-t border-slate-800 text-xs">
            <div className="bg-slate-950/70 p-1 rounded border border-slate-800">
              <span className="text-[9px] text-slate-500 block">命主星</span>
              <span className="font-bold text-amber-300 text-xs">{data.lifeMasterStar}</span>
            </div>
            <div className="bg-slate-950/70 p-1 rounded border border-slate-800">
              <span className="text-[9px] text-slate-500 block">身主星</span>
              <span className="font-bold text-indigo-300 text-xs">{data.bodyMasterStar}</span>
            </div>
          </div>
        </div>

        {renderPalaceCell(9)}

        {/* 第三列: 卯(3) [左], 【中堂佔位已跨列】, 戌(10) [右] */}
        {renderPalaceCell(3)}
        {renderPalaceCell(10)}

        {/* 第四列 (底部 4 格): 寅(2), 丑(1), 子(0), 亥(11) */}
        {renderPalaceCell(2)}
        {renderPalaceCell(1)}
        {renderPalaceCell(0)}
        {renderPalaceCell(11)}
      </div>
    </div>
  );
}
