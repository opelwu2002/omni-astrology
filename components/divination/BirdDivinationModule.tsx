'use client';

/**
 * 線上文鳥鳥卦占卜模組 (BirdDivinationModule)
 * 擬真靈動小文鳥出籠跳躍、在籤筒中叼出神聖木籤之動畫
 * 標註【時機吉凶】、【貴人方位】、【忌諱作法】與消費者心理學三層解讀
 */
import React, { useState } from 'react';
import { BIRD_LOTS, BirdLot } from '@/data/divinationData';
import {
  Feather,
  Sparkles,
  Compass,
  AlertOctagon,
  Scroll,
  RotateCw,
  Award,
  Eye,
  CheckCircle2,
} from 'lucide-react';

export default function BirdDivinationModule() {
  const [isPicking, setIsPicking] = useState(false);
  const [birdState, setBirdState] = useState<'perched' | 'hopping' | 'holding'>('perched');
  const [drawnLot, setDrawnLot] = useState<BirdLot | null>(null);

  // 重置回到等待手動點擊觸發的初始盲盒狀態 (不自動抽籤)
  const handleReset = () => {
    setIsPicking(false);
    setBirdState('perched');
    setDrawnLot(null);
  };

  const handlePickLot = () => {
    setIsPicking(true);
    setDrawnLot(null);
    setBirdState('hopping');

    // 動畫 1: 文鳥出籠跳躍
    setTimeout(() => {
      setBirdState('holding'); // 叼起籤詩
    }, 700);

    // 動畫 2: 交付籤詩
    setTimeout(() => {
      const randomLot = BIRD_LOTS[Math.floor(Math.random() * BIRD_LOTS.length)];
      setDrawnLot(randomLot);
      setIsPicking(false);
      setBirdState('perched');
    }, 1400);
  };

  return (
    <div className="space-y-6">
      {/* 頂部標題 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Feather className="w-4 h-4 text-emerald-400" />
              <span>正統民俗文鳥鳥卦・神鳥銜籤解惑</span>
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              易理卦籤真傳
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            文鳥靈動具靈性，自古善通天地陰陽，為您叼選指引本心之天機
          </p>
        </div>

        <button
          type="button"
          onClick={drawnLot ? handleReset : handlePickLot}
          disabled={isPicking}
          className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer flex items-center gap-2 min-h-[44px] shrink-0 disabled:opacity-50"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isPicking ? 'animate-spin' : ''}`} />
          <span>{isPicking ? '文鳥靈動銜籤中...' : drawnLot ? '重新抽籤 (Reload)' : '誠心請靈鳥銜籤'}</span>
        </button>
      </div>

      {/* 擬真文鳥動畫舞台 (直接點擊靈鳥、籤筒或舞台皆可觸發抽籤) */}
      <div
        role="button"
        tabIndex={0}
        onClick={!isPicking ? handlePickLot : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isPicking) {
            handlePickLot();
          }
        }}
        className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-black border relative overflow-hidden shadow-2xl transition-all duration-300 select-none group ${
          isPicking
            ? 'border-emerald-500/50 cursor-wait opacity-90'
            : 'border-emerald-500/30 hover:border-emerald-400/80 hover:shadow-emerald-950/50 cursor-pointer'
        }`}
        title="點擊靈鳥或籤筒即可抽籤"
      >
        <div className="max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
          {/* 鳥架與文鳥與籤筒容器 */}
          <div className="w-full h-44 relative flex items-center justify-around px-6">
            {/* 左側：精緻竹製鳥籠與棲木 */}
            <div className="flex flex-col items-center group-hover:scale-[1.02] transition-transform duration-300">
              <div className="w-20 h-28 border-2 border-amber-700/60 rounded-t-full relative flex items-center justify-center bg-amber-950/20 shadow-inner">
                {/* 籠條紋 */}
                <div className="absolute inset-x-3 inset-y-1 border-x border-amber-700/40"></div>
                <div className="absolute w-12 h-1 bg-amber-600 top-14 rounded-full"></div>
              </div>
              <div className="w-16 h-1.5 bg-amber-800 rounded-full mt-1"></div>
            </div>

            {/* 中間：活靈活現的白文鳥 (支援獨立點擊與 Hover 特效) */}
            <div
              className={`transition-all duration-500 ease-out transform flex flex-col items-center group-hover:drop-shadow-[0_0_12px_rgba(52,211,153,0.4)] ${
                birdState === 'hopping'
                  ? 'translate-x-12 -translate-y-6 scale-110'
                  : birdState === 'holding'
                  ? 'translate-x-16 translate-y-2'
                  : 'translate-x-0 translate-y-0 group-hover:scale-105'
              }`}
            >
              {/* 白文鳥 SVG 擬真向量圖標 */}
              <div className="relative">
                <svg
                  className="w-16 h-16 drop-shadow-lg"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* 鳥身 (雪白) */}
                  <ellipse cx="32" cy="36" rx="16" ry="14" fill="#F8FAFC" />
                  {/* 鳥頭 */}
                  <circle cx="42" cy="24" r="10" fill="#F8FAFC" />
                  {/* 招牌紅喙 */}
                  <polygon points="50,23 60,26 50,29" fill="#F43F5E" />
                  {/* 紅眼眶與靈性黑眼珠 */}
                  <circle cx="43" cy="22" r="3.5" fill="#FB7185" />
                  <circle cx="43" cy="22" r="1.8" fill="#0F172A" />
                  <circle cx="43.5" cy="21.5" r="0.6" fill="#FFFFFF" />
                  {/* 翅膀線條 */}
                  <path
                    d="M20 32 Q 28 42 34 34"
                    stroke="#CBD5E1"
                    strokeWidth="2"
                    fill="none"
                  />
                  {/* 尾羽 */}
                  <polygon points="18,38 8,46 16,34" fill="#E2E8F0" />
                  {/* 小粉紅爪 */}
                  <line x1="28" y1="48" x2="28" y2="54" stroke="#F43F5E" strokeWidth="2" />
                  <line x1="36" y1="48" x2="36" y2="54" stroke="#F43F5E" strokeWidth="2" />
                </svg>

                {/* 嘴裡叼著的木籤 (銜籤狀態顯示) */}
                {(birdState === 'holding' || isPicking) && (
                  <div className="absolute top-5 right-[-10px] w-6 h-1.5 bg-amber-400 border border-amber-600 rounded-sm rotate-12 shadow animate-pulse"></div>
                )}
              </div>
              <span className="text-[10px] text-emerald-300 font-mono mt-1">
                {birdState === 'hopping'
                  ? '跳向籤筒...'
                  : birdState === 'holding'
                  ? '銜取神籤！'
                  : '點我抽籤'}
              </span>
            </div>

            {/* 右側：古典籤筒 (Hover 浮動效果) */}
            <div className="flex flex-col items-center group-hover:-translate-y-1 transition-transform duration-300">
              <div className="w-14 h-24 bg-gradient-to-b from-amber-900 via-amber-950 to-stone-900 border border-amber-600/50 rounded-b-xl relative flex items-start justify-center pt-2 shadow-2xl">
                {/* 籤筒內部露出的多支木籤 */}
                <div className="flex gap-1 -mt-4">
                  <div className="w-1 h-6 bg-amber-300 rounded-t-sm rotate-[-6deg]"></div>
                  <div className="w-1 h-8 bg-amber-200 rounded-t-sm"></div>
                  <div className="w-1 h-7 bg-amber-400 rounded-t-sm rotate-[8deg]"></div>
                </div>
                <span className="text-[10px] text-amber-400 font-serif writing-vertical mt-4">
                  神籤
                </span>
              </div>
              <div className="w-16 h-2 bg-stone-800 rounded-full mt-1"></div>
            </div>
          </div>

          {/* 直覺互動引導膠囊 */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold shadow-md group-hover:bg-emerald-500/30 transition">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {isPicking
                ? '文鳥全神感應天機中...'
                : drawnLot
                ? '✨ 點擊靈鳥或籤筒即可【重新抽籤】'
                : '✨ 點擊靈鳥或籤筒即可【抽籤起卦】'}
            </span>
          </div>

          <p className="text-xs text-slate-400 text-center">
            {isPicking
              ? '文鳥正在為您全神貫注感應天機，請屏息期待...'
              : '心中默念姓名與所求之事三次，直接點擊靈鳥、籤筒或按鈕即可銜籤。'}
          </p>
        </div>
      </div>

      {/* 叼出之卦籤展示 */}
      {drawnLot && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-4 animate-fade-in">
          {/* 籤頭與吉凶評定 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs text-emerald-400 font-bold block">
                靈鳥銜得第 {drawnLot.id} 籤・{drawnLot.hexagramName}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-black border ${
                    drawnLot.auspiciousLevel === '大吉' || drawnLot.auspiciousLevel === '上吉'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : drawnLot.auspiciousLevel === '中平'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  【時機：{drawnLot.auspiciousLevel}】
                </span>
                <span className="text-xs text-slate-400">
                  貴人方位：<strong className="text-white">{drawnLot.luckyDirection}</strong>
                </span>
              </div>
            </div>

            <div className="text-right text-xs text-rose-300 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-500/30">
              <span className="font-bold block text-[11px] text-rose-400">🛑 當前大忌</span>
              {drawnLot.taboos}
            </div>
          </div>

          {/* 籤詩與白話解籤 */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="font-serif text-sm text-emerald-100 whitespace-pre-line leading-relaxed tracking-widest text-center md:text-left border-b md:border-b-0 md:border-r border-slate-800 pb-3 md:pb-0 md:pr-6">
              {drawnLot.poem}
            </div>
            <div className="flex-1 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-emerald-300 block mb-1">【文鳥白話解籤】</span>
              {drawnLot.plainExplanation}
            </div>
          </div>

          {/* 心理學三層結構解讀 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
              <span className="font-bold text-purple-300 flex items-center gap-1 text-[11px]">
                <Eye className="w-3.5 h-3.5" />
                <span>【當前能量鏡像】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {drawnLot.psychology.energyMirror}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>【盲點與因果提醒】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {drawnLot.psychology.blindSpot}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>【具體破局指引】</span>
              </span>
              <p className="text-slate-300 leading-relaxed">
                {drawnLot.psychology.actionAdvice}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
