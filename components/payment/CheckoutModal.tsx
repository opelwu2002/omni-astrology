'use client';

/**
 * 商業級金流收銀台對話框組件 (CheckoutModal)
 * 包含：
 * 1. 法律第一層防護：結帳前強制勾選《宇沛實業命理解析服務免責聲明》
 * 2. 稅法合規：線上下單離線紙本發票郵寄資料收集（二聯式/三聯式統編抬頭、掛號寄送地址電話）
 * 3. 綠界科技 ECPay 正式金流跳轉（自動生成加密 CheckMacValue 表單送出）
 * 4. 快速沙盒模擬付款切換
 */
import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import { InvoiceType } from '@/types/auth';
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
  Mail,
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

// 台灣統一編號 8 碼檢核公式
function isValidTaiwanTaxId(taxId: string): boolean {
  if (!/^\d{8}$/.test(taxId)) return false;
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const prod = parseInt(taxId[i], 10) * weights[i];
    sum += Math.floor(prod / 10) + (prod % 10);
  }
  if (sum % 10 === 0) return true;
  // 若第 7 位是 7，可容許替代判斷
  if (taxId[6] === '7' && (sum + 1) % 10 === 0) return true;
  return false;
}

export default function CheckoutModal({
  isOpen,
  tier,
  tierName,
  price,
  originalPrice,
  features,
  onClose,
  onSuccess,
}: Props) {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);

  // 支付管道：預設為綠界 ECPay 金流
  const [paymentMethod, setPaymentMethod] = useState<'ecpay' | 'credit_card' | 'line_pay' | 'jko_pay'>('ecpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 法律第一層防護：免責聲明與服務條款強制勾選
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);

  // 紙本發票郵寄資料
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('individual');
  const [buyerTitle, setBuyerTitle] = useState('');
  const [taxId, setTaxId] = useState('');
  const [recipientName, setRecipientName] = useState(currentUser?.name || '');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  // 驗證表單
  const validateForm = (): boolean => {
    if (!agreedToTerms) {
      setErrorMsg('請先閱讀並勾選同意《宇沛實業命理解析服務免責聲明》與《服務條款》');
      return false;
    }
    if (!recipientName.trim()) {
      setErrorMsg('請填寫紙本發票收件人姓名');
      return false;
    }
    if (!recipientPhone.trim() || !/^09\d{8}$|^0\d{1,2}\d{6,8}$/.test(recipientPhone.replace(/[-\s]/g, ''))) {
      setErrorMsg('請填寫有效的收件人聯絡電話（如：0912345678）');
      return false;
    }
    if (!address.trim() || address.length < 5) {
      setErrorMsg('請填寫完整之郵寄收件地址以利紙本發票寄達');
      return false;
    }
    if (invoiceType === 'company') {
      if (!buyerTitle.trim()) {
        setErrorMsg('三聯式發票請輸入公司買受人抬頭');
        return false;
      }
      if (!taxId.trim() || !isValidTaiwanTaxId(taxId.trim())) {
        setErrorMsg('三聯式發票請輸入有效之 8 碼公司統一編號');
        return false;
      }
    }
    return true;
  };

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

    // 1. 若選擇綠界科技金流
    if (paymentMethod === 'ecpay') {
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

        // 動態產生 Form 表單並 POST 跳轉至綠界官方收銀台
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
        setErrorMsg(err?.message || '前往綠界金流異常，請稍後重試');
        setIsProcessing(false);
      }
      return;
    }

    // 2. 快速體驗/沙盒測試通道 (LINE Pay / 信用卡模擬 / 街口支付)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          tier,
          tierName,
          amount: price,
          paymentMethod,
          invoice: invoicePayload,
          agreedToTerms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsPaidSuccess(true);
        setTimeout(() => {
          onSuccess(tier);
          onClose();
          setIsPaidSuccess(false);
        }, 1800);
      } else {
        setErrorMsg(data.error || '付款失敗');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || '金流伺服器連線異常');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* 獨立免責條款全文彈窗 */}
      <LegalDisclaimerModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none overflow-y-auto">
        <div className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl p-5 sm:p-7 text-slate-100 my-8 max-h-[92vh] overflow-y-auto">
          {/* 關閉按鈕 */}
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 頂部商品標題 */}
          <div className="flex items-center gap-3 pb-3 mb-4 border-b border-slate-800">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-lg shadow-purple-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{tierName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  官方正版
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                宇沛實業股份有限公司・法規稅務保障與紙本發票寄送
              </p>
            </div>
          </div>

          {isPaidSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-white">付款與權限解鎖成功！</h4>
              <p className="text-xs text-emerald-300">
                已為您解鎖【{tierName}】全部專屬內容，紙本發票將於 3 個工作日內掛號寄出。
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 包含特色清單 */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="font-semibold text-purple-300 block text-[11px] mb-1">
                  報告解鎖權益包括：
                </span>
                {features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {/* 價格方案展示 */}
              <div className="p-3.5 bg-gradient-to-r from-purple-950/40 to-slate-950 rounded-xl border border-purple-500/30 flex items-baseline justify-between">
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
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5" />
                  現折 NT$ {originalPrice - price} 元
                </span>
              </div>

              {/* 支付管道選擇 */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>選擇金流方式</span>
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'ecpay' as const, name: '綠界科技 ECPay', desc: '信用卡 3D/ATM/超商 (推薦)', isHot: true },
                    { id: 'line_pay' as const, name: 'LINE Pay 快速體驗', desc: '沙盒模擬極速通行' },
                    { id: 'credit_card' as const, name: '信用卡極速通道', desc: 'Visa / MasterCard' },
                    { id: 'jko_pay' as const, name: '街口支付體驗', desc: '快速解鎖體驗' },
                  ].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition relative ${
                        paymentMethod === item.id
                          ? 'bg-purple-950/50 border-purple-400 shadow-md shadow-purple-900/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {item.isHot && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-bold">
                          官方金流
                        </span>
                      )}
                      <span className="font-bold text-white block text-xs">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 紙本發票郵寄資料收集模組 (稅法合規) */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>紙本發票開立與寄送資訊（宇沛實業依法開立）</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('individual')}
                      className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                        invoiceType === 'individual'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      二聯式 (個人)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvoiceType('company')}
                      className={`px-2 py-0.5 rounded-md transition font-medium cursor-pointer ${
                        invoiceType === 'company'
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      三聯式 (公司統編)
                    </button>
                  </div>
                </div>

                {/* 三聯式特有欄位 */}
                {invoiceType === 'company' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-purple-400" />
                        <span>買受人抬頭 *</span>
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
                      <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-purple-400" />
                        <span>統一編號 (8碼) *</span>
                      </label>
                      <input
                        type="text"
                        maxLength={8}
                        placeholder="8 碼公司統編"
                        value={taxId}
                        onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>
                )}

                {/* 收件人姓名與手機 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-purple-400" />
                      <span>收件人真實姓名 *</span>
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
                      <span>收件人聯絡手機 *</span>
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
                      <span>紙本發票郵寄地址 *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="請填寫縣市、市區與門牌樓層"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-purple-400"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded-lg">
                  ※ 宇沛實業股份有限公司將於交易成功後 3 個工作天內，開立中華民國統一發票並以郵政平信或掛號郵寄至上述地址。
                </p>
              </div>

              {/* 法律第一層防護：結帳前強制勾選免責條款 */}
              <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-xl space-y-2">
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
                <div className="p-2.5 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 結帳確認按鈕 */}
              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing || !agreedToTerms}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-900/40 text-sm transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Zap className="w-4 h-4 animate-spin" />
                    <span>
                      {paymentMethod === 'ecpay' ? '正在轉接綠界 ECPay 收銀台...' : '安全加密結算中...'}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {paymentMethod === 'ecpay'
                        ? `前往綠界 ECPay 支付 NT$ ${price} 元`
                        : `確認支付 NT$ ${price} 元並立即解鎖`}
                    </span>
                  </>
                )}
              </button>

              {/* 安全信任條 */}
              <div className="text-center pt-1 text-[11px] text-slate-500 flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>宇沛實業股份有限公司・256-bit SSL 交易加密・發票合法開立</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

