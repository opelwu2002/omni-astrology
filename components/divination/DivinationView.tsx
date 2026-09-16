'use client';

/**
 * 會員專屬四大神聖線上占卜總控視圖 (DivinationView)
 * 包含：
 * 1. 儀式感心法引導（深呼吸、定心默念）
 * 2. 獲客鉤子 (Lead Magnet Gate)：免費體驗但強制需註冊/登入會員
 * 3. 塔羅牌、民間擲杯、文鳥鳥卦、易經米卦四大子模組切換
 */
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import TarotModule from './TarotModule';
import BwaBweiModule from './BwaBweiModule';
import BirdDivinationModule from './BirdDivinationModule';
import RiceDivinationModule from './RiceDivinationModule';
import {
  Sparkles,
  Layers,
  Flame,
  Feather,
  Compass,
  Lock,
  UserPlus,
  ShieldCheck,
  Heart,
  Wind,
} from 'lucide-react';

export default function DivinationView() {
  const user = useAuthStore((state) => state.user);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);

  const [activeDivinationTab, setActiveDivinationTab] = useState<
    'tarot' | 'bwabwei' | 'bird' | 'rice'
  >('tarot');

  const tabs = [
    { id: 'tarot' as const, label: '西洋塔羅牌', icon: Layers, desc: '大阿爾克那22張牌陣' },
    { id: 'bwabwei' as const, label: '民間擲筊神諭', icon: Flame, desc: '連三聖杯降籤詩' },
    { id: 'bird' as const, label: '正統文鳥鳥卦', icon: Feather, desc: '靈鳥出籠叼籤解惑' },
    { id: 'rice' as const, label: '周易易經米卦', icon: Compass, desc: '五穀推演六十四卦' },
  ];

  return (
    <div className="space-y-6">
      {/* 通用儀式感心法引導橫幅 (深呼吸定心) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" />
                <span>神聖儀式・靜心起卦心法</span>
              </span>
              {user ? (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ✓ 會員免費無限次暢用
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  ★ 免費註冊即享無限占卜
                </span>
              )}
            </div>

            <h3 className="text-lg sm:text-xl font-black text-white tracking-wide">
              萬事不決問神明・以至誠通宇宙天機
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              「請微閉雙眼，緩慢深呼吸三次，專注思考您想詢問的具體問題（如工作轉折、合夥利弊、感情走向）。在心中默念您的姓名、西元出生年月日與問題三次，帶著敬意與清淨心按下占卜。」
            </p>
          </div>

          {/* 若未登入，顯示極具誘因的會員註冊入口 (Lead Magnet) */}
          {!user && (
            <div className="w-full md:w-auto p-4 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-purple-600/20 border border-amber-400/40 text-center shrink-0 space-y-2">
              <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>免費解鎖四大神聖占卜</span>
              </div>
              <p className="text-[11px] text-slate-300">加入會員享終身無限次占卜解惑</p>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true, 'register')}
                className="w-full px-5 py-2.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-900/50 transition cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>免費註冊會員即刻開啟</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 四大占卜子導航切換列 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeDivinationTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDivinationTab(tab.id)}
              className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-3 min-h-[44px] ${
                isActive
                  ? 'bg-purple-950/60 border-purple-400 shadow-lg shadow-purple-950/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 transition ${
                  isActive
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-xs sm:text-sm block">{tab.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{tab.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 核心內容區塊 (具備會員門檻攔截層) */}
      <div className="relative">
        {/* 未登入時的毛玻璃會員引導遮罩 */}
        {!user && (
          <div className="absolute inset-0 z-20 backdrop-blur-md bg-slate-950/75 rounded-3xl border border-purple-500/40 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 animate-bounce">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1">
              <h4 className="text-lg sm:text-xl font-extrabold text-white">
                四大神聖占卜為「會員專屬免費特權」
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                只要免費註冊/登入會員，即可終身無限次免費體驗【塔羅牌單張/三張牌陣】、【民間擲杯連三聖杯神諭】、【文鳥鳥卦】與【周易米卦】！
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true, 'register')}
                className="w-full py-3 px-5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-black text-xs rounded-xl shadow-xl shadow-purple-900/50 transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>免費註冊會員（30秒完成）</span>
              </button>
              <button
                type="button"
                onClick={() => setAuthModalOpen(true, 'login')}
                className="w-full py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer min-h-[44px] flex items-center justify-center"
              >
                已有帳號・直接登入
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>宇沛實業股份有限公司・個資絕對隔離保障</span>
            </div>
          </div>
        )}

        {/* 占卜內容展示容器 */}
        <div className={`transition ${!user ? 'filter blur-[3px] pointer-events-none' : ''}`}>
          {activeDivinationTab === 'tarot' && <TarotModule />}
          {activeDivinationTab === 'bwabwei' && <BwaBweiModule />}
          {activeDivinationTab === 'bird' && <BirdDivinationModule />}
          {activeDivinationTab === 'rice' && <RiceDivinationModule />}
        </div>
      </div>
    </div>
  );
}
