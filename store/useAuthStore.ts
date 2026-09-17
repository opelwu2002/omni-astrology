/**
 * 會員認證狀態管理 (Zustand)
 */
import { create } from 'zustand';
import { UserSafe, RegisterParams } from '@/types/auth';
import { UserProfile } from '@/types/profile';

interface AuthState {
  user: UserSafe | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';

  // 動作
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  setAuth: (user: UserSafe, token: string) => void;
  login: (accountOrEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    params: RegisterParams | (Partial<RegisterParams> & { email: string; password: string })
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  syncProfilesToCloud: (profiles: UserProfile[]) => Promise<boolean>;
  loadProfilesFromCloud: () => Promise<UserProfile[] | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthModalOpen: false,
  authModalMode: 'login',

  setAuthModalOpen: (open, mode = 'login') => {
    set({ isAuthModalOpen: open, authModalMode: mode });
  },

  setAuth: (user: UserSafe, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      if (user.role === 'admin') {
        localStorage.setItem('omni_admin_auth', 'true');
        localStorage.setItem('admin_user', 'admin');
      }
    }
    set({ user, token, isAuthModalOpen: false });
  },

  login: async (accountOrEmail, password) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account: accountOrEmail,
          username: accountOrEmail,
          email: accountOrEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || '登入失敗' };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
        if (data.user?.role === 'admin') {
          localStorage.setItem('omni_admin_auth', 'true');
          localStorage.setItem('admin_user', 'admin');
        }
      }
      set({ user: data.user, token: data.token, isAuthModalOpen: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || '連線伺服器異常' };
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (
    params: RegisterParams | (Partial<RegisterParams> & { email: string; password: string })
  ) => {
    set({ isLoading: true });
    try {
      // 100% 直通傳遞前端真實表單輸入，嚴格禁止任何假資料 (Mock Data) 或預設值填入
      const payload = {
        name: params.name?.trim() || '',
        email: params.email?.trim().toLowerCase() || '',
        password: params.password || '',
        phone: params.phone?.trim() || '',
        company: params.company?.trim() || undefined,
        taxId: params.taxId?.trim() || undefined,
        industry: params.industry || '',
        address: params.address?.trim() || '',
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || '註冊失敗' };
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', data.token);
      }
      set({ user: data.user, token: data.token, isAuthModalOpen: false });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || '連線伺服器異常' };
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('omni_admin_auth');
      localStorage.removeItem('admin_user');
    }
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    // 預設絕對維持訪客模式，只有真正存在合法 auth_token 且通過後端驗證才賦予登入態
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('auth_token');

    // 若完全沒有 token，強制保持乾淨的未登入訪客狀態
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({ user: data.user, token });
        // 同步最新的 unlockedTiers 到本地快取
        if (Array.isArray(data.user.unlockedTiers)) {
          localStorage.setItem('omni_unlocked_tiers', JSON.stringify(data.user.unlockedTiers));
        }
      } else {
        // Token 無效或已過期，徹底清理所有認證儲存，嚴格退回訪客模式
        localStorage.removeItem('auth_token');
        localStorage.removeItem('omni_admin_auth');
        localStorage.removeItem('admin_user');
        set({ user: null, token: null });
      }
    } catch {
      // 網路離線時不破壞當前狀態
    }
  },

  refreshAuth: async () => {
    await get().checkAuth();
  },

  syncProfilesToCloud: async (profiles) => {
    const { token, user } = get();
    if (!token || !user) return false;

    try {
      const res = await fetch('/api/auth/sync-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profiles }),
      });
      const data = await res.json();
      return data.success;
    } catch {
      return false;
    }
  },

  loadProfilesFromCloud: async () => {
    const { token, user } = get();
    if (!token || !user) return null;

    try {
      const res = await fetch('/api/auth/sync-profiles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.profiles)) {
        return data.profiles;
      }
      return null;
    } catch {
      return null;
    }
  },
}));
