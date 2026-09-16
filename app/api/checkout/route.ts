import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { createOrder } from '@/lib/db';
import { UnlockTier } from '@/types/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tier = 'level2' as UnlockTier,
      tierName = '初階深度解析報告',
      amount = 199,
      paymentMethod = 'credit_card',
      invoice,
      agreedToTerms = true,
    } = body;

    // 免責聲明強制確認
    if (!agreedToTerms) {
      return NextResponse.json(
        { success: false, error: '請勾選同意《服務條款》與《命理分析免責聲明》後再行結帳' },
        { status: 400 }
      );
    }

    const user = getCurrentUserFromRequest(request);

    const userId = user ? user.id : 'guest-user';
    const userEmail = user ? user.email : 'guest@client.local';

    const newOrder = createOrder(
      userId,
      userEmail,
      tier,
      tierName,
      amount,
      paymentMethod,
      invoice,
      'paid'
    );

    return NextResponse.json({
      success: true,
      order: newOrder,
      tier,
      message: `恭喜您已成功解鎖【${tierName}】！報告內容已為您開啟。`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '結帳處理失敗' },
      { status: 500 }
    );
  }
}
