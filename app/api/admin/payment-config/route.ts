import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getPaymentConfig,
  savePaymentConfig,
  getWebhookLogs,
  addAuditLog,
} from '@/lib/db';

export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const config = getPaymentConfig();
    const webhookLogs = getWebhookLogs();

    return NextResponse.json({
      success: true,
      config,
      webhookLogs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取金流配置失敗' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const body = await request.json();
    const { mode, merchantId, hashKey, hashIV } = body;

    if (!merchantId || !hashKey || !hashIV) {
      return NextResponse.json(
        { success: false, error: '商店代號、HashKey 與 HashIV 不可為空' },
        { status: 400 }
      );
    }

    const updated = savePaymentConfig({
      mode: mode === 'production' ? 'production' : 'sandbox',
      merchantId: merchantId.trim(),
      hashKey: hashKey.trim(),
      hashIV: hashIV.trim(),
    });

    // 寫入稽核日誌
    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'payment_config_update',
      targetId: updated.merchantId,
      targetType: 'system',
      details: `更新綠界第三方支付配置：運行環境「${updated.mode}」、商店代號「${updated.merchantId}」`,
    });

    return NextResponse.json({
      success: true,
      config: updated,
      message: '綠界金流配置已成功儲存並即刻生效！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新金流配置失敗' },
      { status: 500 }
    );
  }
}
