'use client';

/**
 * 占星圓盤視覺化組件 (AstrologyChart)
 * 互動式 SVG 繪製 360° 十二星座環、十二宮位分割線、十大行星落點與相位線
 */
import React, { useState } from 'react';
import { WesternAstrologyChartData, PlanetPosition } from '@/types/astrology';
import { ZODIAC_SIGNS, PLANET_META } from '@/lib/astrology/westernAstrology';
import { Sparkles, Info } from 'lucide-react';

interface Props {
  data: WesternAstrologyChartData;
}

export default function AstrologyChart({ data }: Props) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);

  // 畫布幾何尺寸
  const size = 520;
  const center = size / 2;
  const outerRadius = 230;
  const signRingInnerRadius = 185;
  const houseRingInnerRadius = 145;
  const planetRingRadius = 165;
  const aspectCenterRadius = 110;

  // 上升點 (Ascendant) 固定在左側 (180° 或 9點鐘方向)，或者以標準黃道 0° (牡羊座) 起算旋轉
  // 傳統西方占星盤慣例：ASC 在最左側 (180°)
  // 旋轉角 offset = 180 - ascendant.longitude
  const ascLon = data.ascendant.longitude;
  const rotationOffset = 180 - ascLon;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  // 將黃道經度換算為 SVG 畫布 (x, y)
  const getCoordinates = (lon: number, radius: number) => {
    const angle = (lon + rotationOffset) % 360;
    // SVG 座標系：0 度向右 (3點鐘)，順時針增加。占星盤為逆時針排布，故用 -angle
    const rad = toRad(-angle);
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
      angle,
    };
  };

  // 十二星座背景色調
  const signColors = [
    '#ef444422', '#10b98122', '#06b6d422', '#3b82f622',
    '#f59e0b22', '#10b98122', '#06b6d422', '#3b82f622',
    '#ef444422', '#10b98122', '#06b6d422', '#3b82f622',
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col items-center">
      {/* 標題與簡介 */}
      <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">西洋占星本命圓盤 (Natal Chart)</h3>
            <p className="text-xs text-slate-400">
              上升點 ASC：{data.ascendant.sign} {data.ascendant.degree.toFixed(1)}° ｜ 天頂 MC：{data.midheaven.sign}
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> 太陽：{data.sunSign}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> 月亮：{data.moonSign}
          </span>
        </div>
      </div>

      {/* SVG 占星圓盤主體 */}
      <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center my-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full select-none"
        >
          <defs>
            {/* 漸變與陰影效果 */}
            <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
            </radialGradient>
          </defs>

          {/* 外圈底圓 */}
          <circle cx={center} cy={center} r={outerRadius} fill="#0b0f19" stroke="#334155" strokeWidth="2" />
          <circle cx={center} cy={center} r={signRingInnerRadius} fill="none" stroke="#334155" strokeWidth="1" />
          <circle cx={center} cy={center} r={houseRingInnerRadius} fill="url(#centerGradient)" stroke="#475569" strokeWidth="1.5" />
          <circle cx={center} cy={center} r={aspectCenterRadius} fill="#090d16" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

          {/* 繪製十二星座 30° 扇形標籤 */}
          {ZODIAC_SIGNS.map((sign, idx) => {
            const startLon = idx * 30;
            const midLon = startLon + 15;
            const coords = getCoordinates(midLon, (outerRadius + signRingInnerRadius) / 2);
            const lineCoords = getCoordinates(startLon, outerRadius);
            const innerLineCoords = getCoordinates(startLon, signRingInnerRadius);

            return (
              <g key={sign.name}>
                {/* 星座區隔線 */}
                <line
                  x1={innerLineCoords.x}
                  y1={innerLineCoords.y}
                  x2={lineCoords.x}
                  y2={lineCoords.y}
                  stroke="#475569"
                  strokeWidth="1.5"
                />
                {/* 星座符號與名稱 */}
                <text
                  x={coords.x}
                  y={coords.y + 4}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="13"
                  fontWeight="bold"
                  className="transition-colors hover:fill-purple-300"
                >
                  {sign.symbol}
                </text>
              </g>
            );
          })}

          {/* 繪製 12 宮位放射線 */}
          {data.houses.map((house) => {
            const innerCoords = getCoordinates(house.longitude, aspectCenterRadius);
            const outerCoords = getCoordinates(house.longitude, houseRingInnerRadius);
            const numCoords = getCoordinates(house.longitude + 15, aspectCenterRadius + 16);

            const isKeyAxis = house.houseNumber === 1 || house.houseNumber === 7 || house.houseNumber === 10 || house.houseNumber === 4;

            return (
              <g key={`house-${house.houseNumber}`}>
                <line
                  x1={innerCoords.x}
                  y1={innerCoords.y}
                  x2={outerCoords.x}
                  y2={outerCoords.y}
                  stroke={isKeyAxis ? '#818cf8' : '#334155'}
                  strokeWidth={isKeyAxis ? '2' : '1'}
                  strokeDasharray={isKeyAxis ? undefined : '2 2'}
                />
                {/* 宮位數字 */}
                <text
                  x={numCoords.x}
                  y={numCoords.y + 3}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {house.houseNumber}
                </text>
              </g>
            );
          })}

          {/* 繪製行星間相位線 (Aspect Lines) */}
          {data.aspects.map((aspect, aIdx) => {
            const p1 = data.planets.find((p) => p.name === aspect.planet1);
            const p2 = data.planets.find((p) => p.name === aspect.planet2);
            if (!p1 || !p2) return null;

            const c1 = getCoordinates(p1.longitude, aspectCenterRadius - 5);
            const c2 = getCoordinates(p2.longitude, aspectCenterRadius - 5);

            // 相位顏色：合相(紫)、三分相(綠)、四分相(紅)、對分相(橘)、六分相(藍)
            let strokeColor = '#94a3b8';
            if (aspect.aspectType === 'conjunction') strokeColor = '#a855f7';
            if (aspect.aspectType === 'trine') strokeColor = '#10b981';
            if (aspect.aspectType === 'sextile') strokeColor = '#38bdf8';
            if (aspect.aspectType === 'square') strokeColor = '#ef4444';
            if (aspect.aspectType === 'opposition') strokeColor = '#f97316';

            return (
              <line
                key={`aspect-${aIdx}`}
                x1={c1.x}
                y1={c1.y}
                x2={c2.x}
                y2={c2.y}
                stroke={strokeColor}
                strokeWidth="1.2"
                strokeOpacity="0.45"
              />
            );
          })}

          {/* 繪製十大行星圖標與文字 */}
          {data.planets.map((planet) => {
            const coords = getCoordinates(planet.longitude, planetRingRadius);
            const isSelected = selectedPlanet?.name === planet.name;
            const meta = PLANET_META[planet.englishName] || { symbol: '★' };

            return (
              <g
                key={planet.name}
                className="cursor-pointer group"
                onClick={() => setSelectedPlanet(planet)}
              >
                {/* 行星背景圓點 */}
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? 13 : 10}
                  fill={isSelected ? '#8b5cf6' : '#1e293b'}
                  stroke={isSelected ? '#c084fc' : '#64748b'}
                  strokeWidth="1.5"
                  className="transition-all duration-200 group-hover:stroke-purple-400 group-hover:scale-110"
                />
                {/* 行星符號 */}
                <text
                  x={coords.x}
                  y={coords.y + 4}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#e2e8f0'}
                  fontSize={isSelected ? 12 : 10}
                  fontWeight="bold"
                >
                  {meta.symbol}
                </text>
              </g>
            );
          })}

          {/* 中心命主標籤 */}
          <circle cx={center} cy={center} r={28} fill="#0f172a" stroke="#475569" strokeWidth="1" />
          <text x={center} y={center - 3} textAnchor="middle" fill="#c084fc" fontSize="10" fontWeight="bold">
            ASC
          </text>
          <text x={center} y={center + 10} textAnchor="middle" fill="#94a3b8" fontSize="9">
            {data.ascendant.sign.slice(0, 2)}
          </text>
        </svg>
      </div>

      {/* 點擊行星或預設展示資訊 */}
      <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs">
        {selectedPlanet ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base text-purple-400 font-bold">
                {PLANET_META[selectedPlanet.englishName]?.symbol}
              </span>
              <div>
                <span className="font-bold text-white text-sm">{selectedPlanet.name}</span>
                <span className="text-slate-400 ml-2">
                  落入【{selectedPlanet.sign}】第 {selectedPlanet.house} 宮
                  {selectedPlanet.isRetrograde ? ' (逆行 Rx)' : ''}
                </span>
              </div>
            </div>
            <div className="font-mono text-purple-300">
              {selectedPlanet.degreeInSign}° {selectedPlanet.minuteInSign}&apos;
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-purple-400" />
              <span>點選星盤中任意行星，可檢視其落入星座、度數與宮位詳情</span>
            </div>
            <span className="font-mono text-slate-500">共 {data.aspects.length} 組相位</span>
          </div>
        )}
      </div>
    </div>
  );
}
