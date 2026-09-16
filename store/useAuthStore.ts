/**
 * 會員認證狀態管理 (Zustand)
 */
import { create } from 'zustand';
import { UserSafe } from '@/types/auth';
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
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
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

  register: async (email, password, name) => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
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
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const adminAuth = typeof window !== 'undefined' ? localStorage.getItem('omni_admin_auth') : null;

    // 若本地記錄最高管理員且標記有效，預先解除畫面遮罩
    if (adminAuth === 'true') {
      const masterAdminUser: UserSafe = {
        id: 'admin-master-001',
        email: 'admin@omni-astrology.com',
        name: '系統最高管理員',
        role: 'admin',
        status: 'active',
        unlockedTiers: ['free', 'level2', 'level3', 'synastry_addon'],
        createdAt: 1700000000000,
        lastLoginAt: Date.now(),
      };
      set({ user: masterAdminUser, token: token || 'omni-master-admin-token' });
    }

    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        set({ user: data.user, token });
      } else {
        if (adminAuth !== 'true') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
          }
          set({ user: null, token: null });
        }
      }
    } catch {
      // 網路離線時不硬性中斷
    }
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
