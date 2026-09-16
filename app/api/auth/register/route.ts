import { NextResponse } from 'next/server';
import { createAuthUser } from '@/lib/auth-users';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: '請輸入電子郵件與密碼' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密碼長度至少需 6 個字元' },
        { status: 400 }
      );
    }

    // 透過安全認證層建立新會員（記憶體與 Supabase 雙向同步，0 本機寫入防範 EROFS）
    const user = await createAuthUser({
      email: email.trim(),
      password,
      name: name?.trim(),
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user,
      token,
      message: '會員註冊成功！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '註冊失敗' },
      { status: 400 }
    );
  }
}
