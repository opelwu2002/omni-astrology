import { NextResponse } from 'next/server';
import { createAuthUser } from '@/lib/auth-users';
import { signToken } from '@/lib/auth';
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

    // 3. 所屬行業分類必填驗證 (環境部氣候變遷署七大行業)
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

    // 5. 統一編號選填驗證 (若填寫需做標準除以 10 驗證)
    if (taxId && taxId.trim()) {
      if (!isValidTaiwanTaxId(taxId.trim())) {
        return NextResponse.json(
          { success: false, error: '公司統一編號格式錯誤，請輸入符合財政部邏輯驗證之 8 碼統編' },
          { status: 400 }
        );
      }
    }

    // 6. 建立新會員（記憶體、檔案 data/users.json 與雲端多向同步，保證後台名單不脫鉤）
    const user = await createAuthUser({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      phone: phone.trim(),
      company: company?.trim() || undefined,
      taxId: taxId?.trim() || undefined,
      industry: industry.trim(),
      address: address.trim(),
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
      message: '會員註冊成功並已安全登入！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '註冊失敗' },
      { status: 400 }
    );
  }
}
