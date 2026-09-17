import { NextResponse } from 'next/server';
import { createUser, findUserByEmail } from '@/lib/usersStorage';
import { signToken, createPrivateJsonResponse } from '@/lib/auth';
import { isValidTaiwanTaxId, isValidTaiwanPhone, CLIMATE_CHANGE_INDUSTRIES } from '@/lib/validators';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      phone,
      company,
      taxId,
      industry,
      address,
    } = body;

    // 1. 基礎必填驗證
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: '請完整填寫姓名/職稱、電子郵件與密碼' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '密碼長度至少需 6 個字元' },
        { status: 400 }
      );
    }

    // 2. 連絡電話必填驗證
    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: '請輸入連絡電話（手機或分機）' },
        { status: 400 }
      );
    }
    if (!isValidTaiwanPhone(phone.trim())) {
      return NextResponse.json(
        { success: false, error: '連絡電話格式不正確（請輸入有效手機或含區碼市話）' },
        { status: 400 }
      );
    }

    // 3. 所屬行業分類必填驗證
    if (!industry || !CLIMATE_CHANGE_INDUSTRIES.includes(industry as any)) {
      return NextResponse.json(
        {
          success: false,
          error: `請選擇所屬行業分類（${CLIMATE_CHANGE_INDUSTRIES.join('、')}）`,
        },
        { status: 400 }
      );
    }

    // 4. 連絡通訊地址必填驗證 (發票與憑證寄送)
    if (!address || address.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: '請填寫完整的連絡通訊地址（用於實際發票與憑證寄送）' },
        { status: 400 }
      );
    }

    // 5. 統一編號選填驗證 (若填寫需做標準邏輯驗證)
    if (taxId && taxId.trim()) {
      if (!isValidTaiwanTaxId(taxId.trim())) {
        return NextResponse.json(
          { success: false, error: '公司統一編號格式錯誤，請輸入符合財政部邏輯驗證之 8 碼統編' },
          { status: 400 }
        );
      }
    }

    const cleanEmail = email.trim().toLowerCase();

    // 6. 查重防護（直通全站單一資料存取核心）
    const existing = await findUserByEmail(cleanEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: '此電子郵件已被註冊' },
        { status: 400 }
      );
    }

    // 7. 建立新會員（原子性持久化寫入，100% 直連 Single Source of Truth Service）
    const user = await createUser({
      email: cleanEmail,
      password,
      name: name.trim(),
      phone: phone.trim(),
      company: company?.trim() || undefined,
      taxId: taxId?.trim() || undefined,
      industry: industry.trim(),
      address: address.trim(),
    });

    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: '資料庫寫入失敗，未能確認會員身分' },
        { status: 500 }
      );
    }

    // 8. 真正寫入資料庫成功後，才簽發 JWT Token 與 Cookie
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const res = createPrivateJsonResponse({
      success: true,
      user,
      token,
      message: '會員註冊成功並已安全登入！',
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
  } catch (error: any) {
    console.error('[register] 註冊處理異常:', error);
    const errorMsg = error?.message || '註冊失敗';
    const isDbError =
      errorMsg.includes('資料庫') ||
      errorMsg.includes('GitHub') ||
      errorMsg.includes('連線') ||
      errorMsg.includes('逾時');

    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: isDbError ? 500 : 400 }
    );
  }
}
