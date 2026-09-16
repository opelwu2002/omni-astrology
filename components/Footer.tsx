import React, { useState } from 'react';
import { ShieldCheck, Phone, Mail, MapPin, Building2, Sun, Moon, Scale } from 'lucide-react';
import LegalDisclaimerModal from '@/components/LegalDisclaimerModal';
import { LEGAL_TERMS } from '@/data/legalTerms';

export default function Footer() {
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/95 text-slate-400 text-xs mt-auto">
      {/* 完整法務條款 Modal */}
      <LegalDisclaimerModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* 頂部快速標語 */}
      <div className="border-b border-slate-800/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              八字與紫微真太陽時校準
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              西洋占星 UTC 精確天文曆
            </span>
          </div>

          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>企業級高精度中西命理演算引擎・隱私嚴密加密守護</span>
          </div>
        </div>
      </div>

      {/* 核心公司資訊與版權宣告 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* 左側：品牌名稱與願景 */}
          <div className="md:col-span-5 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                Ω
              </div>
              <h4 className="font-extrabold text-white text-sm tracking-wide">
                Omni-Astrology 四合一全方位命理平台
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed pr-4">
              融合東方八字五行、紫微斗數星曜、西洋本命星盤與畢達哥拉斯生命靈數。以科學天文曆法為基準，助您透析靈魂天賦、規避人生暗礁、把握黃金機遇。
            </p>
          </div>

          {/* 右側：公司法定登記資訊 */}
          <div className="md:col-span-7 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-[11px] space-y-2">
            <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs border-b border-slate-800 pb-1.5">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>營運機構：宇沛實業股份有限公司 (UPAY Medical Technology Corporation)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">統一編號：</span>
                <span className="text-slate-300 font-mono font-semibold">93620650</span>
              </div>

              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-500">連絡電話：</span>
                <a href="tel:0911027688" className="text-slate-300 hover:text-purple-300 font-mono">
                  0911-027-688
                </a>
              </div>

              <div className="flex items-center gap-1.5 sm:col-span-2">
                <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="text-slate-500">電子信箱：</span>
                <a href="mailto:opelwu2002@gmail.com" className="text-slate-300 hover:text-purple-300 font-mono">
                  opelwu2002@gmail.com
                </a>
              </div>

              <div className="flex items-start gap-1.5 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-slate-500">公司地址：</span>
                <span className="text-slate-300">
                  台北市松山區敦化北路207號9樓之6
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 永久免責聲明摘要條款 (法律第三層防禦) */}
        <div className="mt-6 p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>【命理解析服務免責聲明與使用責任須知】</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            本平台所提供之紫微、八字、占星與靈數分析，係基於傳統民俗統計與心理學模型之演算輸出，純供個人自我探索與休閒娛樂參考。文本與建議絕非精神醫學、法律訴訟或金融投資決策之必然依據。使用者保有完全之獨立意志與最終判斷責任。詳細規範請參閱完整條款。
          </p>
        </div>

        {/* 底部法律宣告與連結 */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <p>© 2026 西元2026年 宇沛實業股份有限公司 版權所有 All Rights Reserved.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="hover:text-purple-300 transition cursor-pointer"
            >
              服務條款
            </button>
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="hover:text-purple-300 transition cursor-pointer"
            >
              隱私權政策
            </button>
            <button
              type="button"
              onClick={() => setIsLegalModalOpen(true)}
              className="text-amber-400/90 hover:text-amber-300 font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Scale className="w-3 h-3" />
              <span>免責聲明條款</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
