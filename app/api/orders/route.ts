import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getOrders,
  createManualOrder,
  updateOrderRefundStatus,
  updateOrderStatus,
  updateOrderDetails,
  updateInvoiceData,
  deleteOrder,
  addAuditLog,
} from '@/lib/db';
import { UnlockTier } from '@/types/auth';

/**
 * 訂單與發票 API 端點 (app/api/orders)
 * 支援會員查詢個人訂單、管理員查詢全部、修改發票資訊、刪除訂單與人工補單
 */
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: '請先登入會員' }, { status: 401 });
    }

    const allOrders = getOrders();

    // 若為最高管理員，回傳全站所有訂單
    if (user.role === 'admin') {
      return NextResponse.json({ success: true, orders: allOrders });
    }

    // 一般會員僅回傳屬於自己的訂單
    const userOrders = allOrders.filter(
      (o) =>
        o.userId === user.id ||
        o.userEmail.toLowerCase() === user.email.toLowerCase()
    );

    return NextResponse.json({ success: true, orders: userOrders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取訂單失敗' },
      { status: 500 }
    );
  }
}

// 人工補單 / 手動新增雜費訂單
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

    if (!userEmail || !tier || amount === undefined) {
      return NextResponse.json(
        { success: false, error: '請提供完整的客戶 Email、方案與金額' },
        { status: 400 }
      );
    }

    const newOrder = createManualOrder({
      userId,
      userEmail: userEmail.trim(),
      tier: tier as UnlockTier,
      tierName: tierName || '手動建立方案',
      amount: Number(amount),
      paymentMethod: paymentMethod || 'manual',
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
      details: `手動人工補單：客戶 ${newOrder.userEmail}，方案 ${newOrder.tierName}，金額 NT$ ${newOrder.amount}`,
    });

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: '訂單建立成功！' + (newOrder.status === 'paid' ? ' 已自動解鎖會員權限。' : ''),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '建立訂單失敗' },
      { status: 400 }
    );
  }
}

// 修改訂單內容 / 發票資訊 (抬頭、統編、地址等)
export async function PATCH(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const body = await request.json();
    const { orderNumber, action, status, invoice, amount, tier, tierName, note } = body;

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: '缺少訂單編號' }, { status: 400 });
    }

    if (action === 'invoice' && invoice) {
      const updated = updateInvoiceData(orderNumber, invoice);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 發票資訊已更新！`,
      });
    }

    if (action === 'refund') {
      const updated = updateOrderRefundStatus(orderNumber);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 已成功退款作廢！`,
      });
    }

    if (action === 'status' && status) {
      const updated = updateOrderStatus(orderNumber, status);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 狀態已更新為 ${status}`,
      });
    }

    // 完整修改訂單
    const updated = updateOrderDetails(orderNumber, {
      amount,
      tier,
      tierName,
      status,
      invoice,
      note,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order: updated,
      message: `訂單 ${orderNumber} 內容已成功修改儲存！`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新訂單失敗' },
      { status: 500 }
    );
  }
}

// 刪除訂單 / 退款作廢
export async function DELETE(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無管理員權限' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: '請提供訂單編號' }, { status: 400 });
    }

    const success = deleteOrder(orderNumber, true);
    if (!success) {
      return NextResponse.json({ success: false, error: '找不到欲刪除的訂單' }, { status: 404 });
    }

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'order_refund',
      targetId: orderNumber,
      targetType: 'order',
      details: `永久刪除訂單：${orderNumber}，並連動收回相關權限`,
    });

    return NextResponse.json({
      success: true,
      message: `訂單 ${orderNumber} 已成功刪除作廢！`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '刪除訂單失敗' },
      { status: 500 }
    );
  }
}
