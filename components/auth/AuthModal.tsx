'use client';

/**
 * 會員登入 / 註冊對話框組件 (AuthModal)
 * 1. 徹底移除第三方登入（Google / LINE / GitHub）
 * 2. 嚴格對齊企業級註冊欄位（姓名職稱、Email、密碼、電話、公司、8碼統編除以10驗證、氣候變遷署七大行業、通訊地址）
 * 3. 雙向同步會員資料庫，徹底根除與後台脫鉤問題
 */
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import {
  isValidTaiwanTaxId,
  isValidTaiwanPhone,
  CLIMATE_CHANGE_INDUSTRIES,
  ClimateChangeIndustry,
} from '@/lib/validators';
import {
  Sparkles,
  X,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  Hash,
  Briefcase,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function AuthModal() {
  const isAuthModalOpen = useAuthStore((state) => state.isAuthModalOpen);
  const authModalMode = useAuthStore((state) => state.authModalMode);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);

  // 登入表單狀態
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 企業級註冊表單狀態
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [taxId, setTaxId] = useState('');
  const [industry, setIndustry] = useState<ClimateChangeIndustry>('服務業');
  const [address, setAddress] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isAuthModalOpen) return null;

  // 註冊表單檢核
  const validateRegisterForm = (): boolean => {
    if (!name.trim()) {
      setErrorMessage('請填寫姓名 / 專業職稱');
      return false;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErrorMessage('請填寫正確格式的電子郵件 (Email)');
      return false;
    }
    if (!password || password.length < 6) {
      setErrorMessage('設定安全密碼長度至少需 6 碼以上');
      return false;
    }
    if (!phone.trim()) {
      setErrorMessage('請填寫連絡電話（手機或分機）');
      return false;
    }
    if (!isValidTaiwanPhone(phone.trim())) {
      setErrorMessage('連絡電話格式不正確（請輸入有效手機 09xx 或含區碼市話）');
      return false;
    }
    if (taxId.trim()) {
      if (!isValidTaiwanTaxId(taxId.trim())) {
        setErrorMessage('公司統一編號格式不符合財政部 8 碼除以 10 邏輯驗證');
        return false;
      }
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage('請填寫完整的連絡通訊地址（用於實際發票與購買憑證寄送）');
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('請輸入電子郵件與密碼');
      return;
    }

    const res = await login(loginEmail.trim(), loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || '帳號或密碼錯誤');
    } else {
      setSuccessMessage('登入成功！正在載入會員專屬權益...');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateRegisterForm()) return;

    const res = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone: phone.trim(),
      company: company.trim() || undefined,
      taxId: taxId.trim() || undefined,
      industry,
      address: address.trim(),
    });

    if (!res.success) {
      setErrorMessage(res.error || '註冊失敗');
    } else {
      setSuccessMessage('企業會員註冊成功！資料已同步寫入系統庫。');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-8">
        {/* 關閉按鈕 */}
        <button
          type="button"
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 標題 */}
        <div className="flex items-center gap-3 pb-3 mb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {mode === 'login' ? '會員安全登入' : '企業級新會員建檔註冊'}
            </h3>
            <p className="text-xs text-slate-400">
              {mode === 'login'
                ? '請使用註冊的 Email 帳號與密碼安全登入'
                : '依法開立發票憑證與商業建檔，資料將受嚴密保密加密'}
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
            舊會員登入
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
            新會員建檔註冊
          </button>
        </div>

        {/* 提示訊息 */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 模式 A：舊會員登入表單 */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                電子郵件 (Email) 或帳號
              </label>
              <input
                type="text"
                required
                placeholder="例：opelwu2002@gmail.com 或 admin"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                密碼
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/40 text-sm transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '安全登入中...' : '登入會員中心'}
            </button>
          </form>
        ) : (
          /* 模式 B：新會員註冊表單（企業級 8 大欄位） */
          <form onSubmit={handleRegisterSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {/* 1. 姓名 / 專業職稱 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-purple-400" />
                姓名 / 專業職稱 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例：陳明偉 執行長 / 專案經理"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* 2. 電子郵件 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                電子郵件 (Email) <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="例：user@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* 3. 設定密碼 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-purple-400" />
                設定安全密碼 (至少 6 碼) <span className="text-rose-400">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* 4. 連絡電話 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400" />
                連絡電話 (手機/分機) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例：0912345678 或 02-27123456 #101"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* 5. 服務公司 (選填) & 6. 統編 8 碼 (選填) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-purple-400" />
                  服務公司 / 學校
                </label>
                <input
                  type="text"
                  placeholder="例：宇沛實業股份有限公司 或 國立台灣大學"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-purple-400" />
                  公司統一編號 8 碼 (學校請填入8個0)
                </label>
                <input
                  type="text"
                  maxLength={8}
                  placeholder="例：93620650 (學校填 00000000)"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
                {taxId.length === 8 && (
                  <span
                    className={`text-[10px] mt-0.5 block ${
                      isValidTaiwanTaxId(taxId) ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isValidTaiwanTaxId(taxId) ? '✓ 統編檢核通過' : '✗ 統編未通過財政部除以10驗證'}
                  </span>
                )}
              </div>
            </div>

            {/* 7. 所屬行業分類 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                所屬行業分類 <span className="text-rose-400">*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value as ClimateChangeIndustry)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              >
                {CLIMATE_CHANGE_INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind} className="bg-slate-900 text-white">
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* 8. 連絡通訊地址 */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-purple-400" />
                連絡通訊地址 (發票與購買憑證寄送) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="例：台北市松山區敦化北路207號9樓之6"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/40 text-sm transition cursor-pointer disabled:opacity-50"
            >
              {isLoading ? '提交建檔中...' : '提交企業註冊並完成建檔'}
            </button>
          </form>
        )}

        {/* 測試帳號快速填入 */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 block mb-1.5">
            官方測試帳號快速帶入：
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLoginEmail('vip@omni-astrology.com');
                setLoginPassword('user123456');
                setMode('login');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-md border border-slate-700 transition cursor-pointer"
            >
              VIP 會員 (vip@omni-astrology.com)
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginEmail('opelwu2002@gmail.com');
                setLoginPassword('Opel6439');
                setMode('login');
              }}
              className="px-2.5 py-1 bg-purple-900/40 hover:bg-purple-800/60 text-purple-300 text-xs rounded-md border border-purple-700/50 transition cursor-pointer"
            >
              最高管理員 (opelwu2002@gmail.com / Opel6439)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
