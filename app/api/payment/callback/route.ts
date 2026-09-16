import { NextResponse } from 'next/server';
import { verifyCheckMacValue } from '@/lib/ecpay';
import { updateOrderStatus, findOrderByNumber, addWebhookLog } from '@/lib/db';

/**
 * 綠界金流伺服器端回調通知 (Server-to-Server Callback)
 * 接收綠界付款結果 POST 通知，驗證 CheckMacValue 後更新訂單並解鎖權限
 * 必須回應 1|OK 告知綠界接收成功
 */
export async function POST(request: Request) {
  try {
    // 綠界以 x-www-form-urlencoded 格式送出通知
    const formData = await request.formData();
    const params: Record<string, string> = {};

    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    console.log('收到綠界付款回調通知:', params.MerchantTradeNo, '狀態代碼:', params.RtnCode);

    // 寫入 Webhook 除錯日誌供管理員排查
    addWebhookLog({
      merchantTradeNo: params.MerchantTradeNo || 'UNKNOWN',
      tradeNo: params.TradeNo,
      rtnCode: params.RtnCode || '0',
      rtnMsg: params.RtnMsg || '',
      tradeAmt: Number(params.TradeAmt) || 0,
      paymentDate: params.PaymentDate,
      rawParams: params,
    });

    // 1. 驗證 CheckMacValue
    const isValid = verifyCheckMacValue(params);
    if (!isValid) {
      console.error('綠界回調 CheckMacValue 驗證失敗:', params);
      return new NextResponse('0|CheckMacValue Error', { status: 400 });
    }

    const { MerchantTradeNo, RtnCode, TradeNo } = params;

    // 2. 檢驗交易是否成功 (RtnCode === '1')
    if (RtnCode === '1') {
      const existingOrder = findOrderByNumber(MerchantTradeNo);
      if (existingOrder) {
        // 更新訂單狀態為已付款，並自動解鎖會員權限
        updateOrderStatus(MerchantTradeNo, 'paid', TradeNo);
        console.log(`訂單 ${MerchantTradeNo} 付款成功，已即時解鎖等級：${existingOrder.tier}`);
      } else {
        console.warn(`找不到對應訂單：${MerchantTradeNo}`);
      }

      // 回應綠界官方標準成功格式
      return new NextResponse('1|OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    } else {
      // 交易失敗或取消
      console.warn(`訂單 ${MerchantTradeNo} 交易未完成，訊息：${params.RtnMsg}`);
      updateOrderStatus(MerchantTradeNo, 'failed', TradeNo);

      return new NextResponse('1|OK', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  } catch (error: any) {
    console.error('處理綠界回調異常:', error);
    return new NextResponse('0|Server Error', { status: 500 });
  }
}
