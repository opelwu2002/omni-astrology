'use client';

/**
 * 商業化高階四合一命盤深層解析報告組件 (InterpretationView)
 * 包含：
 * 1. 維度一：核心命理特質與深度自我認知 (Level 1 免費)
 * 2. 維度二：三大核心人生課題 (Level 2 初階解鎖 NT$199)
 * 3. 維度三：未來 1-3 年動態時間線 (Level 3 高階解鎖 NT$699)
 * 4. 維度四：落地行動指南與心理處方 (Level 3 高階解鎖 NT$699)
 * 5. 漏斗式毛玻璃付費牆遮罩與收銀台模擬金流
 */
import React, { useState, useEffect, useCallback } from 'react';
import { InterpretationReport } from '@/types/astrology';
import CheckoutModal from '@/components/payment/CheckoutModal';
import SanctuaryDrawer from '@/components/SanctuaryDrawer';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import {
  Sparkles,
  Briefcase,
  Heart,
  Compass,
  RefreshCw,
  Award,
  Quote,
  ShieldAlert,
  AlertTriangle,
  Flame,
  Copy,
  Check,
  Zap,
  Lock,
  Calendar,
  Gift,
  Smile,
  Activity,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  DollarSign,
  BookOpen,
  Sun,
  ShieldCheck,
  Bookmark,
  Moon,
} from 'lucide-react';

interface Props {
  profileName: string;
  destinyNumber: number;
  sunSign: string;
  moonSign: string;
  risingSign: string;
  dayMaster: string;
  mingMajorStar: string;
}

