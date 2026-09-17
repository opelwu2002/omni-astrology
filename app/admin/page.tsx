'use client';

/**
 * Omni-Astrology 四合一中西命理平台 - 企業級營運戰情室與發票物流聯動後台 (Enterprise Admin Suite)
 * 包含：
 * 1. 📊 BI 數據戰情室（4大關鍵指標、7日營收走勢圖、方案佔比）
 * 2. 👥 會員深度管理（搜尋篩選、CRUD、密碼重設、解鎖權限調整）
 * 3. 💳 訂單與金流對帳（離線手動補單、修改金額、退款自動收回權限）
 * 4. 📦 紙本發票與掛號物流中心（五階段狀態機、手動開立發票單、資料修改、UTF-8 BOM CSV 匯出）
 * 5. 🛡️ 系統操作稽核日誌（敏感操作內控紀錄）
 * 6. ⚙️ 金流與系統設定（綠界 Sandbox/Production 切換、特店金鑰動態維護、Webhook Log Viewer）
 * 7. 🗄️ 命理文本庫熱更新
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  UserSafe,
  SystemStats,
  Order,
  InvoiceStatus,
  InvoiceInfo,
  AuditLog,
  UnlockTier,
  InvoiceType,
  PaymentConfig,
  WebhookLog,
} from '@/types/auth';
import Footer from '@/components/Footer';
import AuthModal from '@/components/auth/AuthModal';
import {
  ShieldCheck,
  Users,
  BarChart3,
  Database,
  ArrowLeft,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Lock,
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Mail,
  MapPin,
  Phone,
  Copy,
  Check,
  Send,
  Building,
  Plus,
  Edit3,
  Search,
  Download,
  Filter,
  History,
  KeyRound,
  Eye,
  EyeOff,
  PackageCheck,
  Truck,
  RotateCcw,
  Sparkles,
  Settings,
  Terminal,
  Server,
  Key,
} from 'lucide-react';

export default function AdminPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const setAuthModalOpen = useAuthStore((state) => state.setAuthModalOpen);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'stats' | 'users' | 'orders' | 'invoices' | 'audit_logs' | 'payment' | 'database'
  >('stats');

  // 管理員專屬直接登入表單狀態
  const [adminAccount, setAdminAccount] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);

  // 後台數據狀態
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [usersList, setUsersList] = useState<UserSafe[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [invoicesList, setInvoicesList] = useState<Order[]>([]);
  const [auditLogsList, setAuditLogsList] = useState<AuditLog[]>([]);

  // 金流設定與 Webhook 狀態
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    mode: 'sandbox',
    merchantId: '3456197',
    hashKey: 'RttngL4823khpLRX',
    hashIV: 'skQe3yMoSOuyMxRO',
    updatedAt: Date.now(),
  });
  const [webhookLogsList, setWebhookLogsList] = useState<WebhookLog[]>([]);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);

  // 篩選與搜尋狀態
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'user' | 'admin'>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<
    'all' | 'pending' | 'issued' | 'ready_to_ship' | 'shipped' | 'completed'
  >('all');
  const [auditLogSearchQuery, setAuditLogSearchQuery] = useState('');

  // 複製與單號輸入狀態
  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  // 資料庫文本編輯狀態
  const [selectedDbFile, setSelectedDbFile] = useState('numerology_db.json');
  const [dbContent, setDbContent] = useState('');
  const [dbSavedMessage, setDbSavedMessage] = useState('');

  // 全域通知與加載狀態
  const [loading, setLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Modal 控制狀態
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSafe | null>(null);

  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [isEditOrderAmountModalOpen, setIsEditOrderAmountModalOpen] = useState(false);
  const [editingAmountOrder, setEditingAmountOrder] = useState<Order | null>(null);
  const [newOrderAmount, setNewOrderAmount] = useState<number>(0);
  const [newOrderNote, setNewOrderNote] = useState<string>('');

  const [isCreateInvoiceModalOpen, setIsCreateInvoiceModalOpen] = useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [editingInvoiceOrder, setEditingInvoiceOrder] = useState<Order | null>(null);

  // 新增會員表單
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'admin',
    status: 'active' as 'active' | 'suspended',
    unlockedTiers: ['free'] as UnlockTier[],
  });

  // 編輯會員表單
  const [editUserData, setEditUserData] = useState({
    name: '',
    role: 'user' as 'user' | 'admin',
    status: 'active' as 'active' | 'suspended',
    password: '',
    unlockedTiers: ['free'] as UnlockTier[],
  });

  // 新增人工訂單表單
  const [newOrderData, setNewOrderData] = useState({
    userEmail: '',
    tier: 'level2' as UnlockTier,
    tierName: '初階事業與情感財富深度解析',
    amount: 199,
    paymentMethod: 'atm' as 'atm' | 'line_pay' | 'jko_pay' | 'credit_card' | 'manual',
    status: 'paid' as 'paid' | 'pending',
    hasInvoice: false,
    invoiceType: 'personal' as InvoiceType,
    buyerTitle: '',
    taxId: '',
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
    note: '',
  });

  // 手動新建獨立發票單表單
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

  // 編輯發票收件資料表單
  const [editInvoiceData, setEditInvoiceData] = useState<{
    type: InvoiceType;
    buyerTitle: string;
    taxId: string;
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    address: string;
  }>({
    type: 'personal',
    buyerTitle: '',
    taxId: '',
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address: '',
  });

  // 密碼可見性控制
  const [showNewUserPassword, setShowNewUserPassword] = useState(false);
  const [showEditUserPassword, setShowEditUserPassword] = useState(false);

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

  // 提示訊息計時清理
  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  // 讀取統計資料
  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 讀取會員清單
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsersList(data.users);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 讀取訂單清單
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setOrdersList(data.orders);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 讀取紙本發票清單
  const fetchInvoices = useCallback(async () => {
    if (!token) return;
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
    }
  }, [token]);

  // 讀取稽核日誌
  const fetchAuditLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/audit-logs', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAuditLogsList(data.logs);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 讀取金流設定與 Webhook 記錄
  const fetchPaymentConfig = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/payment-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        if (data.config) setPaymentConfig(data.config);
        if (data.webhookLogs) setWebhookLogsList(data.webhookLogs);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  // 讀取資料庫文本
  const fetchDbContent = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/database?file=${selectedDbFile}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDbContent(data.content);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token, selectedDbFile]);

  // 全域刷新
  const refreshAllData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchOrders(),
      fetchInvoices(),
      fetchAuditLogs(),
      fetchPaymentConfig(),
    ]).finally(() => {
      setLoading(false);
    });
  }, [fetchStats, fetchUsers, fetchOrders, fetchInvoices, fetchAuditLogs, fetchPaymentConfig]);

  useEffect(() => {
    if (mounted && (isAdminAuthenticated || user?.role === 'admin') && token) {
      refreshAllData();
    }
  }, [mounted, isAdminAuthenticated, user, token, refreshAllData]);

  useEffect(() => {
    if (activeTab === 'database' && token) {
      fetchDbContent();
    }
    if (activeTab === 'payment' && token) {
      fetchPaymentConfig();
    }
  }, [activeTab, selectedDbFile, token, fetchDbContent, fetchPaymentConfig]);

  // 管理員專屬直接登入（硬編碼絕對優先放行 admin / Opel6439）
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
      const masterAdminUser: UserSafe = {
        id: 'admin-master-001',
        email: 'opelwu2002@gmail.com',
        name: '吳俊彥',
        role: 'admin',
        status: 'active',
        unlockedTiers: ['free', 'level2', 'level3', 'synastry_addon'],
        createdAt: 1700000000000,
        lastLoginAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('omni_admin_auth', 'true');
        localStorage.setItem('admin_user', 'admin');
        localStorage.setItem('auth_token', 'omni-master-admin-token');
      }

      // 立即關閉身分驗證鎖定遮罩！
      useAuthStore.getState().setAuth(masterAdminUser, 'omni-master-admin-token');
      setIsAdminAuthenticated(true);
      setAdminLoginLoading(false);

      // 非同步打後端 API 取得正式簽發之 JWT 權杖並寫入 Cookie
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
        // 伺服器若有波動，本機已優先放行解鎖
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

  // 儲存金流參數設定
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingPaymentConfig(true);
    try {
      const res = await fetch('/api/admin/payment-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentConfig),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', '綠界金流配置已成功儲存並即時生效！');
        fetchPaymentConfig();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '儲存金流配置失敗');
      }
    } catch {
      showFeedback('error', '網路連線異常');
    } finally {
      setSavingPaymentConfig(false);
    }
  };

  // 處理新增會員
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newUserData),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `成功建立新會員：${data.user.name}`);
        setIsCreateUserModalOpen(false);
        setNewUserData({
          name: '',
          email: '',
          password: '',
          role: 'user',
          status: 'active',
          unlockedTiers: ['free'],
        });
        fetchUsers();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '新增會員失敗');
      }
    } catch {
      showFeedback('error', '伺服器網路異常');
    }
  };

  // 開啟編輯會員 Modal
  const openEditUserModal = (targetUser: UserSafe) => {
    setEditingUser(targetUser);
    setEditUserData({
      name: targetUser.name,
      role: targetUser.role,
      status: targetUser.status,
      password: '',
      unlockedTiers: targetUser.unlockedTiers || ['free'],
    });
    setIsEditUserModalOpen(true);
  };

  // 儲存編輯會員
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingUser) return;
    try {
      const payload: any = {
        targetUserId: editingUser.id,
        name: editUserData.name,
        role: editUserData.role,
        status: editUserData.status,
        unlockedTiers: editUserData.unlockedTiers,
      };
      if (editUserData.password.trim().length > 0) {
        if (editUserData.password.trim().length < 6) {
          showFeedback('error', '重設之密碼至少需 6 碼');
          return;
        }
        payload.password = editUserData.password.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `會員「${data.user.name}」資料更新成功！`);
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '更新會員失敗');
      }
    } catch {
      showFeedback('error', '網路連線異常');
    }
  };

  // 切換會員狀態 (啟用 / 停權)
  const handleToggleUserStatus = async (targetUser: UserSafe) => {
    if (!token) return;
    const newStatus = targetUser.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(
          'success',
          `會員 ${targetUser.name} 已${newStatus === 'active' ? '恢復正常使用' : '成功停權'}`
        );
        fetchUsers();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '變更狀態失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 刪除會員
  const handleDeleteUser = async (targetUser: UserSafe) => {
    if (!token) return;
    if (!confirm(`確定要永久刪除會員「${targetUser.name} (${targetUser.email})」嗎？此操作不可逆！`)) {
      return;
    }
    try {
      // 樂觀更新：立刻自畫面上移除該會員，避免視覺殘留
      setUsersList((prev: UserSafe[]) =>
        prev.filter(
          (u: UserSafe) =>
            u.id !== targetUser.id &&
            u.email.toLowerCase() !== targetUser.email.toLowerCase()
        )
      );

      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(targetUser.id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', '會員已成功刪除');
        if (Array.isArray(data.users)) {
          setUsersList(data.users);
        } else {
          fetchUsers();
        }
        fetchStats();
        fetchAuditLogs();
      } else {
        // 失敗時重新拉取名單復原
        fetchUsers();
        showFeedback('error', data.error || '刪除失敗');
      }
    } catch {
      fetchUsers();
      showFeedback('error', '網路異常');
    }
  };

  // 建立人工離線補單
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    let invoiceObj: InvoiceInfo | undefined = undefined;
    if (newOrderData.hasInvoice) {
      invoiceObj = {
        type: newOrderData.invoiceType,
        buyerTitle: newOrderData.buyerTitle || undefined,
        taxId: newOrderData.taxId || undefined,
        recipientName: newOrderData.recipientName || '客戶',
        recipientPhone: newOrderData.recipientPhone || '0900000000',
        postalCode: newOrderData.postalCode || '100',
        address: newOrderData.address || '待補寄送地址',
        status: 'pending',
      };
    }

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userEmail: newOrderData.userEmail,
          tier: newOrderData.tier,
          tierName: newOrderData.tierName,
          amount: newOrderData.amount,
          paymentMethod: newOrderData.paymentMethod,
          status: newOrderData.status,
          invoice: invoiceObj,
          note: newOrderData.note,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(
          'success',
          `訂單 ${data.order.orderNumber} 建立成功！${data.order.status === 'paid' ? '已自動解鎖權限。' : ''}`
        );
        setIsCreateOrderModalOpen(false);
        fetchOrders();
        fetchStats();
        fetchInvoices();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '建立訂單失敗');
      }
    } catch {
      showFeedback('error', '伺服器網路異常');
    }
  };

  // 開啟修改訂單金額 Modal
  const openEditAmountModal = (order: Order) => {
    setEditingAmountOrder(order);
    setNewOrderAmount(order.amount);
    setNewOrderNote(order.note || '');
    setIsEditOrderAmountModalOpen(true);
  };

  // 儲存修改訂單金額
  const handleSaveOrderAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingAmountOrder) return;
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: editingAmountOrder.orderNumber,
          action: 'amount',
          amount: newOrderAmount,
          note: newOrderNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(
          'success',
          `訂單 ${editingAmountOrder.orderNumber} 金額已成功修改為 NT$ ${newOrderAmount}`
        );
        setIsEditOrderAmountModalOpen(false);
        setEditingAmountOrder(null);
        fetchOrders();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '修改金額失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 訂單操作：標記退款（連動自動收回權限）
  const handleRefundOrder = async (order: Order) => {
    if (!token) return;
    const confirmMsg = `⚠️ 警告：退款確認！\n\n您即將把訂單「${order.orderNumber}」標記為已退款。\n\n【關鍵內控連動】：\n系統將自動撤銷會員「${order.userEmail}」對此報告（${order.tierName}）的觀看解鎖權限！\n\n確定要退款嗎？`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          action: 'refund',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `訂單 ${order.orderNumber} 退款成功，已自動收回該會員報告權限！`);
        fetchOrders();
        fetchUsers();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '退款操作失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 訂單操作：確認待付款訂單已收款
  const handleConfirmOrderPaid = async (order: Order) => {
    if (!token) return;
    if (!confirm(`確認已收到訂單「${order.orderNumber}」的款項 NT$ ${order.amount}？系統將同步解鎖會員權限。`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          action: 'status',
          status: 'paid',
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `訂單 ${order.orderNumber} 已成功確認收款，並解鎖會員權限！`);
        fetchOrders();
        fetchUsers();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '確認收款失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 訂單操作：刪除訂單 / 退款作廢
  const handleDeleteOrder = async (order: Order) => {
    if (!token) return;
    const confirmMsg = `⚠️ 警告：確定要永久刪除訂單「${order.orderNumber}」嗎？\n\n【關鍵連動】：\n此動作不可逆！若該訂單狀態為「已付款」，系統將連動收回會員「${order.userEmail}」之報告觀看權限！\n\n確定執行刪單作廢嗎？`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/admin/orders?orderNumber=${order.orderNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', `訂單 ${order.orderNumber} 已成功刪除作廢！`);
        fetchOrders();
        fetchUsers();
        fetchStats();
        fetchInvoices();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '刪除訂單失敗');
      }
    } catch {
      showFeedback('error', '網路異常，無法刪除訂單');
    }
  };

  // 手動新建獨立紙本發票單
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
        fetchOrders();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '開立發票單失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 發票五階段作業狀態推進
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
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '推進狀態失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 開啟發票與訂單資料修改 Modal (支援所有訂單補齊/修改發票)
  const openEditInvoiceModal = (order: Order) => {
    setEditingInvoiceOrder(order);
    const inv = order.invoice;
    setEditInvoiceData({
      type: inv?.type || 'personal',
      buyerTitle: inv?.buyerTitle || '',
      taxId: inv?.taxId || '',
      recipientName: inv?.recipientName || order.userEmail.split('@')[0],
      recipientPhone: inv?.recipientPhone || '0900000000',
      postalCode: inv?.postalCode || '100',
      address: inv?.address || '',
    });
    setIsEditInvoiceModalOpen(true);
  };

  // 儲存發票收件資料修改
  const handleSaveEditInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingInvoiceOrder) return;
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderNumber: editingInvoiceOrder.orderNumber,
          invoiceData: editInvoiceData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', '發票寄送資料已成功儲存更新！');
        setIsEditInvoiceModalOpen(false);
        setEditingInvoiceOrder(null);
        fetchInvoices();
        fetchOrders();
        fetchStats();
        fetchAuditLogs();
      } else {
        showFeedback('error', data.error || '修改發票資料失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 一鍵複製收件資料格式化字串
  const handleCopyShippingInfo = (order: Order) => {
    if (!order.invoice) return;
    const text = `收件人：${order.invoice.recipientName}\n電話：${order.invoice.recipientPhone}\n地址：${order.invoice.postalCode} ${order.invoice.address}\n抬頭統編：${order.invoice.buyerTitle || '個人'} ${order.invoice.taxId || ''}\n訂單編號：${order.orderNumber}`;
    navigator.clipboard.writeText(text);
    setCopiedInvoiceId(order.id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
    showFeedback('success', '已複製收件資料至剪貼簿！');
  };

  // 批次匯出發票寄送清單 CSV (帶有 UTF-8 BOM，防止 Excel 亂碼)
  const handleExportShippingCSV = () => {
    if (invoicesList.length === 0) {
      showFeedback('error', '目前無發票資料可供匯出');
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
    link.setAttribute('download', `發票出貨寄送清單_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('success', '發票出貨清單 CSV 匯出完成！');
  };

  // 儲存資料庫文本
  const handleSaveDb = async () => {
    if (!token) return;
    try {
      JSON.parse(dbContent);
    } catch {
      showFeedback('error', 'JSON 格式語法錯誤，請檢查標點符號！');
      return;
    }

    try {
      const res = await fetch(`/api/admin/database?file=${selectedDbFile}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: dbContent }),
      });
      const data = await res.json();
      if (data.success) {
        setDbSavedMessage('資料庫文本已成功儲存並即時生效！');
        setTimeout(() => setDbSavedMessage(''), 3000);
      } else {
        showFeedback('error', data.error || '儲存失敗');
      }
    } catch {
      showFeedback('error', '網路異常');
    }
  };

  // 篩選後會員清單（支援姓名、Email、公司、統編、電話、地址與行業關鍵字全面檢索）
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone && u.phone.toLowerCase().includes(q)) ||
        (u.company && u.company.toLowerCase().includes(q)) ||
        (u.taxId && u.taxId.includes(q)) ||
        (u.industry && u.industry.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q));
      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [usersList, userSearchQuery, userRoleFilter]);

  // 篩選後訂單清單
  const filteredOrders = useMemo(() => {
    return ordersList.filter((o) => {
      const matchesSearch =
        o.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
        o.userEmail.toLowerCase().includes(orderSearchQuery.toLowerCase());
      const matchesStatus =
        orderStatusFilter === 'all' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [ordersList, orderSearchQuery, orderStatusFilter]);

  // 篩選後發票清單
  const filteredInvoices = useMemo(() => {
    return invoicesList.filter((o) => {
      if (!o.invoice) return false;
      if (invoiceFilter === 'all') return true;
      return o.invoice.status === invoiceFilter;
    });
  }, [invoicesList, invoiceFilter]);

  // 篩選後稽核日誌
  const filteredAuditLogs = useMemo(() => {
    return auditLogsList.filter((log) => {
      if (!auditLogSearchQuery.trim()) return true;
      const q = auditLogSearchQuery.toLowerCase();
      return (
        log.details.toLowerCase().includes(q) ||
        log.adminEmail.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
      );
    });
  }, [auditLogsList, auditLogSearchQuery]);

  // SVG 7日走勢圖計算
  const chartData = useMemo(() => {
    if (!stats?.dailyRevenue7Days || stats.dailyRevenue7Days.length === 0) {
      return { points: '', pointsArr: [], maxAmount: 1000 };
    }
    const days = stats.dailyRevenue7Days;
    const maxAmount = Math.max(...days.map((d) => d.amount), 1000);
    const width = 500;
    const height = 160;
    const paddingX = 35;
    const paddingY = 20;

    const pointsArr = days.map((d, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / (days.length - 1);
      const y =
        height - paddingY - (d.amount / maxAmount) * (height - paddingY * 2);
      return { x, y, date: d.date, amount: d.amount, count: d.count };
    });

    const points = pointsArr.map((p) => `${p.x},${p.y}`).join(' ');
    return { points, pointsArr, maxAmount };
  }, [stats]);

  if (!mounted) return null;

  const isAuthedAsAdmin = isAdminAuthenticated || (user && user.role === 'admin');

  // 未登入或非管理員阻擋守衛
  if (!isAuthedAsAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌌</span>
            <span className="font-bold text-lg text-amber-300">
              Omni-Astrology 管理員安全沙盒
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> 返回前台首頁
          </Link>
        </header>

        <main className="max-w-md mx-auto px-4 py-12 w-full flex-1 flex flex-col justify-center">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <ShieldAlert className="w-7 h-7 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">最高管理員身分認證</h2>
              <p className="text-slate-400 text-xs mt-1">
                此專屬路徑受最高安全沙盒保護，請輸入管理者憑證以解鎖後台
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
                    驗證中...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    解鎖後台營運戰情室
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

      {/* 頂部導覽列 */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-white">
                Omni-Astrology 企業級營運戰情室
              </h1>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-mono font-semibold">
                Enterprise v2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              宇沛實業股份有限公司・營運中樞與財務物流內控管理
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={refreshAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition"
            title="手動刷新全站數據"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重新整理數據</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block">{user?.name || '吳俊彥'}</span>
            <span className="text-[10px] text-amber-400/90 font-mono block">
              {user?.email || 'opelwu2002@gmail.com'}
            </span>
          </div>
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>返回前台</span>
          </Link>
        </div>
      </header>

      {/* 主體區塊 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1">
        {/* 7 大模組頁籤切換導覽 */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-3 mb-6">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'stats'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>📊 BI 數據戰情室</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'users'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>👥 會員深度管理</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300 border border-slate-700">
              {usersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>💳 訂單金流對帳</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300 border border-slate-700">
              {ordersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'invoices'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📦 紙本發票物流</span>
            {stats && (stats.pendingInvoicesCount > 0 || stats.readyToShipInvoicesCount > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold animate-pulse">
                {stats.pendingInvoicesCount + stats.readyToShipInvoicesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'payment'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>⚙️ 金流與系統設定</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                paymentConfig.mode === 'production'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {paymentConfig.mode === 'production' ? '正式營運' : '測試沙盒'}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit_logs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'audit_logs'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>🛡️ 稽核操作日誌</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300 border border-slate-700">
              {auditLogsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'database'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>🗄️ 文本庫熱更新</span>
          </button>
        </div>

        {/* TAB 1: BI 戰情室 */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* 4 大核心 KPI 卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">總註冊會員數</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-white font-mono">
                    {stats?.totalUsers || usersList.length}
                  </span>
                  <span className="text-xs text-slate-400">人</span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded text-[11px] font-medium">
                    <TrendingUp className="w-3 h-3" />
                    +{stats?.todayNewUsers ?? 1} 今日新增
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    (成長率 +{stats?.userGrowthRate ?? 0}%)
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">平台累計總營收</span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-amber-300 font-mono">
                    NT$ {(stats?.totalRevenue ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="text-slate-400 text-[11px]">本月累計營收：</span>
                  <span className="text-amber-400 font-mono font-semibold text-[11px]">
                    NT$ {(stats?.monthlyRevenue ?? 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium">付費會員轉換率</span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono">
                    {stats?.conversionRate ?? 18}%
                  </span>
                </div>
                <div className="mt-2.5 text-[11px] text-slate-400">
                  以擁有高階/初階解鎖權限之會員佔比計算
                </div>
              </div>

              <div
                onClick={() => setActiveTab('invoices')}
                className="bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 cursor-pointer rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-medium group-hover:text-amber-300 transition">
                    待處理紙本發票
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <PackageCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-rose-400 font-mono">
                    {(stats?.pendingInvoicesCount ?? 0) + (stats?.readyToShipInvoicesCount ?? 0)}
                  </span>
                  <span className="text-xs text-slate-400">張待辦</span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                  <span className="text-amber-400 font-medium">
                    待開立：{stats?.pendingInvoicesCount ?? 0}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-blue-400 font-medium">
                    待寄出：{stats?.readyToShipInvoicesCount ?? 0}
                  </span>
                </div>
              </div>
            </div>

            {/* 圖表列：近 7 日營收走勢圖 & 各方案銷售分佈 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" />
                      近 7 日營收走勢圖 (NT$)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      每日實際入帳金額走勢與訂單成交量
                    </p>
                  </div>
                  <span className="text-xs font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    最高單日：NT$ {chartData.maxAmount.toLocaleString()}
                  </span>
                </div>

                <div className="w-full overflow-x-auto py-2">
                  <svg
                    viewBox="0 0 500 180"
                    className="w-full h-44 select-none"
                    style={{ minWidth: '400px' }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    <line x1="35" y1="20" x2="465" y2="20" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="35" y1="80" x2="465" y2="80" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                    <line x1="35" y1="140" x2="465" y2="140" stroke="#475569" strokeWidth="1" />

                    {chartData.points && (
                      <polygon points={`35,140 ${chartData.points} 465,140`} fill="url(#revenueGradient)" />
                    )}

                    {chartData.points && (
                      <polyline
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={chartData.points}
                      />
                    )}

                    {chartData.pointsArr.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4.5"
                          className="fill-amber-400 stroke-slate-950 stroke-2 hover:r-6 transition-all"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill="#fef08a"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {pt.amount > 0 ? `$${pt.amount}` : ''}
                        </text>
                        <text x={pt.x} y="160" textAnchor="middle" fill="#94a3b8" fontSize="9">
                          {pt.date}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    付費解鎖方案營收佔比
                  </h3>
                  <p className="text-xs text-slate-400 mb-4">不同階層產品營收貢獻度</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-amber-300 font-medium">⭐ NT$699 高階終身白皮書</span>
                        <span className="text-slate-300 font-mono">
                          NT$ {(stats?.tierSalesStats?.level3?.revenue ?? 0).toLocaleString()} (
                          {stats?.tierSalesStats?.level3?.count ?? 0} 筆)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.totalRevenue
                                ? Math.round(
                                    ((stats?.tierSalesStats?.level3?.revenue ?? 0) /
                                      stats.totalRevenue) *
                                      100
                                  )
                                : 75
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-blue-300 font-medium">✨ NT$199 初階個人解析</span>
                        <span className="text-slate-300 font-mono">
                          NT$ {(stats?.tierSalesStats?.level2?.revenue ?? 0).toLocaleString()} (
                          {stats?.tierSalesStats?.level2?.count ?? 0} 筆)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.totalRevenue
                                ? Math.round(
                                    ((stats?.tierSalesStats?.level2?.revenue ?? 0) /
                                      stats.totalRevenue) *
                                      100
                                  )
                                : 20
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-purple-300 font-medium">💞 NT$399 雙人合盤解鎖</span>
                        <span className="text-slate-300 font-mono">
                          NT$ {(stats?.tierSalesStats?.synastry_addon?.revenue ?? 0).toLocaleString()} (
                          {stats?.tierSalesStats?.synastry_addon?.count ?? 0} 筆)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                          style={{
                            width: `${
                              stats?.totalRevenue
                                ? Math.round(
                                    ((stats?.tierSalesStats?.synastry_addon?.revenue ?? 0) /
                                      stats.totalRevenue) *
                                      100
                                  )
                                : 5
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>累計測算總次數：</span>
                  <span className="font-mono text-white font-bold">
                    {(stats?.totalCalculations ?? 3824).toLocaleString()} 次
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 會員深度管理 */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="搜尋會員姓名或 Email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e: any) => setUserRoleFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 py-2 px-3 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">所有身分</option>
                  <option value="user">一般會員</option>
                  <option value="admin">系統管理員</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateUserModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ 新增會員</span>
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 px-4 font-semibold">會員資訊</th>
                      <th className="py-3 px-4 font-semibold">企業機構 / 統編</th>
                      <th className="py-3 px-4 font-semibold">行業分類</th>
                      <th className="py-3 px-4 font-semibold">電話 / 通訊地址</th>
                      <th className="py-3 px-4 font-semibold">身分角色</th>
                      <th className="py-3 px-4 font-semibold">帳號狀態</th>
                      <th className="py-3 px-4 font-semibold">已解鎖權限</th>
                      <th className="py-3 px-4 font-semibold">註冊時間</th>
                      <th className="py-3 px-4 font-semibold text-right">內控操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          無符合條件之會員資料
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{u.name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white font-medium">{u.company || '—'}</div>
                            {u.taxId && (
                              <div className="text-[11px] text-amber-400 font-mono">統編：{u.taxId}</div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700 rounded text-[11px] text-slate-300">
                              {u.industry || '服務業'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-slate-300 font-mono text-[11px]">{u.phone || '—'}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]" title={u.address || ''}>
                              {u.address || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                                <ShieldCheck className="w-3 h-3" />
                                管理員
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                                一般會員
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {u.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                正常
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px]">
                                停權凍結
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1">
                              {u.unlockedTiers && u.unlockedTiers.length > 0 ? (
                                u.unlockedTiers.map((t) => (
                                  <span
                                    key={t}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                      t === 'level3'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : t === 'level2'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : t === 'synastry_addon'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                        : 'bg-slate-800 text-slate-400'
                                    }`}
                                  >
                                    {t === 'level3'
                                      ? '高階終身 699'
                                      : t === 'level2'
                                      ? '初階解析 199'
                                      : t === 'synastry_addon'
                                      ? '合盤加購 399'
                                      : '免費體驗'}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-500 text-[10px]">免費體驗</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString('zh-TW')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => openEditUserModal(u)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition text-[11px] flex items-center gap-1"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                編輯
                              </button>

                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] transition flex items-center gap-1 ${
                                  u.status === 'active'
                                    ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10'
                                    : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.status === 'active' ? (
                                  <>
                                    <UserX className="w-3 h-3 text-amber-400" />
                                    停權
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3 text-emerald-400" />
                                    啟用
                                  </>
                                )}
                              </button>

                              {u.id !== user?.id && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1 hover:bg-rose-500/20 text-rose-400 border border-transparent hover:border-rose-500/40 rounded-lg transition"
                                  title="刪除會員"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 訂單金流對帳 */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="搜尋訂單編號或買家 Email..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 py-2 px-3 focus:outline-none focus:border-amber-400"
                >
                  <option value="all">所有付款狀態</option>
                  <option value="paid">已付款</option>
                  <option value="pending">待付款</option>
                  <option value="refunded">已退款</option>
                </select>
              </div>

              <button
                onClick={() => setIsCreateOrderModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-md shadow-amber-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>+ 新增離線/人工補單</span>
              </button>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 px-4 font-semibold">訂單編號</th>
                      <th className="py-3 px-4 font-semibold">買家資訊</th>
                      <th className="py-3 px-4 font-semibold">解鎖方案</th>
                      <th className="py-3 px-4 font-semibold">實付金額</th>
                      <th className="py-3 px-4 font-semibold">金流管道</th>
                      <th className="py-3 px-4 font-semibold">付款狀態</th>
                      <th className="py-3 px-4 font-semibold">建立時間</th>
                      <th className="py-3 px-4 font-semibold text-right">對帳操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          無符合之訂單記錄
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-amber-300">
                            {o.orderNumber}
                            {o.note && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                                {o.note}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-white font-mono">{o.userEmail}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-[11px] text-slate-300 font-medium">
                              {o.tierName}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            NT$ {o.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-slate-400">
                              {o.paymentMethod === 'line_pay'
                                ? 'LINE Pay'
                                : o.paymentMethod === 'jko_pay'
                                ? '街口支付'
                                : o.paymentMethod === 'credit_card'
                                ? '線上刷卡'
                                : o.paymentMethod === 'atm'
                                ? 'ATM 轉帳'
                                : o.paymentMethod === 'ecpay'
                                ? '綠界金流'
                                : '人工補單'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {o.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-semibold">
                                <CheckCircle2 className="w-3 h-3" /> 已付款
                              </span>
                            ) : o.status === 'pending' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-[11px]">
                                待付款
                              </span>
                            ) : o.status === 'refunded' ? (
                              <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded text-[11px]">
                                已退款 (權限已收回)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                                失敗
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {new Date(o.createdAt).toLocaleDateString('zh-TW')}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* 修改發票與訂單內容按鈕 */}
                              <button
                                onClick={() => openEditInvoiceModal(o)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                                title="修改訂單內容與發票抬頭統編寄送地址"
                              >
                                <Edit3 className="w-3 h-3" />
                                編輯發票/訂單
                              </button>

                              {/* 待付款 ➔ 確認付款按鈕 */}
                              {o.status === 'pending' && (
                                <button
                                  onClick={() => handleConfirmOrderPaid(o)}
                                  className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-lg transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  確認收款
                                </button>
                              )}

                              {/* 已付款 ➔ 退款按鈕 */}
                              {o.status === 'paid' && (
                                <button
                                  onClick={() => handleRefundOrder(o)}
                                  className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="標記退款並自動收回該會員報告權限"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  退款
                                </button>
                              )}

                              {/* 刪除訂單 / 退款作廢按鈕 */}
                              <button
                                onClick={() => handleDeleteOrder(o)}
                                className="p-1 hover:bg-rose-500/20 text-rose-400 border border-transparent hover:border-rose-500/40 rounded-lg transition cursor-pointer"
                                title="刪除訂單 / 作廢清除"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: 紙本發票與掛號物流中心 */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
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

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateInvoiceModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 手動開立發票單</span>
                </button>

                <button
                  onClick={handleExportShippingCSV}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl border border-amber-500/30 transition shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>匯出寄送清單 (CSV)</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredInvoices.length === 0 ? (
                <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                  目前無此狀態之發票訂單
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
                            <span>下單：{new Date(order.createdAt).toLocaleDateString('zh-TW')}</span>
                            {inv.issuedAt && (
                              <span>開立：{new Date(inv.issuedAt).toLocaleDateString('zh-TW')}</span>
                            )}
                            {inv.trackingNumber && (
                              <span className="text-emerald-400 font-bold">
                                郵局掛號單號：{inv.trackingNumber}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0">
                          <button
                            onClick={() => handleCopyShippingInfo(order)}
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
                            onClick={() => openEditInvoiceModal(order)}
                            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>✏️ 修改收件資料</span>
                          </button>

                          {inv.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateInvoiceStage(order.orderNumber, 'issued')}
                              className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition shadow"
                            >
                              標記為已開立
                            </button>
                          )}

                          {inv.status === 'issued' && (
                            <button
                              onClick={() => handleUpdateInvoiceStage(order.orderNumber, 'ready_to_ship')}
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
                                onClick={() => handleUpdateInvoiceStage(order.orderNumber, 'shipped')}
                                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
                              >
                                確認已寄出
                              </button>
                            </div>
                          )}

                          {inv.status === 'shipped' && (
                            <button
                              onClick={() => handleUpdateInvoiceStage(order.orderNumber, 'completed')}
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
          </div>
        )}

        {/* TAB 5: 金流與系統設定 */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            {/* 綠界 ECPay 設定維護表單 */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-amber-400" />
                    綠界科技 (ECPay) 支付參數動態維護
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    儲存後立即於 `/api/payment/ecpay-checkout` 與回調驗證生效，無需重新編譯部屬
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  最後更新：{new Date(paymentConfig.updatedAt).toLocaleString('zh-TW')}
                </span>
              </div>

              <form onSubmit={handleSavePaymentConfig} className="space-y-4 max-w-2xl">
                {/* 1. 運行模式開關 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-amber-400" />
                    金流運行模式 (環境切換)
                  </label>
                  <select
                    value={paymentConfig.mode}
                    onChange={(e: any) =>
                      setPaymentConfig({ ...paymentConfig, mode: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="sandbox">測試沙盒環境 (Sandbox) - 供開發與離線測算測試</option>
                    <option value="production">正式營運環境 (Production) - 宇沛實業正式金流商轉</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    沙盒環境連線至 `https://payment-stage.ecpay.com.tw`；正式環境連線至 `https://payment.ecpay.com.tw`
                  </p>
                </div>

                {/* 2. 特店代號 */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-amber-400" />
                    特店代號 (MerchantID)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentConfig.merchantId}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, merchantId: e.target.value })
                    }
                    placeholder="3456197"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    預設已代入宇沛實業專屬 MerchantID: 3456197
                  </p>
                </div>

                {/* 3. HashKey */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    交易驗證金鑰 (HashKey)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentConfig.hashKey}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, hashKey: e.target.value })
                    }
                    placeholder="RttngL4823khpLRX"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 4. HashIV */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    向量編碼金鑰 (HashIV)
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentConfig.hashIV}
                    onChange={(e) =>
                      setPaymentConfig({ ...paymentConfig, hashIV: e.target.value })
                    }
                    placeholder="skQe3yMoSOuyMxRO"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingPaymentConfig}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPaymentConfig ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>儲存金流參數設定</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Webhook 回調除錯日誌清單 (Webhook Log Viewer) */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    金流回調除錯日誌 (Webhook Log Viewer)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    即時記錄最近綠界伺服器端 POST 交易回調資料，供管理員排查金流與跳轉異常
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  共 {webhookLogsList.length} 筆回傳記錄
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-2.5 px-3 font-semibold">接收時間</th>
                      <th className="py-2.5 px-3 font-semibold">特店訂單編號</th>
                      <th className="py-2.5 px-3 font-semibold">綠界交易序號</th>
                      <th className="py-2.5 px-3 font-semibold">狀態碼 (RtnCode)</th>
                      <th className="py-2.5 px-3 font-semibold">交易金額</th>
                      <th className="py-2.5 px-3 font-semibold">綠界訊息</th>
                      <th className="py-2.5 px-3 font-semibold">付款時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {webhookLogsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          尚無金流回調通知記錄
                        </td>
                      </tr>
                    ) : (
                      webhookLogsList.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors font-mono">
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('zh-TW')}
                          </td>
                          <td className="py-2.5 px-3 text-amber-300 font-bold whitespace-nowrap">
                            {log.merchantTradeNo}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            {log.tradeNo || '無'}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {log.rtnCode === '1' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                1 (成功)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                {log.rtnCode} (失敗)
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-white font-bold whitespace-nowrap">
                            NT$ {log.tradeAmt.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 font-sans">
                            {log.rtnMsg || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {log.paymentDate || '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: 系統操作稽核日誌 */}
        {activeTab === 'audit_logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditLogSearchQuery}
                  onChange={(e) => setAuditLogSearchQuery(e.target.value)}
                  placeholder="搜尋操作者、對象、日誌內容..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <span className="text-xs text-slate-400 font-mono">
                共 {filteredAuditLogs.length} 筆稽核記錄
              </span>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 px-4 font-semibold">時間戳記</th>
                      <th className="py-3 px-4 font-semibold">操作管理員</th>
                      <th className="py-3 px-4 font-semibold">動作類型</th>
                      <th className="py-3 px-4 font-semibold">目標對象</th>
                      <th className="py-3 px-4 font-semibold">異動詳細內容</th>
                      <th className="py-3 px-4 font-semibold text-right">來源 IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500">
                          尚無符合之稽核日誌紀錄
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('zh-TW')}
                          </td>
                          <td className="py-3 px-4 font-mono text-white whitespace-nowrap">
                            {log.adminEmail}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                log.action === 'order_refund'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : log.action === 'password_reset'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : log.action === 'user_create' ||
                                    log.action === 'order_create_manual'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-amber-300 whitespace-nowrap">
                            {log.targetId}
                          </td>
                          <td className="py-3 px-4 text-slate-300 max-w-md">{log.details}</td>
                          <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">
                            {log.ip || '127.0.0.1'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: 命理文本庫熱更新 */}
        {activeTab === 'database' && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-400" />
                  四大命理文本庫 JSON 線上即時維護
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  修改儲存後立即於全站測算報告中熱生效，無須重新編譯部屬
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedDbFile}
                  onChange={(e) => setSelectedDbFile(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 px-3 py-1.5 focus:outline-none focus:border-amber-400"
                >
                  <option value="numerology_db.json">生命靈數文本庫 (numerology_db.json)</option>
                  <option value="bazi_db.json">八字命盤文本庫 (bazi_db.json)</option>
                  <option value="astrology_db.json">西洋占星文本庫 (astrology_db.json)</option>
                  <option value="ziwei_db.json">紫微斗數文本庫 (ziwei_db.json)</option>
                </select>

                <button
                  onClick={handleSaveDb}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>儲存更新</span>
                </button>
              </div>
            </div>

            {dbSavedMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{dbSavedMessage}</span>
              </div>
            )}

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <textarea
                value={dbContent}
                onChange={(e) => setDbContent(e.target.value)}
                rows={20}
                className="w-full bg-slate-950 p-4 font-mono text-xs text-emerald-400 focus:outline-none selection:bg-emerald-500 selection:text-slate-950 resize-y"
                placeholder="載入中..."
              />
            </div>
          </div>
        )}
      </main>

      {/* ===================== MODALS 區域 ===================== */}

      {/* MODAL 1: 新增會員 Modal */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                新增會員帳號
              </h3>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">姓名 / 稱謂</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="例如：張小明"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">電子郵件 (登入帳號)</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">初始密碼 (最少 6 碼)</label>
                <div className="relative">
                  <input
                    type={showNewUserPassword ? 'text' : 'password'}
                    required
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="請指定登入密碼"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">身分角色</label>
                  <select
                    value={newUserData.role}
                    onChange={(e: any) => setNewUserData({ ...newUserData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="user">一般會員 (User)</option>
                    <option value="admin">系統管理員 (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">帳號狀態</label>
                  <select
                    value={newUserData.status}
                    onChange={(e: any) => setNewUserData({ ...newUserData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">正常運作 (Active)</option>
                    <option value="suspended">停權凍結 (Suspended)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">手動授權解鎖方案</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'level2', label: '初階解析 (199)' },
                    { id: 'level3', label: '高階終身 (699)' },
                    { id: 'synastry_addon', label: '雙人合盤 (399)' },
                  ].map((tier) => (
                    <label
                      key={tier.id}
                      className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={newUserData.unlockedTiers.includes(tier.id as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewUserData({
                              ...newUserData,
                              unlockedTiers: [...newUserData.unlockedTiers, tier.id as any],
                            });
                          } else {
                            setNewUserData({
                              ...newUserData,
                              unlockedTiers: newUserData.unlockedTiers.filter((t) => t !== tier.id),
                            });
                          }
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span className="text-slate-300">{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  確認建立
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 編輯會員 Modal */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  編輯會員資料
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  帳號：{editingUser.email}
                </p>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-3.5">
              <div>
                <label className="block text-xs text-slate-400 mb-1">姓名</label>
                <input
                  type="text"
                  required
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  直接重設密碼 (若不修改請留空)
                </label>
                <div className="relative">
                  <input
                    type={showEditUserPassword ? 'text' : 'password'}
                    value={editUserData.password}
                    onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                    placeholder="留空表示保持原密碼不變"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditUserPassword(!showEditUserPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showEditUserPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">身分角色</label>
                  <select
                    value={editUserData.role}
                    onChange={(e: any) => setEditUserData({ ...editUserData, role: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="user">一般會員 (User)</option>
                    <option value="admin">系統管理員 (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">帳號狀態</label>
                  <select
                    value={editUserData.status}
                    onChange={(e: any) => setEditUserData({ ...editUserData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="active">正常運作</option>
                    <option value="suspended">停權凍結</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">解鎖權限等級調整</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'level2', label: '初階解析 (199)' },
                    { id: 'level3', label: '高階終身 (699)' },
                    { id: 'synastry_addon', label: '雙人合盤 (399)' },
                  ].map((tier) => (
                    <label
                      key={tier.id}
                      className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={editUserData.unlockedTiers.includes(tier.id as any)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditUserData({
                              ...editUserData,
                              unlockedTiers: [...editUserData.unlockedTiers, tier.id as any],
                            });
                          } else {
                            setEditUserData({
                              ...editUserData,
                              unlockedTiers: editUserData.unlockedTiers.filter((t) => t !== tier.id),
                            });
                          }
                        }}
                        className="rounded border-slate-700 text-amber-500 focus:ring-0"
                      />
                      <span className="text-slate-300">{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-xs"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  儲存變更
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: 新增離線補單 Modal */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                建立離線 / 人工對帳補單
              </h3>
              <button
                onClick={() => setIsCreateOrderModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">客戶電子郵件 (將自動連動會員帳號)</label>
                <input
                  type="email"
                  required
                  value={newOrderData.userEmail}
                  onChange={(e) => setNewOrderData({ ...newOrderData, userEmail: e.target.value })}
                  placeholder="client@example.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">購買方案</label>
                  <select
                    value={newOrderData.tier}
                    onChange={(e) => {
                      const t = e.target.value as UnlockTier;
                      const name =
                        t === 'level3'
                          ? '高階終身全盤與三年運勢曲線報告'
                          : t === 'level2'
                          ? '初階事業與情感財富深度解析'
                          : '雙人合盤深度解析';
                      const amt = t === 'level3' ? 699 : t === 'level2' ? 199 : 399;
                      setNewOrderData({
                        ...newOrderData,
                        tier: t,
                        tierName: name,
                        amount: amt,
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="level2">NT$199 初階個人解析</option>
                    <option value="level3">NT$699 高階終身白皮書</option>
                    <option value="synastry_addon">NT$399 雙人合盤解鎖</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">實收金額 (NT$)</label>
                  <input
                    type="number"
                    required
                    value={newOrderData.amount}
                    onChange={(e) => setNewOrderData({ ...newOrderData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">支付管道</label>
                  <select
                    value={newOrderData.paymentMethod}
                    onChange={(e: any) => setNewOrderData({ ...newOrderData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="atm">ATM 銀行轉帳</option>
                    <option value="line_pay">LINE Pay</option>
                    <option value="jko_pay">街口支付</option>
                    <option value="credit_card">信用卡</option>
                    <option value="manual">線下匯款 / 現金</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">付款狀態</label>
                  <select
                    value={newOrderData.status}
                    onChange={(e: any) => setNewOrderData({ ...newOrderData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="paid">已付款 (立即自動解鎖會員權限)</option>
                    <option value="pending">待付款 (靜候匯款)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">內部備註說明</label>
                <input
                  type="text"
                  value={newOrderData.note}
                  onChange={(e) => setNewOrderData({ ...newOrderData, note: e.target.value })}
                  placeholder="例如：末五碼 12345 臨櫃匯款補單"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newOrderData.hasInvoice}
                    onChange={(e) => setNewOrderData({ ...newOrderData, hasInvoice: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500"
                  />
                  <span className="font-semibold text-amber-300">
                    同時開立紙本發票與掛號郵寄資訊
                  </span>
                </label>

                {newOrderData.hasInvoice && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 mb-1">發票類型</label>
                        <select
                          value={newOrderData.invoiceType}
                          onChange={(e: any) => setNewOrderData({ ...newOrderData, invoiceType: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="personal">二聯式個人</option>
                          <option value="company">三聯式公司統編</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">統一編號</label>
                        <input
                          type="text"
                          value={newOrderData.taxId}
                          onChange={(e) => setNewOrderData({ ...newOrderData, taxId: e.target.value })}
                          placeholder="8 碼數字"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-500 mb-1">買受人抬頭</label>
                      <input
                        type="text"
                        value={newOrderData.buyerTitle}
                        onChange={(e) => setNewOrderData({ ...newOrderData, buyerTitle: e.target.value })}
                        placeholder="公司名稱"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-500 mb-1">收件人姓名</label>
                        <input
                          type="text"
                          value={newOrderData.recipientName}
                          onChange={(e) => setNewOrderData({ ...newOrderData, recipientName: e.target.value })}
                          placeholder="姓名"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">收件人電話</label>
                        <input
                          type="text"
                          value={newOrderData.recipientPhone}
                          onChange={(e) => setNewOrderData({ ...newOrderData, recipientPhone: e.target.value })}
                          placeholder="0912-345678"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-500 mb-1">郵遞區號</label>
                        <input
                          type="text"
                          value={newOrderData.postalCode}
                          onChange={(e) => setNewOrderData({ ...newOrderData, postalCode: e.target.value })}
                          placeholder="3 或 5 碼"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-slate-500 mb-1">收件地址</label>
                        <input
                          type="text"
                          value={newOrderData.address}
                          onChange={(e) => setNewOrderData({ ...newOrderData, address: e.target.value })}
                          placeholder="縣市區路街門牌樓層"
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOrderModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  確認補單
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: 修改訂單金額 Modal */}
      {isEditOrderAmountModalOpen && editingAmountOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  修改訂單金額與備註
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  訂單號：{editingAmountOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIsEditOrderAmountModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrderAmount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">買家 Email</label>
                <div className="text-white font-mono bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  {editingAmountOrder.userEmail}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">購買方案</label>
                <div className="text-slate-300 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                  {editingAmountOrder.tierName}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold text-amber-300">
                  實收金額 (NT$)
                </label>
                <input
                  type="number"
                  required
                  value={newOrderAmount}
                  onChange={(e) => setNewOrderAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">內部備註說明</label>
                <input
                  type="text"
                  value={newOrderNote}
                  onChange={(e) => setNewOrderNote(e.target.value)}
                  placeholder="例如：特價折扣或折抵優惠"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOrderAmountModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  儲存金額
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: 手動開立紙本發票單 Modal */}
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
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, orderNumber: e.target.value })}
                  placeholder="例：ORD20260916ABCD (留空自動新開)"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">發票類型</label>
                  <select
                    value={newInvoiceData.type}
                    onChange={(e: any) => setNewInvoiceData({ ...newInvoiceData, type: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, taxId: e.target.value })}
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
                  onChange={(e) => setNewInvoiceData({ ...newInvoiceData, buyerTitle: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, recipientName: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, recipientPhone: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, postalCode: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, address: e.target.value })}
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
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">開立備註</label>
                  <input
                    type="text"
                    value={newInvoiceData.note}
                    onChange={(e) => setNewInvoiceData({ ...newInvoiceData, note: e.target.value })}
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

      {/* MODAL 6: 編輯發票收件資料 Modal */}
      {isEditInvoiceModalOpen && editingInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  修改發票寄送資料
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  訂單：{editingInvoiceOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setIsEditInvoiceModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1">發票類型</label>
                  <select
                    value={editInvoiceData.type}
                    onChange={(e: any) => setEditInvoiceData({ ...editInvoiceData, type: e.target.value })}
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
                    value={editInvoiceData.taxId}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, taxId: e.target.value })}
                    placeholder="8 碼數字"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">買受人抬頭</label>
                <input
                  type="text"
                  value={editInvoiceData.buyerTitle}
                  onChange={(e) => setEditInvoiceData({ ...editInvoiceData, buyerTitle: e.target.value })}
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
                    value={editInvoiceData.recipientName}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">收件人電話</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceData.recipientPhone}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, recipientPhone: e.target.value })}
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
                    value={editInvoiceData.postalCode}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, postalCode: e.target.value })}
                    placeholder="3 或 5 碼"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 mb-1">收件地址</label>
                  <input
                    type="text"
                    required
                    value={editInvoiceData.address}
                    onChange={(e) => setEditInvoiceData({ ...editInvoiceData, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditInvoiceModalOpen(false)}
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

      {/* 底部頁尾與認證視窗 */}
      <Footer />
      <AuthModal />
    </div>
  );
}
