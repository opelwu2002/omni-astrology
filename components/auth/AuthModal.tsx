'use client';

/**
 * 會員登入 / 註冊對話框組件 (AuthModal)
 */
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Sparkles, X, Lock, Mail, User, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthModal() {
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const authModalMode = useAuthStore((state) => state.authModalMode);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  // 發起 Google 第三方授權登入
  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      setErrorMessage('');
      const res = await fetch('/api/auth/google/url');
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMessage('取得 Google 授權連線失敗');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || '發起 Google 授權連線異常');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || '登入失敗');
      } else {
        setSuccessMessage('登入成功！正在載入會員雲端資料...');
      }
    } else {
      const res = await register(email, password, name);
      if (!res.success) {
        setErrorMessage(res.error || '註冊失敗');
      } else {
        setSuccessMessage('註冊成功並已登入！');
      }
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-6 text-slate-100">
        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題 */}
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {mode === 'login' ? '會員登入' : '免費註冊會員'}
            </h3>
            <p className="text-xs text-slate-400">
              登入即可解鎖跨裝置雲端同步、無限檔案管理
            </p>
          </div>
        </div>

        {/* 模式切換 */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 rounded-xl mb-4 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage('');
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            帳號登入
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage('');
            }}
            className={`py-1.5 text-xs font-semibold rounded-lg transition ${
              mode === 'register'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            新用戶註冊
          </button>
        </div>

        {/* 提示訊息 */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Google 快速登入按鈕 */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 border border-slate-200"
          >
            {/* Google 官方四色彩色 G 圖標 */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>{isGoogleLoading ? '正在連線 Google 授權...' : '使用 Google 帳號快速登入'}</span>
          </button>

          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500">或使用電子郵件</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </div>

        {/* 表單 */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                稱謂或姓名
              </label>
              <input
                type="text"
                placeholder="例：王小明"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              電子郵件 (Email)
            </label>
            <input
              type="text"
              required
              placeholder="請輸入電子郵件 (Email) 或會員帳號"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              密碼 (至少 6 碼)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/40 text-sm transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? '處理中...' : mode === 'login' ? '立即登入' : '免費註冊並同步'}
          </button>
        </form>

        {/* 快速體驗按鈕 (僅提供一般會員測試) */}
        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-2">快速體驗測試帳號：</span>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('vip@omni-astrology.com');
                setPassword('user123456');
                setMode('login');
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition cursor-pointer"
            >
              填入體驗會員 (vip@omni-astrology.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
