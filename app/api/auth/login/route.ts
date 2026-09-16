import { verifyUserCredentials } from '@/lib/auth-users';
import { signToken, createPrivateJsonResponse } from '@/lib/auth';

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

    // 調用全端安全驗證存取層 (支援最高管理員 admin/Opel6439、舊會員 bcrypt、Supabase 雲端同步，0 本機磁碟寫入杜絕 EROFS)
    const verifyResult = await verifyUserCredentials(account, password);

    if (!verifyResult.success || !verifyResult.user) {
      const isSuspended = verifyResult.error?.includes('停權');
      return createPrivateJsonResponse(
        { success: false, error: verifyResult.error || '帳號或密碼錯誤' },
        { status: isSuspended ? 403 : 401 }
      );
    }

    const safeUser = verifyResult.user;
    const token = signToken({
      userId: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    const res = createPrivateJsonResponse({
      success: true,
      user: safeUser,
      token,
      message: safeUser.role === 'admin' ? '管理員認證成功！' : '登入成功！',
    });

    // 簽發雙重 Cookie（支援瀏覽器端與 Next.js 中介軟體）
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
  } catch (error: any) {
    return createPrivateJsonResponse(
      { success: false, error: error?.message || '登入處理失敗' },
      { status: 500 }
    );
  }
}
