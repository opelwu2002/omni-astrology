import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getOrders,
  createManualOrder,
  updateOrderRefundStatus,
  updateOrderStatus,
  updateOrderAmount,
  updateOrderDetails,
  updateInvoiceData,
  deleteOrder,
  addAuditLog,
} from '@/lib/db';
import { UnlockTier, InvoiceInfo } from '@/types/auth';

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

// 建立離線/人工補單 (ATM 轉帳、LINE Pay、街口、線下匯款等雜費/補單)
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
      details: `手動人工補單：客戶 ${newOrder.userEmail}，方案 ${newOrder.tierName}，金額 NT$ ${newOrder.amount}，付款方式：${newOrder.paymentMethod}，狀態：${newOrder.status}`,
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

// 修改訂單內容（包含發票資訊、金額、方案或退款作廢）
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

    // 1. 處理退款（自動連動收回會員報告解鎖權限）
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

    // 2. 處理狀態變更（例如由 pending 變更為 paid）
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

    // 3. 處理發票開立相關欄位修改（抬頭、統編、收件人、電話、地址）
    if (action === 'invoice' && invoice) {
      const updated = updateInvoiceData(orderNumber, invoice);
      if (!updated) {
        return NextResponse.json({ success: false, error: '找不到指定訂單' }, { status: 404 });
      }

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'invoice_update_data',
        targetId: orderNumber,
        targetType: 'invoice',
        details: `修改訂單 ${orderNumber} 發票資訊：抬頭「${invoice.buyerTitle || '個人'}」，統編「${invoice.taxId || '無'}」，收件人「${invoice.recipientName}」`,
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 發票與寄送資訊已成功更新！`,
      });
    }

    // 4. 處理完整訂單內容修改（金額、方案、發票與備註）
    if (action === 'edit') {
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

      addAuditLog({
        adminId: user.id,
        adminEmail: user.email,
        action: 'order_amount_update',
        targetId: orderNumber,
        targetType: 'order',
        details: `管理員完整修改訂單 ${orderNumber}：金額 NT$ ${amount || updated.amount}，方案 ${tierName || updated.tierName}，狀態 ${status || updated.status}`,
      });

      return NextResponse.json({
        success: true,
        order: updated,
        message: `訂單 ${orderNumber} 內容已成功修改儲存！`,
      });
    }

    // 5. 處理單純金額與備註修改
    if (action === 'amount') {
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
      details: `管理員永久刪除訂單：${orderNumber}，並連動收回該會員對應等級權限`,
    });

    return NextResponse.json({
      success: true,
      message: `訂單 ${orderNumber} 已成功刪除作廢，並連動收回相關權限！`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '刪除訂單失敗' },
      { status: 500 }
    );
  }
}
