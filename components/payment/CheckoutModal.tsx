'use client';

/**
 * 商業級金流收銀台對話框組件 (CheckoutModal)
 * 1. 徹底拔除所有模擬付款與直接解鎖通道
 * 2. 實質對接綠界科技 (ECPay) 官方正式 3D-Secure 交易通道 (AioCheckOut V5)
 * 3. 稅法合規：紙本發票與三聯式 8 碼統編除以 10 驗證、掛號寄送地址收集
 * 4. 法律第一層防護：結帳前強制勾選《宇沛實業命理解析服務免責聲明》
 */
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import { InvoiceType } from '@/types/auth';
import { isValidTaiwanTaxId, isValidTaiwanPhone } from '@/lib/validators';
import {
  CreditCard,
  X,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  Gift,
  FileText,
  Building,
  User,
  Phone,
  MapPin,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  tier: 'level2' | 'level3' | 'synastry_addon';
  tierName: string;
  price: number;
  originalPrice: number;
  features: string[];
  onClose: () => void;
  onSuccess: (tier: string) => void;
}

export default function CheckoutModal({
  isOpen,
  tier,
  tierName,
  price,
  originalPrice,
  features,
  onClose,
}: Props) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 法律第一層防護：免責聲明與服務條款強制勾選
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // 紙本發票郵寄資料
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('individual');
  const [buyerTitle, setBuyerTitle] = useState(currentUser?.company || '');
  const [taxId, setTaxId] = useState(currentUser?.taxId || '');
  const [recipientName, setRecipientName] = useState(currentUser?.name || '');
  const [recipientPhone, setRecipientPhone] = useState(currentUser?.phone || '');
  const [postalCode, setPostalCode] = useState('100');
  const [address, setAddress] = useState(currentUser?.address || '');

  if (!isOpen) return null;

  // 驗證表單
  const validateForm = (): boolean => {
    if (!agreedToTerms) {
      setErrorMsg('請先閱讀並勾選同意《宇沛實業命理解析服務免責聲明》與《服務條款》');
      return false;
    }
    if (!recipientName.trim()) {
      setErrorMsg('請填寫紙本發票收件人真實姓名');
      return false;
    }
    if (!recipientPhone.trim() || !isValidTaiwanPhone(recipientPhone.trim())) {
      setErrorMsg('請填寫有效之收件人連絡電話（如：0912345678）');
      return false;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMsg('請填寫完整之郵寄收件地址以利紙本發票掛號寄達');
      return false;
    }
    if (invoiceType === 'company') {
      if (!buyerTitle.trim()) {
        setErrorMsg('三聯式發票請輸入公司買受人抬頭');
        return false;
      }
      if (!taxId.trim() || !isValidTaiwanTaxId(taxId.trim())) {
        setErrorMsg('三聯式發票請輸入符合財政部 8 碼除以 10 邏輯之有效公司統一編號');
        return false;
      }
    }
    return true;
  };

  // 前往綠界科技官方收銀台 (實質 3D-Secure 扣款)
  const handlePay = async () => {
    setErrorMsg('');
    if (!validateForm()) return;

    setIsProcessing(true);

    const invoicePayload = {
      type: invoiceType,
      buyerTitle: invoiceType === 'company' ? buyerTitle.trim() : undefined,
      taxId: invoiceType === 'company' ? taxId.trim() : undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      postalCode: postalCode.trim() || '100',
      address: address.trim(),
    };

    try {
      const res = await fetch('/api/payment/ecpay-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          tier,
          tierName,
          amount: price,
          invoice: invoicePayload,
          agreedToTerms,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || '發起綠界支付失敗');
        setIsProcessing(false);
        return;
      }

      // 動態產生 Form 表單並 POST 送出，跳轉至綠界官方收銀台
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.apiUrl;
      form.style.display = 'none';

      Object.entries(data.params).forEach(([key, val]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(val);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      setErrorMsg(err?.message || '前往綠界金流伺服器連線異常，請稍後重試');
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* 獨立法律免責條款彈窗 */}
      <LegalDisclaimerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 my-8">
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 標題與品牌認證 */}
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-800">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-600/30 text-amber-300 border border-amber-500/30 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  解鎖深度解盤專屬白皮書
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">
                  3D-Secure 安全防護
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                方案項目：<span className="text-amber-300 font-medium">{tierName}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* 權益功能清單 */}
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <span className="text-[11px] font-bold text-purple-300 block mb-1">
                ✦ 購買本報告即刻解鎖以下尊榮內容：
              </span>
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* 價格方案展示 */}
            <div className="p-3.5 bg-gradient-to-r from-purple-950/40 to-slate-950 rounded-2xl border border-purple-500/30 flex items-baseline justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">結帳應付金額（含稅）</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
                    NT$ {price}
                  </span>
                  <span className="text-xs text-slate-500 line-through">
                    NT$ {originalPrice}
                  </span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                現折 NT$ {originalPrice - price} 元
              </span>
            </div>

            {/* 正式綠界科技 ECPay 金流通道標籤 */}
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">綠界科技 (ECPay) 正式金流收銀台</span>
                    <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[9px] font-bold">
                      官方通道
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    支援全台信用卡 (VISA/MasterCard/JCB)、銀聯卡與 ATM 虛擬帳號繳費
                  </p>
                </div>
              </div>
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* 紙本發票郵寄資料收集模組 (稅法合規) */}
            <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>紙本統一發票開立與掛號郵寄資訊</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setInvoiceType('individual')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      invoiceType === 'individual'
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    二聯式 (個人)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceType('company')}
                    className={`px-2.5 py-1 rounded-md transition ${
                      invoiceType === 'company'
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    三聯式 (公司統編)
                  </button>
                </div>
              </div>

              {/* 三聯式公司資訊 */}
              {invoiceType === 'company' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs animate-in fade-in">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3 text-purple-400" />
                      <span>公司買受人抬頭 *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="例：宇沛實業股份有限公司"
                      value={buyerTitle}
                      onChange={(e) => setBuyerTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">
                      公司統一編號 8 碼 *
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      placeholder="例：93620650"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
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
              )}

              {/* 收件人姓名與手機 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-purple-400" />
                    <span>收件人姓名 *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="請填寫本名以利郵件領取"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-purple-400" />
                    <span>連絡手機 / 電話 *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="例：0912345678"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              {/* 郵遞區號與詳細地址 */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="col-span-1">
                  <label className="block text-[11px] text-slate-300 mb-1">
                    郵遞區號
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    placeholder="3~5碼"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono text-center focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-400" />
                    <span>紙本發票掛號寄送地址 *</span>
                  </label>
                  <input
                    type="text"
                    placeholder="請填寫縣市、行政區與門牌樓層"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded-lg">
                ※ 宇沛實業股份有限公司將於交易完成後 3 個工作天內開立發票，並掛號寄達上述通訊地址。
              </p>
            </div>

            {/* 法律第一層防護：結帳前強制勾選免責條款 */}
            <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  我已年滿 18 歲，且已詳閱並充分理解
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLegalModal(true);
                    }}
                    className="text-amber-300 hover:text-amber-200 underline font-semibold mx-1 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    《宇沛實業命理解析服務免責聲明》
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                  與《服務條款》。我了解本報告為傳統民俗哲理與心靈指引，並非醫療、法律或特定金融投資依據。
                </span>
              </label>
            </div>

            {/* 錯誤訊息 */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 前往綠界收銀台安全付款按鈕 */}
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing || !agreedToTerms}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-950/50 text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Zap className="w-4 h-4 animate-spin" />
                  <span>正在安全轉接綠界 ECPay 官方收銀台...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>前往綠界科技官方收銀台實質支付 NT$ {price} 元</span>
                </>
              )}
            </button>

            {/* 安全信任條 */}
            <div className="text-center pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>宇沛實業股份有限公司・綠界科技 256-bit SSL 交易加密・發票合法開立</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
