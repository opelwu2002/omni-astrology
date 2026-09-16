import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { createOrder } from '@/lib/db';
import { ECPAY_CONFIG, generateCheckMacValue, getEcpayTradeDate } from '@/lib/ecpay';
import { UnlockTier, InvoiceInfo } from '@/types/auth';
import { isValidTaiwanTaxId } from '@/lib/validators';

/**
 * 綠界金流發起結帳端點
 * 1. 檢核免責條款與發票郵寄資料
 * 2. 建立 pending 狀態之訂單
 * 3. 產生帶有 CheckMacValue 之表單參數，供前端直接 POST 跳轉綠界收銀台
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tier = 'level2' as UnlockTier,
      tierName = '初階深度解析報告',
      amount = 199,
      invoice,
      agreedToTerms,
    } = body;

    // 1. 法律第一層防護檢核：強制勾選免責聲明與服務條款
    if (!agreedToTerms) {
      return NextResponse.json(
        { success: false, error: '請務必閱讀並勾選同意《服務條款》與《命理分析免責聲明》後再進行結帳' },
        { status: 400 }
      );
    }

    // 2. 紙本發票郵寄資料檢核
    if (!invoice || !invoice.recipientName || !invoice.recipientPhone || !invoice.address) {
      return NextResponse.json(
        { success: false, error: '請完整填寫紙本發票收件人、連絡電話與郵寄收件地址' },
        { status: 400 }
      );
    }

    if (invoice.type === 'company') {
      if (!invoice.taxId || !invoice.buyerTitle) {
        return NextResponse.json(
          { success: false, error: '三聯式公司發票請填寫完整公司抬頭與 8 碼統一編號' },
          { status: 400 }
        );
      }
      if (!isValidTaiwanTaxId(invoice.taxId.trim())) {
        return NextResponse.json(
          { success: false, error: '三聯式統一編號未通過財政部標準除以 10 邏輯驗證' },
          { status: 400 }
        );
      }
    }

    // 3. 取得當前會員資訊（若無則為訪客）
    const user = getCurrentUserFromRequest(request);
    const userId = user ? user.id : `guest-${Date.now()}`;
    const userEmail = user ? user.email : 'guest@omni-astrology.com';

    // 4. 寫入資料庫，狀態為 pending
    const invoiceData: InvoiceInfo = {
      type: invoice.type || 'individual',
      buyerTitle: invoice.buyerTitle || '',
      taxId: invoice.taxId || '',
      recipientName: invoice.recipientName.trim(),
      recipientPhone: invoice.recipientPhone.trim(),
      postalCode: invoice.postalCode?.trim() || '100',
      address: invoice.address.trim(),
      status: 'pending',
    };

    const newOrder = createOrder(
      userId,
      userEmail,
      tier,
      tierName,
      amount,
      'ecpay',
      invoiceData,
      'pending'
    );

    // 5. 構建動態網址 (包含 host origin)
    const requestUrl = new URL(request.url);
    const origin = requestUrl.origin;

    const tradeDate = getEcpayTradeDate();

    // 6. 綠界支付標準請求參數
    const ecpayParams: Record<string, string | number> = {
      MerchantID: ECPAY_CONFIG.MerchantID,
      MerchantTradeNo: newOrder.orderNumber,
      MerchantTradeDate: tradeDate,
      PaymentType: 'aio',
      TotalAmount: amount,
      TradeDesc: '宇沛實業命理解析諮詢服務',
      ItemName: tierName.substring(0, 50),
      ReturnURL: `${origin}/api/payment/callback`,
      ClientBackURL: `${origin}/`,
      OrderResultURL: `${origin}/?payment_success=true&orderNo=${newOrder.orderNumber}&tier=${tier}`,
      ChoosePayment: 'ALL',
      EncryptType: 1,
    };

    // 7. 計算 SHA256 CheckMacValue
    const checkMacValue = generateCheckMacValue(ecpayParams);
    ecpayParams.CheckMacValue = checkMacValue;

    return NextResponse.json({
      success: true,
      order: newOrder,
      apiUrl: ECPAY_CONFIG.ApiUrl,
      params: ecpayParams,
    });
  } catch (error: any) {
    console.error('建立綠界訂單失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '建立金流交易失敗' },
      { status: 500 }
    );
  }
}
