'use client';

/**
 * 30 分鐘無動作自動登出與個資深度清理守衛 (IdleTimeoutGuard)
 * 監聽全域操作 (mousemove, click, keydown, touchstart, scroll)
 * 閒置超時自動清理 LocalStorage, SessionStorage, Cookie 並提示使用者
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfileStore } from '@/store/useProfileStore';
import { ShieldAlert, LogIn, X, Clock } from 'lucide-react';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 分鐘

export default function IdleTimeoutGuard() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);

  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 深度清理所有瀏覽器暫存個人資料
  const performDeepCleanup = useCallback(() => {
    try {
      // 1. 清空 LocalStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('omni_profiles');
      localStorage.removeItem('omni_active_profile_id');
      localStorage.removeItem('omni_unlocked_tiers');
      localStorage.removeItem('omni_dim4_completed_tasks');

      // 2. 清空 SessionStorage
      sessionStorage.clear();

      // 3. 清空 Cookie
      document.cookie = 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

      // 4. 重設 Zustand 全域狀態
      logout();
      useProfileStore.setState({ profiles: [], activeProfileId: null });
    } catch (e) {
      console.error('深度清理快取異常:', e);
    }
  }, [logout]);

  // 重置計時器
  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 僅在使用者已登入時啟用 30 分鐘閒置自動登出
    if (user) {
      timerRef.current = setTimeout(() => {
        performDeepCleanup();
        setIsTimeoutModalOpen(true);
      }, IDLE_TIMEOUT_MS);
    }
  }, [user, performDeepCleanup]);

  useEffect(() => {
    if (!user) return;

    // 監聽使用者互動事件
    const events = ['mousemove', 'click', 'keydown', 'touchstart', 'scroll'];

    const handleActivity = () => {
      resetTimer();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });

    // 初始化計時器
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
    };
  }, [user, resetTimer]);

  if (!isTimeoutModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl p-6 sm:p-7 text-slate-100 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center animate-pulse">
          <Clock className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-wide">
            連線逾時・個人隱私安全保護
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            您已連續閒置超過 <strong>30 分鐘</strong>
            。為防止公共裝置或他人窺探您的命盤隱私與個人資料，系統已自動為您安全登出並深度清理暫存檔案。
          </p>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 text-left space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>隱私保護處置已執行：</span>
          </div>
          <div>✓ 已銷毀本機會員 Token 與 Cookie</div>
          <div>✓ 已清除瀏覽器暫存之命盤個資與運勢緩存</div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setIsTimeoutModalOpen(false)}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition cursor-pointer min-h-[44px]"
          >
            以訪客身分繼續
          </button>
          <button
            type="button"
            onClick={() => {
              setIsTimeoutModalOpen(false);
              setAuthModalOpen(true, 'login');
            }}
            className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-900/40 transition cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px]"
          >
            <LogIn className="w-4 h-4" />
            <span>重新登入</span>
          </button>
        </div>
      </div>
    </div>
  );
}
