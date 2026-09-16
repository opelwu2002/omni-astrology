'use client';

/**
 * 官方命理解析服務免責聲明與使用條款 Modal (LegalDisclaimerModal.tsx)
 * 宇沛實業股份有限公司官方最高規格法務條款全屏閱讀組件
 */
import React from 'react';
import { X, ShieldAlert, Building2, Scale, CheckCircle2 } from 'lucide-react';
import { LEGAL_TERMS } from '@/data/legalTerms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAgree?: () => void; // 結帳情境時支援直接「同意並關閉」
}

export default function LegalDisclaimerModal({ isOpen, onClose, onAgree }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[90dvh] flex flex-col bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl overflow-hidden text-slate-200">
        {/* 頂部標題列 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>{LEGAL_TERMS.companyName}・服務免責與使用條款</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                法定統編：{LEGAL_TERMS.taxId}・生效日期：{LEGAL_TERMS.effectiveDate}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 中間滾動條文內容區 */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans scrollbar-thin">
          {/* 醒目警語卡 */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              重要法務告知與風險認知提醒：
            </span>
            <p className="leading-relaxed">
              您在點擊購買、訂閱或使用本平台任何服務前，請務必詳細審閱下列條款。當您進入結帳程序、勾選同意或繼續瀏覽報告時，即視為您已完全理解並同意本合約之所有約束。
            </p>
          </div>

          {/* 各章節條款 */}
          {LEGAL_TERMS.sections.map((sec, idx) => (
            <div key={idx} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
              <h4 className="font-bold text-purple-300 text-xs sm:text-sm flex items-center gap-1.5">
                <span>{sec.title}</span>
              </h4>
              <p className="whitespace-pre-line text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                {sec.content}
              </p>
            </div>
          ))}

          {/* 公司基本法務聯絡底欄 */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-2 text-slate-300 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-purple-400" />
              <span>營運機構：{LEGAL_TERMS.companyName} ({LEGAL_TERMS.companyEngName})</span>
            </div>
            <div>統一編號：{LEGAL_TERMS.taxId}</div>
            <div>通訊地址：{LEGAL_TERMS.address}</div>
            <div>法務與客服信箱：{LEGAL_TERMS.contactEmail}</div>
            <div>官方服務專線：{LEGAL_TERMS.contactPhone}</div>
          </div>
        </div>

        {/* 底部確認按鈕 */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            宇沛實業股份有限公司 版權所有 All Rights Reserved.
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              關閉
            </button>
            {onAgree && (
              <button
                type="button"
                onClick={() => {
                  onAgree();
                  onClose();
                }}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>我已完全理解並同意此條款</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
