'use client';

/**
 * 會員登入 / 註冊對話框組件 (AuthModal)
 * 整合真實第三方 OAuth 2.0 (Google / LINE / GitHub) 與傳統 Email/密碼 認證
 * 具備未配置憑證防禦攔截 (杜絕 401 invalid_client) 與友善中文錯誤轉譯
 */
import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Sparkles,
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';

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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  // 第三方服務啟用狀態檢測
  const [providersStatus, setProvidersStatus] = useState<{
    google: boolean;
    line: boolean;
    github: boolean;
  }>({
    google: false,
    line: false,
    github: false,
  });

  // 讀取後端 OAuth 金鑰配置狀態與網址列回傳錯誤
  useEffect(() => {
    if (!isAuthModalOpen) return;

    // 1. 查詢後端哪些 OAuth 已配置有效金鑰
    fetch('/api/auth/providers-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.providers) {
          setProvidersStatus(data.providers);
        }
      })
      .catch(() => {});

    // 2. 檢測網址列是否有 OAuth 跳回之錯誤代碼，轉譯為繁體中文
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const err = urlParams.get('error') || urlParams.get('auth_error');
      if (err) {
        if (err.includes('invalid_client') || err.includes('Configuration')) {
          setErrorMessage(
            'Google OAuth 尚未在 Vercel 填寫真實 Client ID 或未設定重新導向網址，請使用帳號密碼登入。'
          );
        } else if (err.includes('AccessDenied')) {
          setErrorMessage('您已取消第三方授權登入流程。');
        } else if (err.includes('OAuthSignin') || err.includes('OAuthCallback')) {
          setErrorMessage('連線第三方認證中心逾時或失敗，請改用帳號密碼登入。');
        } else {
          setErrorMessage(`授權狀態通知：${err}`);
        }
      }
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // 觸發真實第三方 OAuth 登入 (Google / LINE / GitHub)
  const handleOAuthLogin = async (provider: 'google' | 'line' | 'github') => {
    const providerName =
      provider === 'google' ? 'Google' : provider === 'line' ? 'LINE' : 'GitHub';

    // 核心防禦：若後端尚未在 Vercel 配置有效金鑰，直接在前端友善提醒，絕對不送往 Google 產生 401 畫面！
    if (!providersStatus[provider]) {
      setErrorMessage(
        `⚠️ 尚未在伺服器啟用 ${providerName} 授權（未在 Vercel 配置 ${provider.toUpperCase()}_CLIENT_ID）。請直接使用 Email 帳號密碼登入（如 opelwu2002@gmail.com 或管理員帳號）。`
      );
      return;
    }

    try {
      setOauthLoading(provider);
      setErrorMessage('');
      // 呼叫 NextAuth signIn 方法，導向官方授權頁面
      await signIn(provider, {
        callbackUrl: window.location.origin,
        redirect: true,
      });
    } catch (err: any) {
      setErrorMessage(
        err?.message || `發起 ${providerName} 授權連線異常，請使用帳號密碼登入。`
      );
      setOauthLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setErrorMessage(res.error || '帳號或密碼錯誤');
      } else {
        setSuccessMessage('登入成功！正在同步會員命盤資料...');
      }
    } else {
      const res = await register(email, password, name);
      if (!res.success) {
        setErrorMessage(res.error || '註冊失敗');
      } else {
        setSuccessMessage('註冊成功並已自動登入！');
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
              {mode === 'login' ? '會員安全登入' : '免費註冊會員'}
            </h3>
            <p className="text-xs text-slate-400">
              支援 Google、LINE、GitHub 快速登入與雲端備份
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
            帳號密碼登入
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

        {/* 友善提示訊息 */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 真實第三方快捷登入區 (Google, LINE, GitHub) */}
        <div className="space-y-2 mb-4">
          {/* Google OAuth 按鈕 */}
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={oauthLoading !== null}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 border border-slate-200"
          >
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
            <span>
              {oauthLoading === 'google'
                ? '正在跳轉 Google 官方授權...'
                : '使用 Google 帳號快速登入'}
            </span>
          </button>

          {/* 台灣在地 LINE 與 GitHub 雙列按鈕 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleOAuthLogin('line')}
              disabled={oauthLoading !== null}
              className="py-2 px-3 bg-[#06C755] hover:bg-[#05b34c] text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.036 9.608.391.084.922.258 1.057.592.121.303.079.777.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.572-3.843 2.572-5.992z" />
              </svg>
              <span>{oauthLoading === 'line' ? '連線中...' : 'LINE 登入'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOAuthLogin('github')}
              disabled={oauthLoading !== null}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded-xl text-xs border border-slate-700 shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                />
              </svg>
              <span>{oauthLoading === 'github' ? '連線中...' : 'GitHub 登入'}</span>
            </button>
          </div>

          <div className="relative flex py-2.5 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-3 text-[11px] text-slate-500">
              或使用 Email / 會員帳號
            </span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>
        </div>

        {/* 傳統帳號密碼表單 */}
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
              電子郵件 (Email) 或帳號
            </label>
            <input
              type="text"
              required
              placeholder="例：opelwu2002@gmail.com"
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
            {isLoading
              ? '安全驗證中...'
              : mode === 'login'
              ? '立即登入會員'
              : '免費註冊並同步雲端'}
          </button>
        </form>

        {/* 測試體驗帳號 */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1.5">
            測試體驗帳號快速帶入：
          </span>
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
