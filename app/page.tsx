'use client';

/**
 * Omni-Astrology 四合一全方位中西命理平台 - 主頁面
 * 整合：
 * 1. 徹底修復 Hydration Error (使用 isMounted 客戶端渲染守衛)
 * 2. 響應式 RWD 行動端漢堡選單 (Hamburger Menu)
 * 3. 官方版權與法定公司資訊 Footer (宇沛實業股份有限公司)
 * 4. 漏斗式商業付費報告、會員認證與管理員後台入口
 */
import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useProfileStore } from '@/store/useProfileStore';
import { useAuthStore } from '@/store/useAuthStore';
import { calculateSolarAndUtcTime, logTimeCalculationSummary } from '@/lib/timeUtils';
import { calculateWesternAstrology } from '@/lib/astrology/westernAstrology';
import { calculateBaziChart } from '@/lib/astrology/baziEngine';
import { calculateZiweiChart } from '@/lib/astrology/ziweiEngine';
import { calculateNumerology } from '@/lib/astrology/numerologyEngine';
import { calculateFourteenDimensionsReport } from '@/lib/interpretationEngine';

// 各模組組件
import ProfileForm from '@/components/ProfileForm';
import ProfileList from '@/components/ProfileList';
import TimeEngineCard from '@/components/TimeEngineCard';
import AstrologyChart from '@/components/charts/AstrologyChart';
import ZiweiChart from '@/components/charts/ZiweiChart';
import BaziCard from '@/components/charts/BaziCard';
import NumerologyCard from '@/components/charts/NumerologyCard';
import InterpretationView from '@/components/InterpretationView';
import FourteenDimensionsView from '@/components/FourteenDimensionsView';
import SynastryView from '@/components/SynastryView';
import AuthModal from '@/components/auth/AuthModal';
import IdleTimeoutGuard from '@/components/auth/IdleTimeoutGuard';
import DivinationView from '@/components/divination/DivinationView';
import Footer from '@/components/Footer';

import {
  Sparkles,
  Compass,
  FileText,
  HeartHandshake,
  Clock,
  Users,
  ChevronRight,
  ShieldCheck,
  User,
  LogOut,
  CloudUpload,
  CloudCheck,
  RefreshCw,
  Menu,
  X,
  Gem,
  Flame,
} from 'lucide-react';

