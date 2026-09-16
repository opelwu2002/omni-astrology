import { findUserByEmail, updateUser, toSafeUser } from '@/lib/db';
import {
  comparePassword,
  signToken,
  isMasterAdminAccount,
  MASTER_ADMIN_CREDENTIALS,
  createPrivateJsonResponse,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const account = (body.username || body.email || body.account || '').trim();
    const password = (body.password || '').trim();

    if (!account || !password) {
      return createPrivateJsonResponse(
        { success: false, error: '請輸入帳號/電子郵件與密碼' },
        { status: 400 }
      );
    }

    // 1. 【最高優先硬性校驗】：admin / Opel6439 絕對放行
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
        message: '管理員認證成功！',
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

    // 若帳號為 admin 但密碼不為 Opel6439 則拒絕
    if (
      account.toLowerCase() === 'admin' ||
      account.toLowerCase() === 'admin@omni-astrology.com'
    ) {
      return createPrivateJsonResponse(
        { success: false, error: '管理者帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    const inputAccount = account;

    // 一般會員驗證
    const user = findUserByEmail(inputAccount);

    if (!user) {
      return createPrivateJsonResponse(
        { success: false, error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    if (user.status === 'suspended') {
      return createPrivateJsonResponse(
        { success: false, error: '此帳號已被管理員停權，如有疑問請聯繫客服' },
        { status: 403 }
      );
    }

    const isMatch = comparePassword(password, user.passwordHash);

    if (!isMatch) {
      return createPrivateJsonResponse(
        { success: false, error: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    // 更新最後登入時間
    updateUser(user.id, { lastLoginAt: Date.now() });

    const safeUser = toSafeUser(user);
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return createPrivateJsonResponse({
      success: true,
      user: safeUser,
      token,
      message: '登入成功！',
    });
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '登入處理失敗' },
      { status: 500 }
    );
  }
}
