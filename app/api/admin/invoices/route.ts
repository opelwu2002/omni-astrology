import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getInvoices,
  updateInvoiceStatus,
  updateInvoiceData,
  createManualInvoice,
  addAuditLog,
} from '@/lib/db';
import { InvoiceStatus } from '@/types/auth';

/**
 * 管理員紙本發票與掛號物流 API 端點
 * 支援取得所有發票、五階段狀態機流轉與隨時修改寄送資料
 */
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const invoices = getInvoices();
    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '讀取發票資料失敗' },
      { status: 500 }
    );
  }
}

// 手動開立紙本發票單
export async function POST(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const body = await request.json();
    const {
      orderNumber,
      type = 'personal',
      buyerTitle,
      taxId,
      recipientName,
      recipientPhone,
      postalCode = '100',
      address,
      amount,
      note,
    } = body;

    if (!recipientName || !recipientPhone || !address) {
      return NextResponse.json(
        { success: false, error: '請完整填寫收件人姓名、電話與郵寄收件地址' },
        { status: 400 }
      );
    }

    const order = createManualInvoice({
      orderNumber,
      type,
      buyerTitle,
      taxId,
      recipientName,
      recipientPhone,
      postalCode,
      address,
      amount: amount ? Number(amount) : undefined,
      note,
    });

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'invoice_status_change',
      targetId: order.orderNumber,
      targetType: 'invoice',
      details: `手動新建紙本發票：收件人「${recipientName}」、地址「${postalCode} ${address}」${orderNumber ? `（關聯訂單 ${orderNumber}）` : ''}`,
    });

    return NextResponse.json({
      success: true,
      order,
      message: '紙本發票開立成功！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '開立發票單失敗' },
      { status: 500 }
    );
  }
}

// 更新發票五階段生命週期狀態
export async function PATCH(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const body = await request.json();
    const { orderNumber, invoiceStatus, trackingNumber } = body;

    if (!orderNumber || !invoiceStatus) {
      return NextResponse.json(
        { success: false, error: '請提供訂單編號與發票狀態' },
        { status: 400 }
      );
    }

    const updated = updateInvoiceStatus(
      orderNumber,
      invoiceStatus as InvoiceStatus,
      trackingNumber
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: '找不到指定之發票訂單' },
        { status: 404 }
      );
    }

    const statusNames: Record<InvoiceStatus, string> = {
      pending: '待開立',
      issued: '已開立',
      ready_to_ship: '待寄出',
      shipped: '已寄出',
      completed: '已完成/已簽收',
    };

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'invoice_status_change',
      targetId: orderNumber,
      targetType: 'invoice',
      details: `推進發票狀態為「${statusNames[invoiceStatus as InvoiceStatus] || invoiceStatus}」${trackingNumber ? `（掛號單號：${trackingNumber}）` : ''}`,
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: `已成功將發票狀態更新為「${statusNames[invoiceStatus as InvoiceStatus] || invoiceStatus}」`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '更新發票狀態失敗' },
      { status: 500 }
    );
  }
}

// 修改發票收件資料（統編、抬頭、收件人、地址、電話）
export async function PUT(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const body = await request.json();
    const { orderNumber, invoiceData } = body;

    if (!orderNumber || !invoiceData) {
      return NextResponse.json(
        { success: false, error: '請提供訂單編號與發票內容' },
        { status: 400 }
      );
    }

    const updated = updateInvoiceData(orderNumber, invoiceData);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: '找不到指定訂單' },
        { status: 404 }
      );
    }

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'invoice_update_data',
      targetId: orderNumber,
      targetType: 'invoice',
      details: `修改訂單 ${orderNumber} 發票收件資料：收件人「${invoiceData.recipientName || ''}」、電話「${invoiceData.recipientPhone || ''}」、地址「${invoiceData.address || ''}」`,
    });

    return NextResponse.json({
      success: true,
      order: updated,
      message: '發票寄送資料已成功儲存更新！',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '修改發票資料失敗' },
      { status: 500 }
    );
  }
}