export default function HomePage() {
  // 1. 徹底消除 Hydration Error 的客戶端守衛
  const [isMounted, setIsMounted] = useState(false);

  // 手機版漢堡選單狀態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 會員狀態
  const user = useAuthStore((state) => state.user);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logout = useAuthStore((state) => state.logout);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);
  const syncProfilesToCloud = useAuthStore((state) => state.syncProfilesToCloud);

  // 命盤資料狀態
  const profiles = useProfileStore((state) => state.profiles);
  const activeProfileId = useProfileStore((state) => state.activeProfileId);
  const setActiveProfile = useProfileStore((state) => state.setActiveProfile);

  // 當前功能分頁 Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'fourteenDimensions' | 'divination' | 'interpretation' | 'synastry' | 'timeEngine' | 'profiles'
  >('dashboard');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'info';
    message: string;
  } | null>(null);

  // 僅在客戶端載入後才啟動
  useEffect(() => {
    setIsMounted(true);
    checkAuth();

    // 檢查 URL 回調參數
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const isPaymentSuccess = searchParams.get('payment_success') === 'true';

      if (isPaymentSuccess) {
        const orderNo = searchParams.get('orderNo');
        const tier = searchParams.get('tier') || 'level2';
        try {
          const current = JSON.parse(localStorage.getItem('omni_unlocked_tiers') || '["free"]');
          if (!current.includes(tier)) {
            current.push(tier);
            if (tier === 'level3') current.push('level2');
            localStorage.setItem('omni_unlocked_tiers', JSON.stringify(Array.from(new Set(current))));
          }
        } catch {
          // 容錯
        }
        setActiveTab('interpretation');
        setToastNotification({
          type: 'success',
          message: `✓ 綠界科技金流支付成功（單號：${orderNo || '已核可'}）！已即時解鎖專屬報告，紙本發票將於 3 個工作天內掛號寄出。`,
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [checkAuth]);

  const activeProfile = useMemo(() => {
    if (!isMounted) return null;
    return profiles.find((p) => p.id === activeProfileId) || profiles[0] || null;
  }, [isMounted, profiles, activeProfileId]);

  // 1. 時間引擎推算 (UTC, 真太陽時, DST)
  const timeResult = useMemo(() => {
    if (!activeProfile) return null;
    return calculateSolarAndUtcTime(
      activeProfile.birthDate,
      activeProfile.birthTime,
      activeProfile.location
    );
  }, [activeProfile]);

  // 2. 西洋占星排盤推算 (十大行星, 宮位, 相位)
  const westernChartData = useMemo(() => {
    if (!timeResult || !activeProfile) return null;
    return calculateWesternAstrology(
      new Date(timeResult.utcTimestamp),
      activeProfile.location.latitude,
      activeProfile.location.longitude
    );
  }, [timeResult, activeProfile]);

  // 3. 八字命理排盤推算 (四柱干支, 十神, 五行)
  const baziChartData = useMemo(() => {
    if (!timeResult) return null;
    return calculateBaziChart(timeResult.trueSolarDate, timeResult.trueSolarTimeOnly);
  }, [timeResult]);

  // 4. 紫微斗數排盤推算 (十二宮位, 十四主星, 四化)
  const ziweiChartData = useMemo(() => {
    if (!timeResult || !activeProfile) return null;
    return calculateZiweiChart(
      timeResult.trueSolarDate,
      timeResult.trueSolarTimeOnly,
      activeProfile.gender
    );
  }, [timeResult, activeProfile]);

  // 5. 生命靈數推算 (命運數, 九宮格, 連線)
  const numerologyChartData = useMemo(() => {
    if (!activeProfile) return null;
    return calculateNumerology(activeProfile.birthDate);
  }, [activeProfile]);

  // 控制台輸出日誌
  useEffect(() => {
    if (isMounted && timeResult) {
      logTimeCalculationSummary(timeResult);
    }
  }, [isMounted, timeResult]);

  // 命宮主星
  const mingMajorStar = useMemo(() => {
    if (!ziweiChartData) return '紫微';
    const mingPalace = ziweiChartData.palaces.find((p) => p.name === '命宮');
    return mingPalace?.majorStars[0]?.name || '紫微';
  }, [ziweiChartData]);

  // 14 維度命理解析報告真實推導計算
  const fourteenDimensionsReport = useMemo(() => {
    if (!westernChartData || !baziChartData || !ziweiChartData || !numerologyChartData || !activeProfile) {
      return null;
    }
    return calculateFourteenDimensionsReport({
      western: westernChartData,
      bazi: baziChartData,
      ziwei: ziweiChartData,
      numerology: numerologyChartData,
      profile: {
        name: activeProfile.name,
        gender: activeProfile.gender,
        birthDate: activeProfile.birthDate,
        birthTime: activeProfile.birthTime,
        locationName: activeProfile.location.name,
      },
    });
  }, [westernChartData, baziChartData, ziweiChartData, numerologyChartData, activeProfile]);

  // 手動同步檔案至雲端
  const handleCloudSync = async () => {
    if (!user) {
      setAuthModalOpen(true, 'login');
      return;
    }
    setIsSyncing(true);
    const ok = await syncProfilesToCloud(profiles);
    setIsSyncing(false);
    if (ok) {
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    }
  };

  const navTabs = [
    { id: 'dashboard' as const, label: '🌟 命盤全景儀表板', icon: Compass },
    { id: 'fourteenDimensions' as const, label: '🔮 14維度極致命盤', icon: Sparkles },
    { id: 'divination' as const, label: '🎴 神聖線上占卜', icon: Flame },
    { id: 'interpretation' as const, label: '📖 四合一深層解盤', icon: FileText },
    { id: 'synastry' as const, label: '💖 人際關係雙人合盤', icon: HeartHandshake },
    { id: 'timeEngine' as const, label: '⏱️ 時間與地理引擎', icon: Clock },
    { id: 'profiles' as const, label: '👤 個人檔案管理', icon: Users },
  ];

  // 骨架屏：確保伺服器 SSR 渲染與客戶端未水合前完全同構，徹底根除 Hydration Error
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <header className="border-b border-slate-800 bg-slate-950/80 h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 animate-pulse" />
            <div className="h-5 w-48 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded animate-pulse" />
        </header>

        <div className="max-w-7xl mx-auto px-6 py-12 w-full flex-1 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 animate-spin">
            <RefreshCw className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-300">
            正在安全水合載入四合一中西命理核心...
          </p>
          <p className="text-xs text-slate-500">
            精算 UTC 絕對時間、地方平太陽時與 Spencer 均時差
          </p>
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between">
      {/* 登入註冊彈窗 */}
      <AuthModal />

      {/* 閒置 30 分鐘自動登出與個資保護安全守衛 */}
      <IdleTimeoutGuard />

      {/* 頂部導航列 */}
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo 與標題 */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-600/30 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-lg bg-gradient-to-r from-purple-300 via-pink-200 to-amber-300 bg-clip-text text-transparent">
                Omni-Astrology 四合一全方位命理平台
              </h1>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
                西洋占星 × 紫微斗數 × 八字四柱 × 生命靈數
              </p>
            </div>
          </div>

          {/* 右側操作區 (後台快速入口 + 桌機版會員狀態 + 手機版漢堡選單按鈕) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 醒目的管理員後台快速入口 (隨時可見，直達 /admin) */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 hover:from-amber-500/30 hover:to-purple-500/30 text-amber-300 hover:text-amber-200 text-xs font-bold rounded-lg border border-amber-500/40 hover:border-amber-400 transition shadow-sm shrink-0 min-h-[36px]"
              title="進入管理員控制台"
            >
              <span>⚙️ 管理員後台</span>
            </Link>

            {/* 桌機版會員功能 */}
            <div className="hidden sm:flex items-center gap-2">
              {user ? (
                <>
                  <button
                    type="button"
                    onClick={handleCloudSync}
                    disabled={isSyncing}
                    title="手動同步所有命盤檔案至雲端資料庫"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 transition cursor-pointer"
                  >
                    {syncSuccess ? (
                      <>
                        <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">已同步</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className={`w-3.5 h-3.5 text-purple-400 ${isSyncing ? 'animate-bounce' : ''}`} />
                        <span>雲端同步</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="font-semibold text-slate-200">
                      {user.name}
                    </span>
                    <button
                      type="button"
                      onClick={logout}
                      title="登出帳號"
                      className="p-1 hover:text-rose-400 transition cursor-pointer ml-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hidden md:inline">
                    訪客模式
                  </span>
                  <button
                    type="button"
                    onClick={() => setAuthModalOpen(true, 'login')}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs rounded-lg shadow-md shadow-purple-900/30 transition cursor-pointer"
                  >
                    會員登入 / 註冊
                  </button>
                </div>
              )}
            </div>

            {/* 手機版漢堡選單按鈕 */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              aria-label="展開導航選單"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* 手機版下拉摺疊選單 (Hamburger Drawer) */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3 animate-fade-in shadow-2xl">
            {/* 手機版管理員後台專屬入口 */}
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-md hover:bg-amber-900/30 transition min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <span>⚙️</span>
                <span className="text-white font-bold">進入管理員後台控制台</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                /admin
              </span>
            </Link>
            {/* 會員狀態資訊 */}
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              {user ? (
                <>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-400" />
                    <span className="font-bold text-white">{user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300">
                      {user.role === 'admin' ? '管理員' : 'VIP 會員'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-[11px] text-amber-300 font-bold underline"
                      >
                        後台
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="text-[11px] text-rose-400"
                    >
                      登出
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <span className="text-slate-400 text-[11px]">未登入（訪客模式）</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(true, 'login');
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-xs"
                  >
                    登入 / 註冊
                  </button>
                </div>
              )}
            </div>

            {/* 導航功能按鈕 */}
            <div className="space-y-1.5">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 桌機版橫向 Tab 導航列 */}
        <div className="hidden sm:flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto gap-2 py-2 border-t border-slate-800/60 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 主要內容容器 */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 w-full flex-1 space-y-6">
        {/* 全域金流與第三方登入狀態 Toast 提示 */}
        {toastNotification && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-purple-950/70 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xl animate-fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-medium">{toastNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 當前分析對象快速切換條 */}
        {activeProfile && (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white text-sm">{activeProfile.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  activeProfile.gender === 'female'
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {activeProfile.gender === 'female' ? '坤造' : '乾造'}
              </span>
              <span className="text-slate-400">
                {activeProfile.birthDate} {activeProfile.birthTime}
              </span>
              <span className="text-slate-500 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">{activeProfile.location.name}</span>

              {/* 切換選單 */}
              {profiles.length > 1 && (
                <select
                  value={activeProfile.id}
                  onChange={(e) => setActiveProfile(e.target.value)}
                  className="ml-1 sm:ml-2 bg-slate-950 border border-slate-700 text-purple-300 text-xs rounded-md px-2 py-1 focus:outline-none"
                >
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      切換：{p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {timeResult && (
              <div className="flex items-center gap-3 text-slate-400">
                <span className="hidden sm:inline">
                  真太陽時：<strong className="text-amber-300">{timeResult.trueSolarTimeOnly}</strong> (
                  {timeResult.solarHourBranch}時)
                </span>
                <span className="hidden md:inline">
                  占星 UTC：<strong className="text-indigo-300">{timeResult.utcTime.slice(11, 19)}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('timeEngine')}
                  className="text-purple-400 hover:text-purple-300 transition flex items-center gap-0.5 cursor-pointer"
                >
                  <span>時差明細</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: 命盤全景儀表板 (Dashboard) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* 14 維度深度報告快捷指引橫幅 */}
            {fourteenDimensionsReport && activeProfile && (
              <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-amber-950/40 border border-purple-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white font-bold text-xs shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      已生成【{activeProfile.name}】14 維度全景深度命理解析報告
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      包含 I/E 人格、命中正緣歲數、資產聚富、五行五臟食補與三年流年曲線
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('fourteenDimensions')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-900/30 shrink-0"
                >
                  <span>立即檢閱 14 維度</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 上部並排：紫微方盤與占星圓盤 (手機版自適應直列，桌機並排) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* 紫微斗數方盤 */}
              <div className="w-full overflow-x-auto">
                {ziweiChartData ? (
                  <ZiweiChart data={ziweiChartData} />
                ) : (
                  <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
                    計算紫微命盤中...
                  </div>
                )}
              </div>

              {/* 西洋占星圓盤 */}
              <div className="w-full overflow-x-auto">
                {westernChartData ? (
                  <AstrologyChart data={westernChartData} />
                ) : (
                  <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
                    計算西洋星盤中...
                  </div>
                )}
              </div>
            </div>

            {/* 下部條列：八字四柱與生命靈數 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {baziChartData && <BaziCard data={baziChartData} />}
              {numerologyChartData && <NumerologyCard data={numerologyChartData} />}
            </div>
          </div>
        )}

        {/* Tab 2: 14 維度極致命盤報告 (FourteenDimensionsView) */}
        {activeTab === 'fourteenDimensions' && activeProfile && fourteenDimensionsReport && westernChartData && baziChartData && numerologyChartData && (
          <FourteenDimensionsView
            report={fourteenDimensionsReport}
            profileName={activeProfile.name}
            birthDate={activeProfile.birthDate}
            birthTime={activeProfile.birthTime}
            sunSign={westernChartData.sunSign}
            moonSign={westernChartData.moonSign}
            risingSign={westernChartData.risingSign}
            dayMaster={baziChartData.dayMaster}
            mingMajorStar={mingMajorStar}
            destinyNumber={numerologyChartData.destinyNumber}
          />
        )}

        {/* Tab: 神聖線上占卜 (會員專屬四大免費占卜：塔羅、民間擲杯、文鳥鳥卦、易經米卦) */}
        {activeTab === 'divination' && <DivinationView />}

        {/* Tab 3: 四合一深層解盤 (Interpretation - 商業四大維度) */}
        {activeTab === 'interpretation' && activeProfile && westernChartData && baziChartData && numerologyChartData && (
          <InterpretationView
            profileName={activeProfile.name}
            destinyNumber={numerologyChartData.destinyNumber}
            sunSign={westernChartData.sunSign}
            moonSign={westernChartData.moonSign}
            risingSign={westernChartData.risingSign}
            dayMaster={baziChartData.dayMaster}
            mingMajorStar={mingMajorStar}
          />
        )}

        {/* Tab 4: 人際關係雙人合盤 (Synastry) */}
        {activeTab === 'synastry' && <SynastryView />}

        {/* Tab 4: 時間與地理引擎 (Time & Geo Engine) */}
        {activeTab === 'timeEngine' && <TimeEngineCard />}

        {/* Tab 5: 個人檔案管理 (Profiles) */}
        {activeTab === 'profiles' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <ProfileForm />
            </div>
            <div className="lg:col-span-5">
              <ProfileList />
            </div>
          </div>
        )}
      </div>

      {/* 官方版權與法定公司資訊 Footer (宇沛實業股份有限公司) */}
      <Footer />
    </main>
  );
}
