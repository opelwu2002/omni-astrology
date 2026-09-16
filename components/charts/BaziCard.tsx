'use client';

/**
 * 八字四柱排盤與五行力量分析卡片 (BaziCard)
 */
import React from 'react';
import { BaziChartData, BaziPillar } from '@/types/astrology';
import { Compass } from 'lucide-react';

interface Props {
  data: BaziChartData;
}

export default function BaziCard({ data }: Props) {
  const pillars: { title: string; pillar: BaziPillar; isDayMaster?: boolean }[] = [
    { title: '年柱 (根)', pillar: data.yearPillar },
    { title: '月柱 (苗/提綱)', pillar: data.monthPillar },
    { title: '日柱 (花/本命)', pillar: data.dayPillar, isDayMaster: true },
    { title: '時柱 (果)', pillar: data.hourPillar },
  ];

  const elementColorMap: Record<string, { text: string; bg: string; border: string }> = {
    木: { text: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-500/40' },
    火: { text: 'text-rose-400', bg: 'bg-rose-950/40', border: 'border-rose-500/40' },
    土: { text: 'text-amber-400', bg: 'bg-amber-950/40', border: 'border-amber-500/40' },
    金: { text: 'text-slate-200', bg: 'bg-slate-800/40', border: 'border-slate-500/40' },
    水: { text: 'text-blue-400', bg: 'bg-blue-950/40', border: 'border-blue-500/40' },
  };

  const totalScore =
    data.elementScores.wood +
    data.elementScores.fire +
    data.elementScores.earth +
    data.elementScores.metal +
    data.elementScores.water || 1;

  const elements = [
    { name: '木', score: data.elementScores.wood, color: 'bg-emerald-500', text: 'text-emerald-400' },
    { name: '火', score: data.elementScores.fire, color: 'bg-rose-500', text: 'text-rose-400' },
    { name: '土', score: data.elementScores.earth, color: 'bg-amber-500', text: 'text-amber-400' },
    { name: '金', score: data.elementScores.metal, color: 'bg-slate-300', text: 'text-slate-300' },
    { name: '水', score: data.elementScores.water, color: 'bg-blue-500', text: 'text-blue-400' },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">八字四柱命盤與五行力量</h3>
            <p className="text-xs text-slate-400">
              日主元神：【{data.dayMaster} {data.dayMasterElement}】 ｜ 節氣：{data.solarTerm}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
          四柱八字排盤
        </span>
      </div>

      {/* 四柱排盤卡片條 */}
      <div className="grid grid-cols-4 gap-2 text-center mb-5">
        {pillars.map((item, idx) => {
          const stemStyle = elementColorMap[item.pillar.stemFiveElement] || elementColorMap['木'];
          const branchStyle = elementColorMap[item.pillar.branchFiveElement] || elementColorMap['土'];

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                item.isDayMaster
                  ? 'bg-gradient-to-b from-purple-950/30 to-slate-950 border-purple-500/60 shadow-md'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              {/* 柱名與十神 */}
              <div className="border-b border-slate-800/80 pb-1.5 mb-2">
                <span className="text-[10px] text-slate-400 block">{item.title}</span>
                <span className="text-xs font-semibold text-purple-300">
                  {item.pillar.tenGod}
                </span>
              </div>

              {/* 天干 */}
              <div className="my-1">
                <span className={`text-xl sm:text-2xl font-black ${stemStyle.text}`}>
                  {item.pillar.heavenlyStem}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {item.pillar.stemFiveElement}
                </span>
              </div>

              {/* 地支 */}
              <div className="my-1">
                <span className={`text-xl sm:text-2xl font-black ${branchStyle.text}`}>
                  {item.pillar.earthlyBranch}
                </span>
                <span className="block text-[10px] text-slate-500 font-medium">
                  {item.pillar.branchFiveElement}
                </span>
              </div>

              {/* 藏干 */}
              <div className="mt-2 pt-2 border-t border-slate-800/80">
                <span className="text-[9px] text-slate-500 block">支藏</span>
                <div className="flex justify-center gap-1 text-[11px] text-slate-300 font-mono">
                  {item.pillar.hiddenStems.map((h, hIdx) => (
                    <span key={hIdx}>{h}</span>
                  ))}
                </div>
              </div>

              {/* 納音 */}
              <div className="mt-1.5">
                <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded border border-slate-800">
                  {item.pillar.nayin}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 五行能量分佈進度條 */}
      <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
        <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>五行強弱分佈比例 (木・火・土・金・水)</span>
          <span className="text-[11px] text-slate-500">以月令提綱與藏干權重加權</span>
        </h4>

        {/* 聚合進度條 */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex mb-3">
          {elements.map((elem) => {
            const percent = ((elem.score / totalScore) * 100).toFixed(1);
            return (
              <div
                key={elem.name}
                style={{ width: `${percent}%` }}
                className={`${elem.color} transition-all`}
                title={`${elem.name}: ${percent}%`}
              />
            );
          })}
        </div>

        {/* 五行項目數值 */}
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {elements.map((elem) => {
            const percent = ((elem.score / totalScore) * 100).toFixed(0);
            return (
              <div key={elem.name} className="bg-slate-900/90 p-1.5 rounded-lg border border-slate-800">
                <span className={`font-bold block ${elem.text}`}>{elem.name}</span>
                <span className="text-white font-mono font-semibold">{percent}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
