import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getOrders,
  createManualOrder,
  updateOrderRefundStatus,
  updateOrderStatus,
  updateOrderAmount,
  addAuditLog,
} from '@/lib/db';
import { UnlockTier } from '@/types/auth';

// 取得所有訂單清單
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const orders = getOrders();
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取訂單失敗' },
      { status: 500 }
    );
  }
}

// 建立離線/人工補單 (ATM 轉帳、LINE Pay、街口、線下匯款等)
export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const body = await request.json();
    const {
      userId,
      userEmail,
      tier,
      tierName,
      amount,
      paymentMethod,
      status,
      invoice,
      note,
    } = body;

    if (!userEmail || !tier || !amount) {
      return NextResponse.json(
        { success: false, error: '請提供完整的客戶 Email、方案與金額' },
        { status: 400 }
      );
    }

    const newOrder = createManualOrder({
      userId,
      userEmail,
      tier: tier as UnlockTier,
      tierName: tierName || '手動建立方案',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'atm',
      status: status || 'paid',
      invoice,
      note,
    });

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'order_create_manual',
      targetId: newOrder.orderNumber,
      targetType: 'order',
      details: `手動離線補單：客戶 ${newOrder.userEmail}，方案 ${newOrder.tierName}，金額 NT$ ${newOrder.amount}，付款方式：${newOrder.paymentMethod}，狀態：${newOrder.status}`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: '離線訂單建立成功！' + (newOrder.status === 'paid' ? ' 已自動解鎖會員權限。' : ''),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '建立訂單失敗' },
      { status: 400 }
    );
  }
}

// 修改訂單狀態（退款或手動確認付款）
export async function PATCH(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const body = await request.json();
    const { orderNumber, action, status } = body;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: '缺少訂單編號' }, { status: 400 });
    }

    // 處理退款（自動連動收回會員報告解鎖權限）
    if (action === 'refund') {
      const updated = updateOrderRefundStatus(orderNumber);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'order_refund',
        targetId: orderNumber,
        targetType: 'order',
        details: `訂單退款：已標記訂單 ${orderNumber} 為已退款，並自動收回會員 ${updated.userEmail} 之 ${updated.tier} 方案解鎖權限`,
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 已成功退款，並自動收回該會員報告觀看權限！`,
      });
    }

    // 處理狀態變更（例如由 pending 變更為 paid）
    if (action === 'status' && status) {
      const updated = updateOrderStatus(orderNumber, status);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'order_status_change',
        targetId: orderNumber,
        targetType: 'order',
        details: `手動調整訂單 ${orderNumber} 狀態為「${status}」${status === 'paid' ? '（已自動同步解鎖權限）' : ''}`,
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 狀態已更新為 ${status}`,
      });
    }

    // 處理訂單金額與備註修改
    if (action === 'amount') {
      const { amount, note } = body;
      if (amount === undefined || isNaN(Number(amount))) {
        return NextResponse.json({ success: false, error: '請提供有效的金額數值' }, { status: 400 });
      }

      const updated = updateOrderAmount(orderNumber, Number(amount), note);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'order_amount_update',
        targetId: orderNumber,
        targetType: 'order',
        details: `管理員修改訂單 ${orderNumber} 金額為 NT$ ${amount}${note ? `，備註：${note}` : ''}`,
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 金額已成功修改為 NT$ ${amount}`,
      });
    }

    return NextResponse.json({ success: false, error: '無效的操作指令' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新訂單狀態失敗' },
      { status: 500 }
    );
  }
}
