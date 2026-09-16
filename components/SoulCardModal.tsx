'use client';

/**
 * 9:16 IG 限時動態專屬靈魂圖卡彈窗組件 (SoulCardModal)
 * 核心升級：
 * 1. 分離預覽層與擷取層：擷取層置於隱藏位置保持標準 1080x1920；預覽層動態計算 CSS scale 等比縮放
 * 2. 徹底消除任何水平與垂直捲軸，一覽無遺展現整張卡片（上方標題、14 維度數值、心咒與版權宣告）
 * 3. 行動端優化：Modal 高度不超過 85dvh，卡片最高 65dvh，下載按鈕永遠在視窗內免滑動直接點擊
 * 4. 點擊下載調用 html-to-image 擷取原始節點，維持 1080x1920 超高清 PNG 輸出
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { FourteenDimensionsReport } from '@/types/fortune';
import {
  Sparkles,
  Download,
  X,
  ShieldCheck,
  Award,
  Heart,
  Briefcase,
  Compass,
  Gem,
  Flame,
  CheckCircle2,
  Calendar,
  Loader2,
} from 'lucide-react';

interface SoulCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: FourteenDimensionsReport;
  profileName: string;
  birthDate: string;
  birthTime: string;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dayMaster: string;
  mingMajorStar: string;
  destinyNumber: number;
}

interface CardContentProps {
  report: FourteenDimensionsReport;
  profileName: string;
  birthDate: string;
  birthTime: string;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dayMaster: string;
  mingMajorStar: string;
  destinyNumber: number;
}

/**
 * 專屬靈魂圖卡內容本體 (固定渲染為 1080x1920 精密排版)
 */
