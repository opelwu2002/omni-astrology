import { NextResponse } from 'next/server';
import { findUserByEmail, updateUser, toSafeUser } from '@/lib/db';
import { signToken, createPrivateJsonResponse } from '@/lib/auth';

/**
 * 管理員專屬直接登入驗證路由 (/api/admin/login)
 * 嚴格優先執行 admin / Opel6439 絕對比對
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const account = (body.username || body.account || body.email || '').trim();
    const password = (body.password || '').trim();

    if (!account || !password) {
      return createPrivateJsonResponse(
        { success: false, error: '請輸入管理員帳號與密碼' },
        { status: 400 }
      );
    }

    // 【最高優先直接比對】：admin / Opel6439
    if (
      (account.toLowerCase() === 'admin' ||
        account.toLowerCase() === 'admin@omni-astrology.com') &&
      password === 'Opel6439'
    ) {
      let adminUser = findUserByEmail('admin@omni-astrology.com');
      if (!adminUser) {
        adminUser = {
          id: 'admin-master-001',
          email: 'admin@omni-astrology.com',
          name: '系統最高管理員',
          role: 'admin',
          status: 'active',
          passwordHash: '',
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
        };
      } else {
        updateUser(adminUser.id, {
          lastLoginAt: Date.now(),
          role: 'admin',
          status: 'active',
        });
      }

      const safeUser = toSafeUser(adminUser);
      const token = signToken({
        userId: adminUser.id,
        email: adminUser.email,
        role: 'admin',
      });

      const res = createPrivateJsonResponse({
        success: true,
        user: safeUser,
        token,
        message: '最高管理員認證成功！已解鎖後台全功能。',
      });

      res.cookies.set('token', token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 86400 * 7,
      });
      res.cookies.set('auth_token', token, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 86400 * 7,
      });

      return res;
    }

    return createPrivateJsonResponse(
      { success: false, error: '管理者帳號或密碼錯誤，存取已被拒絕' },
      { status: 401 }
    );
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '登入處理異常' },
      { status: 500 }
    );
  }
}
