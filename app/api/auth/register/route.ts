import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
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

    const user = createUser(email.trim(), password, name?.trim());
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
