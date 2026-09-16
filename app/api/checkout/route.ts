import { NextResponse } from 'next/server';

/**
 * 舊版模擬結帳端點已依企業規範全面退役
 * 系統已升級對接綠界科技官方正式 3D-Secure 金流收銀台 (/api/payment/ecpay-checkout)
 * 嚴禁任何未經真實扣款的直接解鎖模擬行為
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        '系統已全面切換至綠界科技 (ECPay) 官方正式 3D-Secure 金流收銀台，請透過 /api/payment/ecpay-checkout 進行實質刷卡。',
    },
    { status: 400 }
  );
}
