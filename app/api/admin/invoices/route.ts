import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import {
  getInvoices,
  getOrders,
  updateInvoiceStatus,
  updateInvoiceData,
  createManualInvoice,
  addAuditLog,
} from '@/lib/db';
import { InvoiceStatus } from '@/types/auth';
import { getFileFromGitHub, saveFileToGitHub } from '@/lib/github-db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * 管理員紙本發票與掛號物流 API 端點
 * 支援取得所有發票、五階段狀態機流轉、隨時修改寄送資料與作廢刪除
 */
export async function GET(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const { data: remoteOrders } = await getFileFromGitHub<any[]>('data/orders.json', []);
    const orders = Array.isArray(remoteOrders) && remoteOrders.length > 0 ? remoteOrders : getOrders();
    const invoices = orders.filter((o: any) => !!o.invoice);

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

    try {
      await saveFileToGitHub('data/orders.json', getOrders(), `chore(invoices): 修改訂單 ${orderNumber} 發票收件資料`);
    } catch (err: any) {
      console.warn('[invoices/put] GitHub 同步警示:', err?.message);
    }

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

// 作廢並刪除紙本發票物流單據 (100% 直連 GitHub API 持久化抹除)
export async function DELETE(request: Request) {
  try {
    const user = getCurrentUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: '無權限存取' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    let orderNumber =
      searchParams.get('orderNumber') ||
      searchParams.get('id') ||
      searchParams.get('invoiceId') ||
      searchParams.get('orderId');

    if (!orderNumber) {
      try {
        const body = await request.json();
        orderNumber = body.orderNumber || body.id || body.invoiceId || body.orderId;
      } catch {
        // 允許無 body
      }
    }

    if (!orderNumber) {
      return NextResponse.json({ success: false, error: '缺少訂單編號或發票單號' }, { status: 400 });
    }

    const targetId = orderNumber.trim();

    // 1. 從 GitHub 取得最新訂單清單（降級本機）
    const { data: remoteOrders } = await getFileFromGitHub<any[]>('data/orders.json', []);
    const currentOrders = Array.isArray(remoteOrders) && remoteOrders.length > 0 ? remoteOrders : getOrders();

    // 2. 尋找目標訂單並抹除發票
    let found = false;
    const updatedOrders: any[] = [];

    for (const order of currentOrders) {
      const match = order.orderNumber === targetId || order.id === targetId || order.orderId === targetId;
      if (match) {
        found = true;
        // 若該筆為純手動建立之紙本發票單（例如以 INV 開頭或無 tier），整筆過濾
        // 若為正常購買訂單，則移除該筆訂單的 invoice 欄位
        if (!order.tier || order.tierName === '手動建立發票單' || order.orderNumber.startsWith('INV-')) {
          continue;
        } else {
          const { invoice: _, ...orderWithoutInvoice } = order;
          updatedOrders.push(orderWithoutInvoice);
        }
      } else {
        updatedOrders.push(order);
      }
    }

    if (!found) {
      // 容錯檢查本地
      const localOrders = getOrders();
      for (const order of localOrders) {
        if (order.orderNumber === targetId || order.id === targetId) {
          const { invoice: _, ...orderWithoutInvoice } = order;
          updatedOrders.push(orderWithoutInvoice);
          found = true;
        } else {
          updatedOrders.push(order);
        }
      }
    }

    // 3. 實體 commit 寫回 GitHub 倉庫
    try {
      await saveFileToGitHub('data/orders.json', updatedOrders, `chore: 作廢刪除發票單據 ${targetId}`);
    } catch (err: any) {
      console.warn('[invoices/delete] GitHub 同步警示:', err?.message);
    }

    // 4. 同步更新本機資料庫檔案
    try {
      const localFile = path.join(process.cwd(), 'data', 'orders.json');
      if (fs.existsSync(path.dirname(localFile))) {
        fs.writeFileSync(localFile, JSON.stringify(updatedOrders, null, 2), 'utf-8');
      }
    } catch (err: any) {
      console.warn('[invoices/delete] 本機更新警示:', err?.message);
    }

    addAuditLog({
      adminId: user.id,
      adminEmail: user.email,
      action: 'invoice_status_change',
      targetId: targetId,
      targetType: 'invoice',
      details: `管理員作廢並刪除紙本發票物流單據：${targetId}，並同步更新 GitHub 倉庫`,
    });

    const remainingInvoices = updatedOrders.filter((o: any) => !!o.invoice);

    return NextResponse.json({
      success: true,
      message: `紙本發票單據「${targetId}」已成功作廢刪除！`,
      remainingCount: remainingInvoices.length,
      invoices: remainingInvoices,
    });
  } catch (error: any) {
    console.error('[invoices/delete] 刪除發票失敗:', error);
    return NextResponse.json(
      { success: false, error: error?.message || '作廢刪除發票失敗' },
      { status: 500 }
    );
  }
}
