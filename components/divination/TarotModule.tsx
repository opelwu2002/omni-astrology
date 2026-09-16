'use client';

/**
 * 塔羅牌神聖占卜模組 (TarotModule)
 * 支援大阿爾克那 22 張牌、單張啟示 / 三張時間之流牌陣、正逆位判定
 * 整合消費者心理學三層解讀交付架構
 */
import React, { useState } from 'react';
import { TAROT_MAJOR_ARCANA, TarotCard } from '@/data/divinationData';
import {
  Sparkles,
  RefreshCw,
  Eye,
  Compass,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface DrawnCard {
  card: TarotCard;
  isReversed: boolean;
  positionLabel: string;
}

export default function TarotModule() {
  const [spreadType, setSpreadType] = useState<'single' | 'three'>('single');
  const [isShuffling, setIsShuffling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [revealedIndex, setRevealedIndex] = useState<number[]>([]);

  // 抽牌處理
  const handleDraw = () => {
    setIsShuffling(true);
    setDrawnCards([]);
    setRevealedIndex([]);

    setTimeout(() => {
      // 隨機打亂 22 張牌
      const shuffled = [...TAROT_MAJOR_ARCANA].sort(() => Math.random() - 0.5);

      if (spreadType === 'single') {
        const picked = shuffled[0];
        const isReversed = Math.random() < 0.35; // 35% 逆位機率
        setDrawnCards([
          {
            card: picked,
            isReversed,
            positionLabel: '當下靈魂啟示',
          },
        ]);
        setRevealedIndex([0]);
      } else {
        const positions = ['過去・因緣根基', '現在・核心處境', '未來・動態走向'];
        const selected = shuffled.slice(0, 3).map((card, idx) => ({
          card,
          isReversed: Math.random() < 0.35,
          positionLabel: positions[idx],
        }));
        setDrawnCards(selected);
        // 依序翻牌
        setRevealedIndex([0, 1, 2]);
      }
      setIsShuffling(false);
    }, 900);
  };

  return (
    <div className="space-y-6">
      {/* 牌陣選擇與抽牌觸發列 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/80 border border-purple-500/30">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>西洋大阿爾克那・神聖塔羅解碼</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            22 張原型心靈符號，隨機抽取正逆位，洞察潛意識深層指引
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs flex-1 sm:flex-initial flex">
            <button
              type="button"
              onClick={() => {
                setSpreadType('single');
                setDrawnCards([]);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center ${
                spreadType === 'single'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              單張啟示
            </button>
            <button
              type="button"
              onClick={() => {
                setSpreadType('three');
                setDrawnCards([]);
              }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg font-medium transition cursor-pointer min-h-[44px] sm:min-h-0 flex items-center justify-center ${
                spreadType === 'three'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              三張時間之流
            </button>
          </div>

          <button
            type="button"
            onClick={handleDraw}
            disabled={isShuffling}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{isShuffling ? '洗牌中...' : drawnCards.length > 0 ? '重新洗牌占卜' : '開始抽牌解惑'}</span>
          </button>
        </div>
      </div>

      {/* 牌面展示區 */}
      {drawnCards.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-950/60 border border-slate-800 border-dashed">
          <Layers className="w-12 h-12 text-purple-400/50 mx-auto mb-3 animate-pulse" />
          <h5 className="text-sm font-bold text-slate-300">牌卡已就位，靜待您的專注意念</h5>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            請依據上方引導完成深呼吸定心，點擊「開始抽牌解惑」，由宇宙同步性共振為您揭開牌面。
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div
            className={`grid gap-4 ${
              drawnCards.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {drawnCards.map((item, idx) => {
              const interpretation = item.isReversed ? item.card.reversed : item.card.upright;
              const isRevealed = revealedIndex.includes(idx);

              return (
                <div
                  key={idx}
                  className="bg-slate-900 border border-purple-500/40 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:border-purple-400 transition"
                >
                  {/* 牌陣位置標籤 */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                      {item.positionLabel}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        item.isReversed
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                      }`}
                    >
                      {item.isReversed ? '▼ 逆位 (Reversed)' : '▲ 正位 (Upright)'}
                    </span>
                  </div>

                  {/* 牌卡視覺 */}
                  <div className="flex flex-col items-center justify-center py-4 bg-gradient-to-b from-purple-950/40 to-slate-950 rounded-xl border border-purple-500/20 text-center">
                    <div
                      className={`text-5xl mb-2 transition-transform duration-500 ${
                        item.isReversed ? 'rotate-180' : ''
                      }`}
                    >
                      {item.card.symbol}
                    </div>
                    <div className="font-mono text-[10px] text-purple-400">
                      NO. {item.card.id}・{item.card.nameEn}
                    </div>
                    <div className="text-lg font-black text-white mt-0.5">{item.card.name}</div>
                    <div className="text-xs text-amber-300 font-semibold mt-1">
                      {interpretation.title}
                    </div>

                    {/* 關鍵字標籤 */}
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                      {interpretation.keywords.map((kw, kidx) => (
                        <span
                          key={kidx}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 三層解讀結構 */}
                  <div className="space-y-3 text-xs">
                    {/* 1. 當前能量鏡像 */}
                    <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 space-y-1">
                      <span className="font-bold text-purple-300 flex items-center gap-1 text-[11px]">
                        <Eye className="w-3.5 h-3.5" />
                        <span>【當前能量鏡像】</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{interpretation.energyMirror}</p>
                    </div>

                    {/* 2. 盲點與因果提醒 */}
                    <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                      <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>【盲點與因果提醒】</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{interpretation.blindSpot}</p>
                    </div>

                    {/* 3. 具體破局指引 */}
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                      <span className="font-bold text-emerald-300 flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>【具體破局指引（當週行動）】</span>
                      </span>
                      <p className="text-slate-300 leading-relaxed">{interpretation.actionAdvice}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
