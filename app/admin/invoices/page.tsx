'use client';

/**
 * 紙本發票出貨與郵寄專屬管理面板 (/admin/invoices)
 * 宇沛實業股份有限公司・稅務出貨離線閉環專用
 * 包含：五階段狀態機流轉、收件資料隨時修改、一鍵複製寄件資料、UTF-8 BOM CSV 匯出
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { Order, InvoiceStatus, InvoiceType } from '@/types/auth';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import {
  FileText,
  ArrowLeft,
  RefreshCw,
  Copy,
  Check,
  Send,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Download,
  MapPin,
  Edit3,
  ShieldCheck,
  Users,
  Lock,
  Plus,
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  const [mounted, setMounted] = useState(false);
  const [invoicesList, setInvoicesList] = useState<Order[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<
    'all' | 'pending' | 'issued' | 'ready_to_ship' | 'shipped' | 'completed'
  >('all');
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // 手動開立發票 Modal 狀態
  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    orderNumber: '',
    type: 'personal' as InvoiceType,
    buyerTitle: '',
    taxId: '',
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    amount: 199,
    note: '',
  });

  // 編輯發票 Modal 狀態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editFormData, setEditFormData] = useState({
    type: 'personal' as InvoiceType,
    buyerTitle: '',
    taxId: '',
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
  });

  // 管理員專屬直接登入表單狀態
  const [adminAccount, setAdminAccount] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('omni_admin_auth');
      if (cached === 'true') {
        setIsAdminAuthenticated(true);
      }
    }
  }, [checkAuth]);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // 讀取紙本發票出貨清單
  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setInvoicesList(data.invoices);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (mounted && (isAdminAuthenticated || user?.role === 'admin') && token) {
      fetchInvoices();
    }
  }, [mounted, isAdminAuthenticated, user, token, fetchInvoices]);

  // 發票五階段作業狀態機推進
  const handleUpdateInvoiceStage = async (
    orderNumber: string,
    nextStatus: InvoiceStatus,
    trackingNum?: string
  ) => {
    if (!token) return;
    const trackingNumber =
      trackingNum !== undefined ? trackingNum : trackingInputs[orderNumber] || '';
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber,
          invoiceStatus: nextStatus,
          trackingNumber,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', data.message || '發票狀態已推進');
        fetchInvoices();
      } else {
        showFeedback('error', data.error || '推進狀態失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 開啟編輯 Modal
  const openEditModal = (order: Order) => {
    if (!order.invoice) return;
    setEditingOrder(order);
    setEditFormData({
      type: order.invoice.type || 'personal',
      buyerTitle: order.invoice.buyerTitle || '',
      taxId: order.invoice.taxId || '',
      recipientName: order.invoice.recipientName || '',
      recipientPhone: order.invoice.recipientPhone || '',
      postalCode: order.invoice.postalCode || '',
      address: order.invoice.address || '',
    });
    setIsEditModalOpen(true);
  };

  // 儲存發票修改
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingOrder) return;
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: editingOrder.orderNumber,
          invoiceData: editFormData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', '發票寄送資料已成功儲存更新！');
        setIsEditModalOpen(false);
        setEditingOrder(null);
        fetchInvoices();
      } else {
        showFeedback('error', data.error || '修改失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 一鍵複製收件人完整寄送資訊
  const handleCopyRecipient = (order: Order) => {
    if (!order.invoice) return;
    const inv = order.invoice;
    const text = `收件人：${inv.recipientName}\n電話：${inv.recipientPhone}\n地址：${inv.postalCode} ${inv.address}\n抬頭統編：${inv.buyerTitle || '個人'} ${inv.taxId || ''}\n訂單編號：${order.orderNumber}`;
    navigator.clipboard.writeText(text);
    setCopiedInvoiceId(order.id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
    showFeedback('success', '已複製收件資訊至剪貼簿！');
  };

  // 批次匯出發票寄送清單 CSV (UTF-8 BOM 防止亂碼)
  const handleExportCSV = () => {
    if (invoicesList.length === 0) {
      showFeedback('error', '無發票資料可供匯出');
      return;
    }

    const headers = [
      '訂單編號',
      '發票狀態',
      '發票類型',
      '買受人抬頭',
      '統一編號',
      '收件人姓名',
      '收件人電話',
      '郵遞區號',
      '完整收件地址',
      '掛號單號',
      '購買方案',
      '金額',
      '訂單時間',
    ];

    const rows = invoicesList.map((order) => {
      const inv = order.invoice!;
      const statusMap: Record<string, string> = {
        pending: '待開立',
        issued: '已開立',
        ready_to_ship: '待寄出',
        shipped: '已寄出',
        completed: '已完成/已簽收',
      };
      const typeMap: Record<string, string> = {
        personal: '二聯式個人',
        individual: '二聯式個人',
        company: '三聯式公司',
      };
      const dateStr = new Date(order.createdAt).toLocaleString('zh-TW', {
        timeZone: 'Asia/Taipei',
      });

      return [
        `"${order.orderNumber}"`,
        `"${statusMap[inv.status] || inv.status}"`,
        `"${typeMap[inv.type] || inv.type}"`,
        `"${(inv.buyerTitle || '').replace(/"/g, '""')}"`,
        `"${inv.taxId || ''}"`,
        `"${inv.recipientName.replace(/"/g, '""')}"`,
        `"\t${inv.recipientPhone}"`,
        `"\t${inv.postalCode}"`,
        `"${inv.address.replace(/"/g, '""')}"`,
        `"${inv.trackingNumber || ''}"`,
        `"${order.tierName.replace(/"/g, '""')}"`,
        order.amount,
        `"${dateStr}"`,
      ].join(',');
    });

    const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `宇沛實業_紙本發票出貨清單_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', '發票清單 CSV 匯出完成！');
  };

  // 手動新建獨立發票單
  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newInvoiceData),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', '紙本發票開立成功！');
        setIsCreateInvoiceModalOpen(false);
        setNewInvoiceData({
          orderNumber: '',
          type: 'personal',
          buyerTitle: '',
          taxId: '',
          recipientName: '',
          recipientPhone: '',
          postalCode: '',
          address: '',
          amount: 199,
          note: '',
        });
        fetchInvoices();
      } else {
        showFeedback('error', data.error || '開立發票失敗');
      }
    } catch {
      showFeedback('error', '網路連線異常');
    }
  };

  // 管理員專屬直接登入表單（硬編碼絕對優先放行 admin / Opel6439）
  const handleAdminDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginLoading(true);
    setAdminLoginError('');

    const enteredUser = (adminAccount || '').trim();
    const enteredPass = (adminPassword || '').trim();

    // 【第一優先強制硬編碼放行，不依賴外部資料庫或複雜雜湊】
    if (
      (enteredUser === 'admin' || enteredUser === 'opelwu2002@gmail.com') &&
      enteredPass === 'Opel6439'
    ) {
      const masterAdminUser = {
        id: 'admin-master-001',
        email: 'opelwu2002@gmail.com',
        name: '吳俊彥',
        role: 'admin' as const,
        status: 'active' as const,
        unlockedTiers: ['free', 'level2', 'level3', 'synastry_addon'] as any[],
        createdAt: 1700000000000,
        lastLoginAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('omni_admin_auth', 'true');
        localStorage.setItem('admin_user', 'admin');
        localStorage.setItem('auth_token', 'omni-master-admin-token');
      }

      useAuthStore.getState().setAuth(masterAdminUser, 'omni-master-admin-token');
      setIsAdminAuthenticated(true);
      setAdminLoginLoading(false);

      // 非同步請求伺服器標準 JWT 權杖
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: enteredUser,
            account: enteredUser,
            email: enteredUser,
            password: enteredPass,
          }),
        });
        const data = await res.json();
        if (data.success && data.user && data.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.token);
          }
          useAuthStore.getState().setAuth(data.user, data.token);
        }
      } catch {
        // 離線備援
      }
      return;
    }

    // 一般管理員帳號驗證
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: enteredUser,
          account: enteredUser,
          email: enteredUser,
          password: enteredPass,
        }),
      });
      const data = await res.json();
      if (data.success && data.user && data.token) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', data.token);
          if (data.user.role === 'admin') {
            localStorage.setItem('omni_admin_auth', 'true');
            localStorage.setItem('admin_user', data.user.email);
          }
        }
        useAuthStore.getState().setAuth(data.user, data.token);
        setIsAdminAuthenticated(true);
      } else {
        setAdminLoginError(data.error || '管理者帳號或密碼錯誤');
      }
    } catch {
      setAdminLoginError('伺服器連線異常，請稍後再試');
    } finally {
      setAdminLoginLoading(false);
    }
  };

  // 安全鎖定並登出後台
  const handleAdminLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omni_admin_auth');
      localStorage.removeItem('admin_user');
      localStorage.removeItem('auth_token');
    }
    useAuthStore.getState().logout();
    setIsAdminAuthenticated(false);
  };

  // 依條件篩選
  const filteredInvoices = useMemo(() => {
    return invoicesList.filter((order) => {
      if (!order.invoice) return false;
      if (invoiceFilter === 'all') return true;
      return order.invoice.status === invoiceFilter;
    });
  }, [invoicesList, invoiceFilter]);

  if (!mounted) return null;

  const isAuthedAsAdmin = isAdminAuthenticated || (user && user.role === 'admin');

  if (!isAuthedAsAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <span className="font-bold text-lg text-amber-300">
              紙本發票作業管理安全入口
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> 返回首頁
          </Link>
        </header>

        <main className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">管理員身分認證</h2>
              <p className="text-slate-400 text-xs mt-1">
                發票物流管理涉及消費者隱私與公司財務，請先驗證管理憑證
              </p>
            </div>

            {adminLoginError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminDirectLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  管理者帳號
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Users className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={adminAccount}
                    onChange={(e) => setAdminAccount(e.target.value)}
                    placeholder="請輸入管理者帳號"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  管理者安全金鑰 (密碼)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="請輸入管理密碼"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={adminLoginLoading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {adminLoginLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    安全驗證中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    解鎖發票作業管理
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
        <Footer />
        <AuthModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950">
      {/* 頂部全域通知 */}
      {feedbackMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border text-sm animate-in fade-in slide-in-from-top-4 duration-200 ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* 頂部導覽 */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white">
                紙本發票出貨與郵寄物流面板
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono font-semibold">
                五階段狀態機
              </span>
            </div>
            <p className="text-xs text-slate-400">
              宇沛實業股份有限公司・營運財務離線掛號閉環中心
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>重新整理</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 border border-amber-500/30 transition font-semibold"
          >
            <span>返回總後台</span>
          </Link>
          <button
            onClick={handleAdminLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 hover:bg-rose-500/20 transition"
            title="安全鎖定後台並登出"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>鎖定登出</span>
          </button>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>首頁</span>
          </Link>
        </div>
      </header>

      {/* 主體區塊 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 space-y-6">
        {/* 五階段作業流程圖解導引 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            紙本發票作業生命週期標準規範
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 text-amber-300">
              <div className="font-bold">1. 待開立 (Pending)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">綠界入帳後自動生成</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-blue-300">
              <div className="font-bold">2. 已開立 (Issued)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">手寫/三聯開立完成</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-purple-500/30 text-purple-300">
              <div className="font-bold">3. 待寄出 (Ready)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">封裝於信封等待寄送</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-emerald-300">
              <div className="font-bold">4. 已寄出 (Shipped)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">記錄郵局掛號單號</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-300">
              <div className="font-bold">5. 已完成 (Done)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">送達簽收並歸檔結案</div>
            </div>
          </div>
        </div>

        {/* 篩選與批次匯出操作列 */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: '全部發票' },
              { id: 'pending', label: '1. 待開立' },
              { id: 'issued', label: '2. 已開立' },
              { id: 'ready_to_ship', label: '3. 待寄出' },
              { id: 'shipped', label: '4. 已寄出' },
              { id: 'completed', label: '5. 已完成' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setInvoiceFilter(st.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                  invoiceFilter === st.id
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

              <button
                onClick={() => setIsCreateInvoiceModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ 手動開立發票單</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition shadow"
              >
                <Download className="w-4 h-4" />
                <span>匯出今日待寄送清單 (CSV)</span>
              </button>
            </div>

        {/* 發票卡片列表 */}
        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
              目前無此狀態之紙本發票
            </div>
          ) : (
            filteredInvoices.map((order) => {
              const inv = order.invoice!;
              return (
                <div
                  key={order.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur hover:border-slate-700 transition"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* 左側：客戶與發票收件核心資料 */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 text-sm">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            inv.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : inv.status === 'issued'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : inv.status === 'ready_to_ship'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : inv.status === 'shipped'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {inv.status === 'pending'
                            ? '待開立'
                            : inv.status === 'issued'
                            ? '已開立 (待裝封)'
                            : inv.status === 'ready_to_ship'
                            ? '待寄出 (已封裝)'
                            : inv.status === 'shipped'
                            ? '已寄出 (掛號在途)'
                            : '已完成/已簽收'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          NT$ {order.amount} ({order.tierName})
                        </span>
                        <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                          {inv.type === 'company' ? '三聯式統編' : '二聯式個人'}
                        </span>
                      </div>

                      {inv.type === 'company' && (
                        <div className="text-xs text-amber-200/90 font-mono flex items-center gap-2">
                          <span>抬頭：{inv.buyerTitle || '未填寫'}</span>
                          <span>統一編號：{inv.taxId || '未填寫'}</span>
                        </div>
                      )}

                      <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                        <span className="font-semibold text-white">
                          收件人：{inv.recipientName}
                        </span>
                        <span>電話：{inv.recipientPhone}</span>
                        <span className="text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {inv.postalCode} {inv.address}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 pt-1 font-mono">
                        <span>
                          下單：
                          {new Date(order.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                        {inv.issuedAt && (
                          <span>
                            開立：
                            {new Date(inv.issuedAt).toLocaleDateString('zh-TW')}
                          </span>
                        )}
                        {inv.trackingNumber && (
                          <span className="text-emerald-400 font-bold">
                            郵局掛號單號：{inv.trackingNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 右側：操作按鈕區 */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                      <button
                        onClick={() => handleCopyRecipient(order)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
                      >
                        {copiedInvoiceId === order.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>已複製</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>複製收件資料</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEditModal(order)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>✏️ 修改收件資料</span>
                      </button>

                      {/* 狀態流轉推進控制 */}
                      {inv.status === 'pending' && (
                        <button
                          onClick={() =>
                            handleUpdateInvoiceStage(order.orderNumber, 'issued')
                          }
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow"
                        >
                          標記為已開立
                        </button>
                      )}

                      {inv.status === 'issued' && (
                        <button
                          onClick={() =>
                            handleUpdateInvoiceStage(
                              order.orderNumber,
                              'ready_to_ship'
                            )
                          }
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition shadow"
                        >
                          標記為待寄出
                        </button>
                      )}

                      {inv.status === 'ready_to_ship' && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="填寫郵局掛號單號"
                            value={trackingInputs[order.orderNumber] || ''}
                            onChange={(e) =>
                              setTrackingInputs((prev) => ({
                                ...prev,
                                [order.orderNumber]: e.target.value,
                              }))
                            }
                            className="px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 w-36 focus:outline-none focus:border-emerald-400"
                          />
                          <button
                            onClick={() =>
                              handleUpdateInvoiceStage(
                                order.orderNumber,
                                'shipped'
                              )
                            }
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
                          >
                            確認已寄出
                          </button>
                        </div>
                      )}

                      {inv.status === 'shipped' && (
                        <button
                          onClick={() =>
                            handleUpdateInvoiceStage(
                              order.orderNumber,
                              'completed'
                            )
                          }
                          className="px-3 py-2 bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 font-bold text-xs rounded-xl transition"
                        >
                          標記已簽收完成
                        </button>
                      )}

                      {inv.status === 'completed' && (
                        <span className="px-3 py-2 bg-slate-800 text-emerald-400 text-xs rounded-xl border border-emerald-500/20 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 已結案
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 修改發票資料 Modal */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  修改發票寄送資料
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  訂單：{editingOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">發票類型</label>
                  <select
                    value={editFormData.type}
                    onChange={(e: any) =>
                      setEditFormData({ ...editFormData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="personal">二聯式個人</option>
                    <option value="company">三聯式公司統編</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">統一編號</label>
                  <input
                    type="text"
                    value={editFormData.taxId}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, taxId: e.target.value })
                    }
                    placeholder="8 碼數字"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">買受人抬頭</label>
                <input
                  type="text"
                  value={editFormData.buyerTitle}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      buyerTitle: e.target.value,
                    })
                  }
                  placeholder="公司或個人名稱"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">收件人姓名</label>
                  <input
                    type="text"
                    required
                    value={editFormData.recipientName}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        recipientName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">收件人電話</label>
                  <input
                    type="text"
                    required
                    value={editFormData.recipientPhone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        recipientPhone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">郵遞區號</label>
                  <input
                    type="text"
                    required
                    value={editFormData.postalCode}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        postalCode: e.target.value,
                      })
                    }
                    placeholder="3 或 5 碼"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">收件地址</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        address: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 手動新建發票單 Modal */}
      {isCreateInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                手動開立紙本發票單
              </h3>
              <button
                onClick={() => setIsCreateInvoiceModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">
                  綁定訂單編號 (選填，若有既有訂單請填寫)
                </label>
                <input
                  type="text"
                  value={newInvoiceData.orderNumber}
                  onChange={(e) =>
                    setNewInvoiceData({ ...newInvoiceData, orderNumber: e.target.value })
                  }
                  placeholder="例：ORD20260916ABCD (留空自動新開)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">發票類型</label>
                  <select
                    value={newInvoiceData.type}
                    onChange={(e: any) =>
                      setNewInvoiceData({ ...newInvoiceData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="personal">二聯式個人</option>
                    <option value="company">三聯式公司統編</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">統一編號</label>
                  <input
                    type="text"
                    value={newInvoiceData.taxId}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, taxId: e.target.value })
                    }
                    placeholder="8 碼數字"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">買受人抬頭</label>
                <input
                  type="text"
                  value={newInvoiceData.buyerTitle}
                  onChange={(e) =>
                    setNewInvoiceData({ ...newInvoiceData, buyerTitle: e.target.value })
                  }
                  placeholder="公司抬頭或個人名稱"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">收件人姓名</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.recipientName}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, recipientName: e.target.value })
                    }
                    placeholder="姓名"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">收件人電話</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.recipientPhone}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, recipientPhone: e.target.value })
                    }
                    placeholder="0900-000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">郵遞區號</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.postalCode}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, postalCode: e.target.value })
                    }
                    placeholder="3 或 5 碼"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">收件地址</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceData.address}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, address: e.target.value })
                    }
                    placeholder="縣市區路街門牌樓層"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">發票開立金額</label>
                  <input
                    type="number"
                    value={newInvoiceData.amount}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, amount: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">開立備註</label>
                  <input
                    type="text"
                    value={newInvoiceData.note}
                    onChange={(e) =>
                      setNewInvoiceData({ ...newInvoiceData, note: e.target.value })
                    }
                    placeholder="備註"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateInvoiceModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  確認開立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <AuthModal />
    </div>
  );
}
