'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Eye, EyeOff, RefreshCw, Building2, Phone, MapPin } from 'lucide-react';
import { TIER_KEYS, normalizeTiers } from '@/lib/constants/tiers';

export interface EditUserForm {
  email: string;
  name: string;
  company: string;
  taxId: string;
  industry: string;
  phone: string;
  address: string;
  role: string;
  status: string;
  password?: string;
  unlocked_tiers: string[]; // 例如 ['free', 'tier_199', 'tier_399', 'tier_699']
}

interface UserEditModalProps {
  isOpen: boolean;
  user: any | null;
  token?: string | null;
  onClose: () => void;
  onSaved: () => void;
  showFeedback?: (type: 'success' | 'error', message: string) => void;
}

export default function UserEditModal({
  isOpen,
  user,
  token,
  onClose,
  onSaved,
  showFeedback,
}: UserEditModalProps) {
  const [formData, setFormData] = useState<EditUserForm>({
    email: '',
    name: '',
    company: '',
    taxId: '',
    industry: '學校或研究單位',
    phone: '',
    address: '',
    role: 'user',
    status: 'active',
    password: '',
    unlocked_tiers: [],
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 彈窗開啟時初始化：取得目標使用者的權限陣列，透過雙向判斷確認是否已勾選
  useEffect(() => {
    if (user) {
      const rawTiers: string[] = user.unlocked_tiers || user.unlockedTiers || [];
      const has199 = rawTiers.includes('tier_199') || rawTiers.includes('199') || rawTiers.includes('level2');
      const has399 = rawTiers.includes('tier_399') || rawTiers.includes('399') || rawTiers.includes('synastry_addon');
      const has699 = rawTiers.includes('tier_699') || rawTiers.includes('699') || rawTiers.includes('level3');

      const initialTiers: string[] = ['free'];
      if (has199) initialTiers.push('tier_199');
      if (has399) initialTiers.push('tier_399');
      if (has699) initialTiers.push('tier_699');

      setFormData({
        email: user.email || '',
        name: user.name || '',
        company: user.company || '',
        taxId: user.taxId || user.tax_id || '',
        industry: user.industry || '學校或研究單位',
        phone: user.phone || '',
        address: user.address || '',
        role: user.role || 'user',
        status: user.status || 'active',
        password: '',
        unlocked_tiers: initialTiers,
      });
      setShowPassword(false);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  // 權限 Checkbox 獨立 Toggle 函式（杜絕 199 寫死或無法增刪）
  const handleTierToggle = (tierKey: string) => {
    setFormData((prev) => {
      const exists = prev.unlocked_tiers.includes(tierKey);
      const updatedTiers = exists
        ? prev.unlocked_tiers.filter((t) => t !== tierKey)
        : [...prev.unlocked_tiers, tierKey];
      return { ...prev, unlocked_tiers: updatedTiers };
    });
  };

  // 送出儲存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const authToken =
      token ||
      (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '') ||
      '';

    try {
      // 容錯正規化後發送
      const finalTiers = normalizeTiers(formData.unlocked_tiers);

      const payload: any = {
        email: formData.email,
        targetUserId: user.id || formData.email,
        id: user.id,
        name: formData.name.trim(),
        company: formData.company.trim(),
        taxId: formData.taxId.trim(),
        tax_id: formData.taxId.trim(),
        industry: formData.industry.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        role: formData.role,
        status: formData.status,
        unlocked_tiers: finalTiers,
        unlockedTiers: finalTiers,
      };

      if (formData.password && formData.password.trim().length >= 6) {
        payload.password = formData.password.trim();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/admin/users/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (showFeedback) {
          showFeedback('success', `會員「${formData.name}」資料與權限已成功儲存！`);
        }
        onSaved();
        onClose();
      } else {
        const errorMsg = data.error || '儲存失敗';
        if (showFeedback) showFeedback('error', errorMsg);
        alert(errorMsg);
      }
    } catch (err: any) {
      console.error('[UserEditModal] 儲存失敗:', err);
      if (showFeedback) showFeedback('error', '網路連線異常，請稍後再試');
      alert('網路連線異常，請稍後再試');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        {/* 彈窗標題 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              編修會員資料與企業資訊
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              帳號：{formData.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none p-1 rounded transition"
          >
            ✕
          </button>
        </div>

        {/* 表單內容 */}
        <form onSubmit={handleSave} className="space-y-3.5">
          {/* 姓名 */}
          <div>
            <label className="text-xs text-slate-300 mb-1 block font-medium">姓名</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              placeholder="請輸入會員姓名"
            />
          </div>

          {/* 密碼重設 (可選) */}
          <div>
            <label className="text-xs text-slate-300 mb-1 block font-medium">
              重設登入密碼 (若不修改請留空)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="留空表示保持原密碼不變"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 身分角色 與 帳號狀態 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block font-medium">身分角色</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="user">一般會員 (User)</option>
                <option value="admin">系統管理員 (Admin)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block font-medium">帳號狀態</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="active">正常運作 (Active)</option>
                <option value="suspended">停權凍結 (Suspended)</option>
              </select>
            </div>
          </div>

          {/* 企業機構 與 統一編號 */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="text-xs text-slate-300 mb-1 flex items-center gap-1 font-medium">
                <Building2 className="w-3 h-3 text-amber-400" />
                企業機構
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="如：中央研究院"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block font-medium">統一編號</label>
              <input
                type="text"
                value={formData.taxId}
                maxLength={8}
                onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                placeholder="8 碼統一編號，如：03811209"
              />
            </div>
          </div>

          {/* 行業分類 */}
          <div>
            <label className="text-xs text-slate-300 mb-1 block font-medium">行業分類</label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="學校或研究單位">學校或研究單位</option>
              <option value="製造業">製造業</option>
              <option value="服務業">服務業</option>
              <option value="金融與專業諮詢">金融與專業諮詢</option>
              <option value="其他">其他</option>
            </select>
          </div>

          {/* 電話 與 通訊地址 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 flex items-center gap-1 font-medium">
                <Phone className="w-3 h-3 text-amber-400" />
                聯絡電話
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                placeholder="如：0932122156"
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 flex items-center gap-1 font-medium">
                <MapPin className="w-3 h-3 text-amber-400" />
                通訊地址
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                placeholder="如：台北市南港區研究院路二段128號"
              />
            </div>
          </div>

          {/* 解鎖權限方案調整 */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-300 mb-2 block font-medium">
              解鎖權限方案調整 (可多選或完全清空)
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {/* 初階解析 199 */}
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formData.unlocked_tiers.includes('tier_199') || formData.unlocked_tiers.includes('199')
                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.unlocked_tiers.includes('tier_199') || formData.unlocked_tiers.includes('199')}
                  onChange={() => handleTierToggle('tier_199')}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0"
                />
                <span className="font-medium">初階解析 (199)</span>
              </label>

              {/* 雙人合盤 399 */}
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formData.unlocked_tiers.includes('tier_399') || formData.unlocked_tiers.includes('399')
                    ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.unlocked_tiers.includes('tier_399') || formData.unlocked_tiers.includes('399')}
                  onChange={() => handleTierToggle('tier_399')}
                  className="rounded border-slate-700 text-purple-500 focus:ring-0"
                />
                <span className="font-medium">雙人合盤 (399)</span>
              </label>

              {/* 高階終身 699 */}
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                  formData.unlocked_tiers.includes('tier_699') || formData.unlocked_tiers.includes('699')
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.unlocked_tiers.includes('tier_699') || formData.unlocked_tiers.includes('699')}
                  onChange={() => handleTierToggle('tier_699')}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                />
                <span className="font-medium">高階終身 (699)</span>
              </label>
            </div>
          </div>

          {/* 按鈕群 */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs disabled:opacity-50 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow disabled:opacity-50 flex items-center gap-1.5 transition"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>儲存變更中...</span>
                </>
              ) : (
                <span>儲存變更</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