export default function InterpretationView({
  profileName,
  destinyNumber,
  sunSign,
  moonSign,
  risingSign,
  dayMaster,
  mingMajorStar,
}: Props) {
  const [report, setReport] = useState<InterpretationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'dim1' | 'dim2' | 'dim3' | 'dim4' | 'survival'
  >('dim1');
  const [copiedQuote, setCopiedQuote] = useState(false);
  const [isSanctuaryDrawerOpen, setIsSanctuaryDrawerOpen] = useState(false);

  // 維度三與維度四互動狀態
  const [selectedDossierYear, setSelectedDossierYear] = useState<number>(2026);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    theme: true,
    career: true,
    wealth: true,
    love: true,
    season: true,
  });
  const [dim4SubTab, setDim4SubTab] = useState<'manifest' | 'eastern' | 'western'>('manifest');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);

  // 付費解鎖狀態管理 (儲存於 localStorage 以保持會話持久)
  const [unlockedTiers, setUnlockedTiers] = useState<string[]>(['free']);
  const [checkoutModalProps, setCheckoutModalProps] = useState<{
    isOpen: boolean;
    tier: 'level2' | 'level3' | 'synastry_addon';
    tierName: string;
    price: number;
    originalPrice: number;
    features: string[];
  }>({
    isOpen: false,
    tier: 'level2',
    tierName: '',
    price: 199,
    originalPrice: 599,
    features: [],
  });

  // 載入本地已解鎖狀態與開運待辦打勾狀態
  useEffect(() => {
    try {
      const saved = localStorage.getItem('omni_unlocked_tiers');
      if (saved) {
        setUnlockedTiers(JSON.parse(saved));
      }
      const savedTasks = localStorage.getItem('omni_dim4_completed_tasks');
      if (savedTasks) {
        setCompletedTasks(JSON.parse(savedTasks));
      }
    } catch {
      // 容錯
    }
  }, []);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => {
      const next = prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId];
      try {
        localStorage.setItem('omni_dim4_completed_tasks', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const toggleSection = (sectionKey: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const fetchInterpretation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileName,
          destinyNumber,
          sunSign,
          moonSign,
          risingSign,
          dayMaster,
          mingMajorStar,
        }),
      });

      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('解盤 API 呼叫失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [profileName, destinyNumber, sunSign, moonSign, risingSign, dayMaster, mingMajorStar]);

  useEffect(() => {
    fetchInterpretation();
  }, [fetchInterpretation]);

  const handleCopyQuote = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  // 開啟結帳對話框
  const handleOpenPaywall = (tier: 'level2' | 'level3') => {
    if (tier === 'level2') {
      setCheckoutModalProps({
        isOpen: true,
        tier: 'level2',
        tierName: '初階人生痛點解鎖報告（事業財富・情感健康）',
        price: 199,
        originalPrice: 599,
        features: [
          '適合之創業/副業模式與財富漏洞陷阱',
          '命中正緣特徵與相處長久保鮮法則',
          '心理核心壓力源與經絡疲勞調養處方',
          '宇沛實業官方演算法終身無限次閱讀',
        ],
      });
    } else {
      setCheckoutModalProps({
        isOpen: true,
        tier: 'level3',
        tierName: '高階終身全盤與未來三年流年時間線',
        price: 699,
        originalPrice: 1999,
        features: [
          '包含 Level 2 全部事業、情感與身心解鎖',
          '2026~2028 未來 1-3 年動態流年運勢數值曲線',
          '關鍵衝刺月、保守月與潛在危機避凶行動清單',
          '每日顯化心法、客製幸運物與樹洞心靈處方箋',
        ],
      });
    }
  };

  // 成功解鎖回調
  const handlePaymentSuccess = (tier: string) => {
    const updated = [...unlockedTiers, tier];
    if (tier === 'level3') {
      updated.push('level2'); // 解鎖 level3 自動解鎖 level2
    }
    const unique = Array.from(new Set(updated));
    setUnlockedTiers(unique);
    localStorage.setItem('omni_unlocked_tiers', JSON.stringify(unique));
  };

  const isLevel2Unlocked = unlockedTiers.includes('level2') || unlockedTiers.includes('level3');
  const isLevel3Unlocked = unlockedTiers.includes('level3');

  return (
    <div className="bg-slate-900/95 border border-purple-500/30 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
      {/* 模擬結帳收銀台 */}
      <CheckoutModal
        isOpen={checkoutModalProps.isOpen}
        tier={checkoutModalProps.tier}
        tierName={checkoutModalProps.tierName}
        price={checkoutModalProps.price}
        originalPrice={checkoutModalProps.originalPrice}
        features={checkoutModalProps.features}
        onClose={() => setCheckoutModalProps((prev) => ({ ...prev, isOpen: false }))}
        onSuccess={handlePaymentSuccess}
      />

      {/* 跨宗教心靈神聖處方箋抽屜 */}
      <SanctuaryDrawer
        isOpen={isSanctuaryDrawerOpen}
        onClose={() => setIsSanctuaryDrawerOpen(false)}
        profileName={profileName}
        sanctuary={(report as any)?.sanctuary}
        mindfulnessMantra={report?.dimension4_actionPrescription?.dailyMeditationManifest}
      />

      {/* 官方免責聲明條款彈窗 */}
      <LegalDisclaimerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      {/* 法律免責聲明第二層防護：顯著警語 Warning Badge */}
      <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-300/95 shadow-inner">
        <div className="flex items-start sm:items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong className="text-amber-200">宇沛實業法律警語：</strong>本深層解析報告融合古典民俗統計與心理原型探索，僅供個人心靈沉澱、性格自我認知與生活休閒研究之用，不具備任何醫療診斷、法律諮詢或重大財務投資保證之效力。
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowLegalModal(true)}
          className="shrink-0 inline-flex items-center text-amber-300 hover:text-amber-100 underline decoration-amber-400/50 hover:decoration-amber-200 transition-colors font-medium cursor-pointer self-end sm:self-auto text-[11px]"
        >
          完整服務條款與免責聲明 →
        </button>
      </div>

      {/* 標題列 */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white shadow-lg shadow-purple-600/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-wide">
                全維度四合一命盤商業級深層報告
              </h3>
              {isLevel3Unlocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  ✓ 已解鎖尊榮全盤
                </span>
              ) : isLevel2Unlocked ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                  ✓ 已解鎖初階報告
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  免費體驗版
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              融合心理學共鳴、現代職場痛點、情場避雷針與未來 1-3 年動態流年曲線
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInterpretation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-medium rounded-lg border border-purple-500/20 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? '正在聚合解析...' : '重新生成報告'}</span>
        </button>
      </div>

      {/* 靈魂白話人設橫幅 */}
      {report?.soulPersona && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-pink-950/70 border border-purple-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-purple-300 font-semibold block">
                靈魂白話人設 (Soul Persona)
              </span>
              <span className="text-sm sm:text-base font-black text-white tracking-wide">
                {report.soulPersona}
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 text-pink-300 border border-pink-500/30">
            四合一高維印證
          </span>
        </div>
      )}

      {/* 四大核心維度 Tab 切換 */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'dim1' as const, label: '維度一：自我認知與能量指標', icon: Sparkles, tag: '免費' },
          { id: 'dim2' as const, label: '維度二：三大人生課題痛點解方', icon: Briefcase, tag: isLevel2Unlocked ? '已解鎖' : 'NT$199' },
          { id: 'dim3' as const, label: '維度三：未來1-3年流年時間線', icon: Calendar, tag: isLevel3Unlocked ? '已解鎖' : 'NT$699' },
          { id: 'dim4' as const, label: '維度四：落地行動與心理處方', icon: Smile, tag: isLevel3Unlocked ? '已解鎖' : 'NT$699' },
          { id: 'survival' as const, label: '⚡ 職場金句與情場避雷針', icon: Zap, tag: '實戰' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                  : 'bg-slate-950/70 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                {tab.tag}
              </span>
            </button>
          );
        })}
      </div>

      {/* 內容展示區 */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400 mb-3" />
          <p className="text-sm font-medium">正在聚合商業四維解析與流年時間線...</p>
        </div>
      ) : !report ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          暫無解析內容，請點擊上方按鈕重新生成。
        </div>
      ) : (
        <div className="space-y-5 text-slate-200 text-sm leading-relaxed">
          {/* ================= 維度一：核心命理特質與深度自我認知 ================= */}
          {activeTab === 'dim1' && (
            <div className="space-y-5 animate-fade-in">
              {/* 外顯面具 vs 內在渴求 */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <h4 className="font-bold text-white mb-2 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>天賦與隱憂：外在表現與內在自我的真實拉扯</span>
                </h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {report.dimension1_selfAwareness?.outerVsInnerConflict}
                </p>
              </div>

              {/* 四維能量強弱指標 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-950 border border-indigo-500/30">
                <h4 className="font-bold text-indigo-300 mb-3 text-xs flex items-center gap-2 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <span>四維核心能量雷達指標評估</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {[
                    { label: '溝通影響力', score: report.dimension1_selfAwareness?.fourDimensionalEnergy.communication || 85, color: 'bg-indigo-500' },
                    { label: '執行落地力', score: report.dimension1_selfAwareness?.fourDimensionalEnergy.execution || 88, color: 'bg-emerald-500' },
                    { label: '創新突破力', score: report.dimension1_selfAwareness?.fourDimensionalEnergy.creativity || 90, color: 'bg-purple-500' },
                    { label: '抗壓耐受力', score: report.dimension1_selfAwareness?.fourDimensionalEnergy.resilience || 84, color: 'bg-amber-500' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-slate-300 font-semibold">{item.label}</span>
                        <span className="font-mono font-bold text-white">{item.score} 分</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div style={{ width: `${item.score}%` }} className={`h-full ${item.color}`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 人生終極天命使命 */}
              <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                <h4 className="font-bold text-purple-300 mb-2 text-xs flex items-center gap-2 uppercase tracking-wider">
                  <Compass className="w-4 h-4 text-purple-400" />
                  <span>人生終極天命使命 (Soul Mission)</span>
                </h4>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                  {report.dimension1_selfAwareness?.soulMission}
                </p>
              </div>

              {/* 跨宗教心靈神聖處方箋入口 */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsSanctuaryDrawerOpen(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/50 flex flex-wrap items-center justify-center gap-2 transition cursor-pointer group"
                >
                  <span>🕊️ 領取專屬心靈解方與跨宗教平安指南 ➜</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/40">
                    佛・道・基督・象神四面佛・72h止血清單
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ================= 維度二：精準痛點解方：三大人生課題 ================= */}
          {activeTab === 'dim2' && (
            <div className="relative">
              {!isLevel2Unlocked ? (
                /* 付費牆遮罩 */
                <div className="relative rounded-2xl border border-purple-500/30 overflow-hidden">
                  {/* 假模糊背景 */}
                  <div className="filter blur-md opacity-40 p-6 space-y-4 select-none pointer-events-none">
                    <div className="h-6 w-1/3 bg-slate-700 rounded" />
                    <div className="h-20 bg-slate-800 rounded" />
                    <div className="h-6 w-1/4 bg-slate-700 rounded" />
                    <div className="h-28 bg-slate-800 rounded" />
                  </div>

                  {/* 覆蓋的購買卡片 */}
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center mb-3 shadow-lg shadow-purple-600/40">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
                      Level 2 專屬高轉換報告
                    </span>
                    <h4 className="text-xl font-black text-white mb-2">
                      解鎖三大核心人生課題與財富密碼
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
                      徹底透析最適合您的創業副業模式、重大財政漏洞陷阱、命中正緣時機以及身心能量疲勞區調養處方。
                    </p>

                    <button
                      type="button"
                      onClick={() => handleOpenPaywall('level2')}
                      className="py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl shadow-xl shadow-purple-900/50 text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>限時超值解鎖・特惠 NT$ 199 元</span>
                    </button>
                    <span className="text-[11px] text-slate-500 mt-2">
                      終身解鎖・宇沛實業官方金流保證
                    </span>
                  </div>
                </div>
              ) : (
                /* 已解鎖內容 */
                <div className="space-y-4 animate-fade-in">
                  {/* 事業與財富 */}
                  <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                    <h4 className="font-bold text-indigo-300 text-sm flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-400" />
                      <span>事業與財富：模式、漏財陷阱與黃金突破期</span>
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {report.dimension2_lifeProblems?.careerWealth.startupModel}
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {report.dimension2_lifeProblems?.careerWealth.moneyLeakage}
                    </p>
                    <div className="p-3 bg-indigo-950/60 rounded-xl border border-indigo-500/40 text-xs text-indigo-200 font-semibold">
                      {report.dimension2_lifeProblems?.careerWealth.goldenBreakthroughPeriod}
                    </div>
                  </div>

                  {/* 情感與人際 */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                    <h4 className="font-bold text-rose-300 text-sm flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-400" />
                      <span>情感與人際：正緣時機與致命相處盲點</span>
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {report.dimension2_lifeProblems?.loveRelationship.soulmateTraits}
                    </p>
                    <div className="space-y-1.5">
                      {report.dimension2_lifeProblems?.loveRelationship.fatalBlindspots.map((b, i) => (
                        <div key={i} className="p-2.5 bg-rose-950/40 rounded-lg text-xs text-rose-200">
                          {b}
                        </div>
                      ))}
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed pt-1">
                      {report.dimension2_lifeProblems?.loveRelationship.harmonyKey}
                    </p>
                  </div>

                  {/* 健康與隱性危機 */}
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-400" />
                      <span>身心健康與能量疲勞調養處方</span>
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {report.dimension2_lifeProblems?.healthVitality.psychologicalStressSource}
                    </p>
                    <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-line">
                      {report.dimension2_lifeProblems?.healthVitality.energyFatigueArea}
                    </p>
                    <div className="p-3 bg-amber-950/50 rounded-xl border border-amber-500/30 text-xs text-amber-200 whitespace-pre-line">
                      🌿 <strong>日常調養：</strong> {report.dimension2_lifeProblems?.healthVitality.wellnessRx}
                    </div>
                  </div>

                  {/* 跨宗教心靈神聖處方箋入口 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSanctuaryDrawerOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/50 flex flex-wrap items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <span>🕊️ 領取專屬心靈解方與跨宗教平安指南 ➜</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/40">
                        佛・道・基督・象神四面佛・72h止血清單
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 維度三：動態時間線：未來運勢與關鍵時機 ================= */}
          {activeTab === 'dim3' && (
            <div className="relative">
              {!isLevel3Unlocked ? (
                /* 付費牆遮罩 */
                <div className="relative rounded-2xl border border-purple-500/30 overflow-hidden">
                  <div className="filter blur-md opacity-40 p-6 space-y-4 select-none pointer-events-none">
                    <div className="h-6 w-1/3 bg-slate-700 rounded" />
                    <div className="h-32 bg-slate-800 rounded" />
                    <div className="h-24 bg-slate-800 rounded" />
                  </div>

                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 text-white flex items-center justify-center mb-3 shadow-lg">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-1">
                      Level 3 終極旗艦報告
                    </span>
                    <h4 className="text-xl font-black text-white mb-2">
                      未來 1-3 年流年動態運勢曲線與時機點
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
                      提前預知 2026~2028 運勢起伏、衝刺黃金月、低調避坑月與重大轉機防禦錦囊。
                    </p>

                    <button
                      type="button"
                      onClick={() => handleOpenPaywall('level3')}
                      className="py-3 px-6 bg-gradient-to-r from-amber-600 via-pink-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-xl text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>限時優惠解鎖・NT$ 699 元</span>
                    </button>
                    <span className="text-[11px] text-slate-500 mt-2">
                      包含 Level 2 全部內容＋未來三年流年＋落地心理處方
                    </span>
                  </div>
                </div>
              ) : (
                /* 已解鎖三年流年曲線與年度戰略白皮書 */
                <div className="space-y-5 animate-fade-in">
                  {/* 三年概覽卡條 */}
                  <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span>2026 ~ 2028 未來三年流年運勢動態指數曲線</span>
                      </h4>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-500/30">
                        點擊下方年份切換【個人年度戰略白皮書】
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {report.dimension3_futureTimeline?.yearlyCurves.map((curve) => (
                        <button
                          key={curve.year}
                          type="button"
                          onClick={() => setSelectedDossierYear(curve.year)}
                          className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                            selectedDossierYear === curve.year
                              ? 'bg-purple-950/50 border-purple-500 ring-1 ring-purple-500'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-baseline mb-1">
                            <span className="text-lg font-black text-white font-mono">{curve.year}年</span>
                            <span className="text-sm font-bold text-amber-300 font-mono">{curve.score} 分</span>
                          </div>
                          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-slate-950 text-purple-300 border border-purple-500/30 font-semibold mb-2">
                            {curve.trend}
                          </span>
                          <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800">
                            <div>🚀 <strong>衝刺：</strong>{curve.peakMonths}</div>
                            <div>🛡️ <strong>保守：</strong>{curve.cautionMonths}</div>
                            <p className="text-slate-300 pt-1 leading-relaxed line-clamp-2">{curve.advice}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 年度專屬戰略白皮書 (Yearly Strategic Dossier) */}
                  {(() => {
                    const currentDossier =
                      report.dimension3_futureTimeline?.yearlyDossiers?.find(
                        (d) => d.year === selectedDossierYear
                      ) || report.dimension3_futureTimeline?.yearlyDossiers?.[0];

                    if (!currentDossier) return null;

                    return (
                      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 border border-purple-500/40 space-y-4">
                        {/* Dossier 頂部年份切換 Header */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div>
                            <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                              <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                              高階個人年度戰略白皮書（單年 1,000+ 字深度導航）
                            </span>
                            <h4 className="text-lg sm:text-xl font-black text-white mt-1">
                              {currentDossier.yearGanZhi}
                            </h4>
                          </div>

                          <div className="flex gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                            {[2026, 2027, 2028].map((y) => (
                              <button
                                key={y}
                                type="button"
                                onClick={() => setSelectedDossierYear(y)}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                                  selectedDossierYear === y
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                {y}年
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 1. 年度天時大勢與能量基調 */}
                        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleSection('theme')}
                            className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-purple-300"
                          >
                            <span className="flex items-center gap-2">
                              <Sun className="w-4 h-4 text-purple-400" />
                              【年度天時大勢與能量基調】（紫微四化・八字干支・外行星換位）
                            </span>
                            {expandedSections.theme ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedSections.theme && (
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line pt-2 border-t border-slate-800/80">
                              {currentDossier.astrologicalTheme}
                            </p>
                          )}
                        </div>

                        {/* 2. 事業開拓與職場權力戰略 */}
                        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleSection('career')}
                            className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-indigo-300"
                          >
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-indigo-400" />
                              【事業開拓與職場權力戰略】（進攻時機點・合同雷區與小人防範）
                            </span>
                            {expandedSections.career ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedSections.career && (
                            <div className="space-y-3 pt-2 border-t border-indigo-950/80 text-xs sm:text-sm">
                              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed">
                                {currentDossier.careerStrategy.opportunityAndTiming}
                              </div>
                              <div className="p-3 bg-rose-950/30 rounded-lg border border-rose-500/30 text-rose-200 whitespace-pre-line leading-relaxed">
                                {currentDossier.careerStrategy.pitfallAndVillains}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 3. 財富流向與投資紅線 */}
                        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleSection('wealth')}
                            className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-amber-300"
                          >
                            <span className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-amber-400" />
                              【財富流向與投資紅線】（正偏財爆發點・嚴禁投資項目・推薦資產）
                            </span>
                            {expandedSections.wealth ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedSections.wealth && (
                            <div className="space-y-3 pt-2 border-t border-amber-950/80 text-xs sm:text-sm">
                              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-amber-200 whitespace-pre-line leading-relaxed">
                                💰 <strong>正偏財爆發：</strong>{currentDossier.wealthFlow.wealthExplosionPoint}
                              </div>
                              <div className="p-3 bg-rose-950/40 rounded-lg border border-rose-500/40 text-rose-200 whitespace-pre-line leading-relaxed">
                                🛑 <strong>絕對不可碰的投資紅線：</strong>{currentDossier.wealthFlow.prohibitedInvestments}
                              </div>
                              <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-500/40 text-emerald-200 whitespace-pre-line leading-relaxed">
                                💎 <strong>最適合佈局的資產類別：</strong>{currentDossier.wealthFlow.recommendedAssets}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. 情感婚姻與人際和合 */}
                        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleSection('love')}
                            className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-rose-300"
                          >
                            <span className="flex items-center gap-2">
                              <Heart className="w-4 h-4 text-rose-400" />
                              【情感婚姻與人際和合】（單身桃花高峰・伴侶價值觀盲區化解）
                            </span>
                            {expandedSections.love ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedSections.love && (
                            <div className="space-y-3 pt-2 border-t border-rose-950/80 text-xs sm:text-sm">
                              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-rose-200 whitespace-pre-line leading-relaxed">
                                {currentDossier.relationshipHarmony.singleRomance}
                              </div>
                              <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-slate-200 whitespace-pre-line leading-relaxed">
                                {currentDossier.relationshipHarmony.partneredAdvice}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 5. 四季作戰月曆（Q1 ~ Q4） */}
                        <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                          <button
                            type="button"
                            onClick={() => toggleSection('season')}
                            className="w-full flex items-center justify-between text-left text-xs sm:text-sm font-bold text-purple-300"
                          >
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-purple-400" />
                              【四季作戰月曆】（Q1 衝刺・Q2 沉潛・Q3 突破・Q4 結算）
                            </span>
                            {expandedSections.season ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          {expandedSections.season && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-purple-950/80 text-xs">
                              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                                {currentDossier.seasonalCalendar.q1}
                              </div>
                              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                                {currentDossier.seasonalCalendar.q2}
                              </div>
                              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                                {currentDossier.seasonalCalendar.q3}
                              </div>
                              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-300 leading-relaxed">
                                {currentDossier.seasonalCalendar.q4}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 危機預警與避凶趨吉清單 */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2.5">
                    <h4 className="font-bold text-rose-300 text-xs flex items-center gap-2 uppercase tracking-wider">
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>關鍵危機預警與避凶趨吉清單</span>
                    </h4>
                    {report.dimension3_futureTimeline?.crisisWarningAndRemedy.map((c, idx) => (
                      <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                        <span className="text-rose-300 font-semibold block">⚠️ 預警：{c.warning}</span>
                        <span className="text-emerald-300 block">💡 破局策略：{c.actionStep}</span>
                      </div>
                    ))}
                  </div>

                  {/* 跨宗教心靈神聖處方箋入口 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSanctuaryDrawerOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/50 flex flex-wrap items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <span>🕊️ 領取專屬心靈解方與跨宗教平安指南 ➜</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/40">
                        佛・道・基督・象神四面佛・72h止血清單
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 維度四：落地行動指南與專屬心理處方 ================= */}
          {activeTab === 'dim4' && (
            <div className="relative">
              {!isLevel3Unlocked ? (
                <div className="relative rounded-2xl border border-purple-500/30 overflow-hidden p-8 text-center bg-slate-950/80 backdrop-blur-sm">
                  <Lock className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <h4 className="text-lg font-bold text-white mb-1">
                    解鎖專屬心理處方與樹洞心靈指引
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    包含量子顯化冥想法、專屬轉運飾物色彩與撫慰人心的結語。
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenPaywall('level3')}
                    className="py-2.5 px-5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>升級解鎖 Level 3 旗艦方案</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-5 animate-fade-in">
                  {/* 維度四三大信仰與量子顯化子標籤切換 */}
                  <div className="flex flex-wrap gap-2 p-1.5 bg-slate-950/90 rounded-2xl border border-purple-500/30">
                    {[
                      { id: 'manifest' as const, label: '⚛️ 現代量子顯化心法', desc: '3-6-9 特斯拉・SATS 預演・錢母校準' },
                      { id: 'eastern' as const, label: '🪷 東方佛道寄託與轉運', desc: '漢傳本尊心咒・宮廟祈福・空間除穢' },
                      { id: 'western' as const, label: '🕊️ 西方靈修與東南亞護持', desc: '聖經詩篇・大天使祈請・象神四面佛' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setDim4SubTab(st.id)}
                        className={`flex-1 min-w-[200px] p-3 rounded-xl text-left transition cursor-pointer ${
                          dim4SubTab === st.id
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                            : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <span className="block text-xs sm:text-sm font-black">{st.label}</span>
                        <span className="block text-[11px] opacity-80 mt-0.5">{st.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* 子標籤 1：現代量子顯化心法 */}
                  {dim4SubTab === 'manifest' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* 3-6-9 特斯拉法 */}
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/40 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider block">
                              Tesla 3-6-9 Manifestation
                            </span>
                            <h5 className="text-sm sm:text-base font-bold text-white">
                              3-6-9 特斯拉書寫顯化法（命盤專屬調校）
                            </h5>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-900/90 rounded-xl border border-purple-500/30 text-amber-200 font-serif text-sm sm:text-base font-bold text-center leading-relaxed">
                          {report.dimension4_actionPrescription?.quantumManifestation?.teslaMethod369.affirmation}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-3.5 bg-slate-900/60 rounded-xl border border-slate-800">
                          {report.dimension4_actionPrescription?.quantumManifestation?.teslaMethod369.practiceSOP}
                        </p>
                      </div>

                      {/* SATS 睡前預演法 */}
                      <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2.5">
                        <h5 className="text-xs sm:text-sm font-bold text-indigo-300 flex items-center gap-2">
                          <Moon className="w-4 h-4 text-indigo-400" />
                          <span>SATS 睡前 Theta 腦波預演法（Neville Goddard 靈性心法）</span>
                        </h5>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                          {report.dimension4_actionPrescription?.quantumManifestation?.satsTechnique.guide}
                        </p>
                      </div>

                      {/* 錢母與金錢磁場校準 */}
                      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                        <h5 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-amber-400" />
                          <span>八字喜用神聚財錢母與金錢磁場校準</span>
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                            <span className="font-bold text-amber-300 block">💰 錢母製作與錢包除煞：</span>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                              {report.dimension4_actionPrescription?.quantumManifestation?.wealthAttunement.walletPurification}
                            </p>
                          </div>
                          <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                            <span className="font-bold text-emerald-300 block">⚡ 啟動金錢豐盛高頻率：</span>
                            <p className="text-slate-300 leading-relaxed whitespace-pre-line">
                              {report.dimension4_actionPrescription?.quantumManifestation?.wealthAttunement.frequencyBoost}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 子標籤 2：東方佛道寄託與轉運秘法 */}
                  {dim4SubTab === 'eastern' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* 漢傳佛教解厄安魂 */}
                      <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] text-amber-300 font-semibold block uppercase">
                              Buddhist Sanctuary & Wisdom
                            </span>
                            <h5 className="text-sm sm:text-base font-bold text-white">
                              漢傳佛教解厄安魂・專屬真言與抄經心法
                            </h5>
                          </div>
                        </div>
                        <div className="p-3 bg-purple-950/50 rounded-lg border border-purple-500/30 text-xs text-purple-200">
                          🪷 <strong>相應本尊：</strong>{report.dimension4_actionPrescription?.easternWisdom?.buddhismSoulCalm.deity}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                          {report.dimension4_actionPrescription?.easternWisdom?.buddhismSoulCalm.mantraAndSutra}
                        </p>
                      </div>

                      {/* 道教宮廟祈福與空間除穢 */}
                      <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                        <h5 className="text-xs sm:text-sm font-bold text-rose-300 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-rose-400" />
                          <span>道教宮廟祈福守護大神與民間除穢轉運秘法</span>
                        </h5>
                        <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-amber-300">
                          🛡️ <strong>守護大神推薦：</strong>{report.dimension4_actionPrescription?.easternWisdom?.taoismProtection.deities}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line p-3.5 bg-slate-900/70 rounded-xl border border-slate-800">
                          {report.dimension4_actionPrescription?.easternWisdom?.taoismProtection.negativeCleansingRitual}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 子標籤 3：西方靈修與東南亞神聖護持 */}
                  {dim4SubTab === 'western' && (
                    <div className="space-y-4 animate-fade-in">
                      {/* 基督天主教聖經與大天使 */}
                      <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-3">
                        <h5 className="text-xs sm:text-sm font-bold text-indigo-300 flex items-center gap-2">
                          <Sun className="w-4 h-4 text-indigo-400" />
                          <span>天主教與基督教心靈撫慰（聖經詩篇與大天使護持）</span>
                        </h5>
                        <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed italic">
                          {report.dimension4_actionPrescription?.westernAndSouthEast?.christianDevotion.psalmsContemplation}
                        </div>
                        <div className="p-3.5 bg-indigo-950/50 rounded-xl border border-indigo-500/30 text-xs sm:text-sm text-indigo-200 whitespace-pre-line leading-relaxed">
                          {report.dimension4_actionPrescription?.westernAndSouthEast?.christianDevotion.archangelInvocation}
                        </div>
                      </div>

                      {/* 東南亞信仰智慧 */}
                      <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
                        <h5 className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span>東南亞信仰智慧：象神破障祈請與四面佛守信用還願</span>
                        </h5>
                        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                          {report.dimension4_actionPrescription?.westernAndSouthEast?.southeastAsianGrace.ganeshaWisdom}
                        </div>
                        <div className="p-3.5 bg-amber-950/40 rounded-xl border border-amber-500/30 text-xs sm:text-sm text-amber-200 leading-relaxed whitespace-pre-line">
                          {report.dimension4_actionPrescription?.westernAndSouthEast?.southeastAsianGrace.phraPhromVow}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 常駐模組：互動式開運待辦檢核清單 (Interactive Checklist) */}
                  <div className="p-5 rounded-2xl bg-slate-950/90 border border-purple-500/40 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div>
                        <h5 className="font-bold text-white text-sm flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span>高階個人開運實踐檢核清單 (Interactive Checklist)</span>
                        </h5>
                        <span className="text-[11px] text-slate-400">
                          點擊勾選記錄修煉進度，進度自動儲存於本機
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {completedTasks.length} / {report.dimension4_actionPrescription?.checklistTasks?.length || 6}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          已完成 {Math.round(((completedTasks.length) / (report.dimension4_actionPrescription?.checklistTasks?.length || 6)) * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* 進度條 */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-300"
                        style={{
                          width: `${Math.round(((completedTasks.length) / (report.dimension4_actionPrescription?.checklistTasks?.length || 6)) * 100)}%`,
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {report.dimension4_actionPrescription?.checklistTasks?.map((task) => {
                        const isDone = completedTasks.includes(task.id);
                        return (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => toggleTask(task.id)}
                            className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-start gap-2.5 ${
                              isDone
                                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckSquare className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className={`text-xs font-bold block ${isDone ? 'line-through opacity-80 text-emerald-300' : 'text-white'}`}>
                                {task.title}
                              </span>
                              <span className="text-[11px] text-slate-400 leading-relaxed block">
                                {task.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 幸運飾物與開運色 */}
                  <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30">
                    <h4 className="font-bold text-amber-300 text-xs mb-3 flex items-center gap-2 uppercase tracking-wider">
                      <Gift className="w-4 h-4 text-amber-400" />
                      <span>客製化開運飾物與能量方位</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">開運手珠/飾物</span>
                        <span className="font-bold text-amber-200 mt-0.5 block">
                          {report.dimension4_actionPrescription?.customAmuletAndColor.amulet}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">本命專屬幸運色</span>
                        <span className="font-bold text-purple-200 mt-0.5 block">
                          {report.dimension4_actionPrescription?.customAmuletAndColor.luckyColor}
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                        <span className="text-slate-400 block text-[11px]">貴人天乙方位</span>
                        <span className="font-bold text-emerald-200 mt-0.5 block">
                          {report.dimension4_actionPrescription?.customAmuletAndColor.luckyDirection}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 樹洞心靈雞湯 */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/40 via-indigo-950/30 to-slate-950 border border-purple-500/40 space-y-2">
                    <h4 className="font-bold text-pink-300 text-xs flex items-center gap-2 uppercase tracking-wider">
                      <Smile className="w-4 h-4 text-pink-400" />
                      <span>樹洞深層心靈雞湯結語</span>
                    </h4>
                    <p className="text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line italic">
                      {report.dimension4_actionPrescription?.healingSoupMessage}
                    </p>
                  </div>

                  {/* 跨宗教心靈神聖處方箋入口 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSanctuaryDrawerOpen(true)}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/60 via-indigo-900/60 to-purple-900/60 hover:from-purple-800/80 hover:to-indigo-800/80 border border-purple-500/50 text-purple-200 hover:text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/50 flex flex-wrap items-center justify-center gap-2 transition cursor-pointer group"
                    >
                      <span>🕊️ 領取專屬心靈解方與跨宗教平安指南 ➜</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 group-hover:bg-purple-500/40">
                        佛・道・基督・象神四面佛・72h止血清單
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 現代生存指南 (職場金句、情場避雷針) ================= */}
          {activeTab === 'survival' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-500/40">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                    <Quote className="w-4 h-4" />
                    職場生存犀利金句
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyQuote(report.workplaceQuote.quote)}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded transition"
                  >
                    {copiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedQuote ? '已複製' : '複製'}</span>
                  </button>
                </div>
                <div className="text-lg font-bold text-amber-200 font-serif my-2">
                  {report.workplaceQuote.quote}
                </div>
                <p className="text-xs text-slate-300 mt-2 pt-2 border-t border-slate-800">
                  {report.workplaceQuote.context}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  情場致命避雷針
                </h4>
                {report.loveThunderbolts.warnings.map((w, i) => (
                  <div key={i} className="p-2.5 bg-rose-950/40 rounded-lg text-xs text-rose-100">
                    {w}
                  </div>
                ))}
                <p className="text-xs text-slate-300 pt-1">
                  {report.loveThunderbolts.sweetSpot}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