function SoulCardContent({
  report,
  profileName,
  birthDate,
  birthTime,
  sunSign,
  moonSign,
  risingSign,
  dayMaster,
  mingMajorStar,
  destinyNumber,
}: CardContentProps) {
  return (
    <div
      style={{ width: '1080px', height: '1920px' }}
      className="relative bg-gradient-to-b from-[#090b14] via-[#0f1224] to-[#06070d] text-white p-14 flex flex-col justify-between overflow-hidden shrink-0 select-none shadow-2xl"
    >
      {/* 神秘學背景裝飾光環與網格 */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#382bf015_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-40" />

      {/* 法定防偽版權浮水印斜向背景 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none rotate-[-30deg]">
        <span className="text-8xl font-black tracking-widest text-white whitespace-nowrap">
          宇沛實業股份有限公司・版權所有
        </span>
      </div>

      {/* 1. 卡片頂部：品牌標識與認證標章 */}
      <div className="relative z-10 flex items-center justify-between border-b border-purple-500/30 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-600/40 text-2xl font-black">
            Ω
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-purple-200 via-pink-200 to-amber-300 bg-clip-text text-transparent">
              Omni-Astrology 四合一命中全景
            </h2>
            <p className="text-base text-slate-400 font-medium tracking-wide">
              西洋占星 × 紫微斗數 × 八字四柱 × 生命靈數
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-xs font-semibold text-purple-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            官方算法認證・終身唯一契約
          </span>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            VERIFIED-ID: 93620650-UPAY
          </p>
        </div>
      </div>

      {/* 2. 命主核心檔案與靈魂代號 */}
      <div className="relative z-10 my-4 bg-slate-900/70 border border-slate-700/60 rounded-3xl p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm tracking-widest uppercase text-purple-400 font-semibold">
              SOUL PERSONA CARD
            </span>
            <h1 className="text-5xl font-black text-white mt-1">
              {profileName}
            </h1>
            <p className="text-lg text-slate-400 mt-2 font-mono flex items-center gap-3">
              <Calendar className="w-5 h-5 text-amber-400" />
              西元 {birthDate} {birthTime} 降生
            </p>
          </div>

          <div className="text-center bg-gradient-to-b from-purple-950/60 to-slate-950/90 border border-purple-500/50 rounded-2xl px-6 py-4 shadow-xl">
            <span className="text-xs font-bold text-amber-300 block">主修命運數</span>
            <span className="text-6xl font-black font-mono bg-gradient-to-r from-pink-300 to-amber-300 bg-clip-text text-transparent">
              {destinyNumber}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">畢達哥拉斯神聖幾何</span>
          </div>
        </div>

        {/* 四大體系核心參數標籤 */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-center">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">太陽星座</span>
            <span className="text-xl font-bold text-amber-300 mt-1 block">{sunSign}</span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">上升星座</span>
            <span className="text-xl font-bold text-indigo-300 mt-1 block">{risingSign}</span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">八字日主</span>
            <span className="text-xl font-bold text-emerald-300 mt-1 block">{dayMaster} 日主</span>
          </div>
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block">紫微命宮</span>
            <span className="text-xl font-bold text-purple-300 mt-1 block">{mingMajorStar} 星</span>
          </div>
        </div>
      </div>

      {/* 3. 14 維度靈魂精華陣列 */}
      <div className="relative z-10 grid grid-cols-2 gap-5 my-2">
        {/* I/E 人格與天性 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-purple-300 font-bold text-base mb-2">
            <Compass className="w-5 h-5 text-purple-400" />
            <span>I/E 人格能量維度</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-300">
              {report.personality_mbti.type} 型
            </span>
            <span className="text-sm text-slate-400">
              （外展指數 {report.personality_mbti.score}%）
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-3">
            {report.personality_mbti.explanation}
          </p>
        </div>

        {/* 命中正緣特徵與年齡 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-base mb-2">
            <Heart className="w-5 h-5 text-rose-400" />
            <span>命中正緣交會年齡</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-300">
              {report.destined_partner.meet_age} 歲
            </span>
            <span className="text-sm text-slate-400">
              （{report.destined_partner.marriage_timing === 'early' ? '順緣早至' : '大器正緣'}・
              {report.destined_partner.age_gap === 'older' ? '偏年長契合' : report.destined_partner.age_gap === 'younger' ? '偏年幼互補' : '同儕知己'}）
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed mt-2 line-clamp-3">
            伴侶特徵：{report.destined_partner.traits.join('、')}。
          </p>
        </div>

        {/* 財富來源模式 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-base mb-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>資產聚富格局</span>
          </div>
          <span className="text-2xl font-black text-amber-200">
            {report.wealth_origin === 'self_made'
              ? '白手起家・實力開拓型'
              : report.wealth_origin === 'inheritance'
              ? '祖業庇蔭・家族傳承型'
              : '雙軌共振・開源福祿型'}
          </span>
          <p className="text-xs text-slate-400 mt-2">
            核心天賦本業：{report.ideal_careers.primary.slice(0, 2).join('、')}
          </p>
        </div>

        {/* 離鄉背井發展 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-indigo-300 font-bold text-base mb-2">
            <Flame className="w-5 h-5 text-indigo-400" />
            <span>遠方驛馬與貴人</span>
          </div>
          <span className="text-2xl font-black text-indigo-200">
            {report.relocation_advice.recommendation === 'relocate'
              ? '跨國遷徙・動態越發'
              : '在地深耕・穩如磐石'}
          </span>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2">
            {report.relocation_advice.study_career_verdict}
          </p>
        </div>

        {/* 契合生肖與星座 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <span className="text-sm font-bold text-purple-300 block mb-1">
            天宮神煞天命配對
          </span>
          <p className="text-xs text-slate-300">
            契合星座：<strong className="text-purple-200">{report.zodiac_compatibility.best_signs.join(' / ')}</strong>
          </p>
          <p className="text-xs text-slate-300 mt-1">
            三合生肖：<strong className="text-amber-300">{report.zodiac_compatibility.best_zodiacs.join('、')}</strong>
          </p>
        </div>

        {/* 專屬開運水晶與食補 */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center gap-1.5 text-sm font-bold text-emerald-300 mb-1">
            <Gem className="w-4 h-4 text-emerald-400" />
            <span>共振能量開運物</span>
          </div>
          <p className="text-xs text-emerald-200 font-semibold line-clamp-1">
            {report.lucky_crystals.crystal_name}
          </p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
            開運食補：{report.lucky_food.foods.slice(0, 3).join('、')}、{report.lucky_food.fruits.slice(0, 2).join('、')}
          </p>
        </div>
      </div>

      {/* 4. 未來三年動態運勢曲線條 */}
      <div className="relative z-10 bg-slate-900/70 border border-slate-700/60 rounded-3xl p-7 my-2">
        <div className="flex items-center justify-between mb-4">
          <span className="text-base font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-400" />
            2026 ~ 2028 未來三年走勢能量指數
          </span>
          <span className="text-xs text-slate-400">大限流年推算</span>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {report.annual_forecast.next_3_years_curve.map((item) => (
            <div
              key={item.year}
              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center"
            >
              <span className="text-sm font-semibold text-slate-400 font-mono">
                {item.year} 年
              </span>
              <span className="text-3xl font-black text-amber-300 font-mono mt-1">
                {item.score}
              </span>
              <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. 每日正念賦能心咒 */}
      <div className="relative z-10 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-amber-950/40 border border-purple-500/40 rounded-3xl p-7 text-center my-2 shadow-lg">
        <p className="text-xs tracking-widest text-purple-300 uppercase font-semibold">
          MINDFULNESS MANTRA
        </p>
        <blockquote className="text-xl font-bold text-white leading-relaxed mt-2 px-4 italic">
          {report.annual_forecast.mindfulness_mantra}
        </blockquote>
      </div>

      {/* 6. 卡片底部：宇沛實業股份有限公司 法定版權浮水印與登記宣告 */}
      <div className="relative z-10 border-t border-slate-800/80 pt-6 mt-2 flex flex-col gap-2 text-slate-400 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600/30 border border-purple-500/50 flex items-center justify-center font-bold text-white text-xs">
              宇沛
            </div>
            <div>
              <p className="font-bold text-slate-200 text-sm">
                宇沛實業股份有限公司 (UPAY Medical Technology Corp.)
              </p>
              <p className="text-[11px] text-slate-400">
                統一編號：93620650 | 地址：台北市松山區敦化北路207號9樓之6
              </p>
            </div>
          </div>

          <div className="text-right text-[11px]">
            <p className="text-slate-300">電話：0911-027-688</p>
            <p className="text-slate-400">Email: opelwu2002@gmail.com</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800/50 pt-2">
          <span>© 2026 Omni-Astrology 中西命理科研平台. All Rights Reserved.</span>
          <span>本圖卡依據真太陽時天文幾何及紫微八字精密演算生成</span>
        </div>
      </div>
    </div>
  );
}

export default function SoulCardModal({
  isOpen,
  onClose,
  report,
  profileName,
  birthDate,
  birthTime,
  sunSign,
  moonSign,
  risingSign,
  dayMaster,
  mingMajorStar,
  destinyNumber,
}: SoulCardModalProps) {
  const exportCardRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [scale, setScale] = useState<number>(0.28);

  const cardProps: CardContentProps = {
    report,
    profileName,
    birthDate,
    birthTime,
    sunSign,
    moonSign,
    risingSign,
    dayMaster,
    mingMajorStar,
    destinyNumber,
  };

  // 動態精準計算 scale，確保整張卡片等比完整容納於預覽區，絕無任何捲軸
  const updateScale = useCallback(() => {
    if (!previewContainerRef.current) return;
    const container = previewContainerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // 手機端視窗高度限制防護 (最長不超過 65dvh)
    const vh65 = typeof window !== 'undefined' ? window.innerHeight * 0.65 : 600;
    const effectiveMaxHeight = Math.min(containerHeight, vh65);

    // 依據 1080x1920 (9:16) 寬高比例計算
    const scaleY = effectiveMaxHeight / 1920;
    const scaleX = (containerWidth - 16) / 1080;

    // 採較小值以保證等比完整容納，並留 2% 安全邊距
    const computed = Math.min(scaleX, scaleY) * 0.98;

    if (computed > 0.05 && computed < 1) {
      setScale(computed);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // 初始計算
    updateScale();
    const timer = setTimeout(updateScale, 60);

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    if (previewContainerRef.current) {
      observer.observe(previewContainerRef.current);
    }

    window.addEventListener('resize', updateScale);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen, updateScale]);

  if (!isOpen) return null;

  // 調用 html-to-image 針對隱藏層無縮放原生 1080x1920 節點生成高清 PNG
  const handleDownloadImage = async () => {
    if (!exportCardRef.current) return;
    setIsExporting(true);

    try {
      const dataUrl = await toPng(exportCardRef.current, {
        quality: 0.98,
        pixelRatio: 2, // 2倍高解析度抗鋸齒，導出品質超凡
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.download = `${profileName}_專屬靈魂天賦圖卡_1080x1920.png`;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 2500);
    } catch (err) {
      console.error('導出靈魂圖卡失敗:', err);
      alert('圖卡生成過程中發生錯誤，請稍候再試。');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-hidden">
      {/* 獨立隱藏擷取層 (置於螢幕外，維持純粹 1080x1920 節點專供導出高清 PNG) */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none z-[-100] opacity-100">
        <div ref={exportCardRef}>
          <SoulCardContent {...cardProps} />
        </div>
      </div>

      {/* Modal 本體：高度嚴格限制在 85dvh 內，防止手機瀏覽器上下工具列遮擋 */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 sm:p-4 my-auto text-slate-100 flex flex-col max-h-[85dvh] overflow-hidden">
        {/* 彈窗頂部工具列 (固定不縮放) */}
        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">9:16 IG 限動專屬靈魂圖卡</h3>
              <p className="text-[10px] text-slate-400">1080 × 1920 高解析度社群圖卡（免滾動即時預覽）</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 預覽容器：完全 overflow-hidden，移除所有垂直與水平捲軸，卡片最高 65dvh */}
        <div
          ref={previewContainerRef}
          className="flex-1 min-h-0 flex items-center justify-center overflow-hidden py-1 w-full"
        >
          {/* 縮放外框：寬高依據 scale 精確設定，卡片等比縮小完整容納 */}
          <div
            style={{
              width: `${1080 * scale}px`,
              height: `${1920 * scale}px`,
              maxHeight: '65dvh',
            }}
            className="relative overflow-hidden rounded-xl shadow-2xl border border-purple-500/40 shrink-0 select-none bg-[#090b14]"
          >
            {/* 內部卡片：套用 CSS scale 與 top left 基準點 */}
            <div
              style={{
                width: '1080px',
                height: '1920px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              className="pointer-events-none"
            >
              <SoulCardContent {...cardProps} />
            </div>
          </div>
        </div>

        {/* 底部功能按鈕列 (固定不滾動，在任何手機螢幕上永遠可見直接點擊) */}
        <div className="pt-2.5 mt-2 border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <p className="text-[11px] text-slate-400 text-center sm:text-left">
            已等比縮放預覽，下載檔案精準為 <span className="text-purple-300 font-bold">1080 × 1920 (9:16)</span> 高清 PNG。
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition cursor-pointer"
            >
              關閉
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>渲染生成中...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>已成功下載！</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>下載專屬靈魂圖卡 (PNG)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
