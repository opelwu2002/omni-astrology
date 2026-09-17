/**
 * 專屬自動化測試腳本：驗證訂單與發票全面接入 GitHub API 持久化、訂單實體刪除與紙本發票作廢
 * 執行指令：npx tsx scripts/verify-orders-invoices-github-sync.ts
 */

import { strict as assert } from 'assert';
import { getFileFromGitHub, saveFileToGitHub } from '../lib/github-db';
import { GET as getOrdersHandler, POST as createOrderHandler, DELETE as deleteOrderHandler } from '../app/api/admin/orders/route';
import { GET as getInvoicesHandler, DELETE as deleteInvoiceHandler } from '../app/api/admin/invoices/route';
import { getOrders } from '../lib/db';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 開始驗證：訂單與紙本發票 GitHub API 持久化與實體刪除閉環');
  console.log('================================================================\n');

  // 【測試 1：通用 getFileFromGitHub 與 saveFileToGitHub】
  console.log('▶ 測試 1：驗證 getFileFromGitHub 與 saveFileToGitHub 通用讀寫...');
  const testPayload = [{ id: 'test-1', name: '通用資料庫測試', timestamp: Date.now() }];
  await saveFileToGitHub('data/test-generic-sync.json', testPayload, 'test: 通用儲存寫入測試');

  const { data: readBack } = await getFileFromGitHub<any[]>('data/test-generic-sync.json', []);
  assert(Array.isArray(readBack), '讀回之資料必須為陣列');
  assert.equal(readBack.length, 1);
  assert.equal(readBack[0].name, '通用資料庫測試');
  console.log('  ✓ 通過：通用讀寫測試成功！');

  // 【測試 2：建立測試訂單並帶紙本發票】
  console.log('\n▶ 測試 2：建立測試訂單 (含紙本發票)...');
  const testOrderId = `ORD${Date.now()}`;
  const createReq = new Request('http://localhost:3000/api/admin/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify({
      userId: 'test-user-sync-001',
      userEmail: 'order.sync.test@example.com',
      tier: 'level2',
      tierName: '初階個人解析 (199)',
      amount: 199,
      paymentMethod: 'manual',
      status: 'paid',
      invoice: {
        type: 'personal',
        recipientName: '發票測試員',
        recipientPhone: '0912345678',
        postalCode: '100',
        address: '台北市中正區重慶南路一段122號',
        status: 'pending',
      },
      note: '自動化測試用訂單',
    }),
  });

  const createRes = await createOrderHandler(createReq);
  const createData = await createRes.json();
  assert.equal(createRes.status, 200, '建立訂單必須回傳 200');
  assert.equal(createData.success, true, '建立訂單必須成功');
  const createdOrderNumber = createData.order.orderNumber;
  console.log('  ✓ 通過：訂單建立成功，訂單編號:', createdOrderNumber);

  // 【測試 3：驗證 GET /api/admin/orders 包含該訂單】
  console.log('\n▶ 測試 3：驗證 GET /api/admin/orders 能夠讀取到該筆新訂單...');
  const getOrdersReq = new Request('http://localhost:3000/api/admin/orders', {
    method: 'GET',
    headers: { Authorization: 'Bearer omni-master-admin-token' },
  });
  const getOrdersRes = await getOrdersHandler(getOrdersReq);
  const getOrdersData = await getOrdersRes.json();
  assert(getOrdersData.orders.some((o: any) => o.orderNumber === createdOrderNumber), '清單必須包含該筆訂單');
  console.log('  ✓ 通過：訂單列表成功呈現新訂單！');

  // 【測試 4：驗證 GET /api/admin/invoices 包含該發票】
  console.log('\n▶ 測試 4：驗證 GET /api/admin/invoices 能夠讀取到該筆紙本發票...');
  const getInvReq = new Request('http://localhost:3000/api/admin/invoices', {
    method: 'GET',
    headers: { Authorization: 'Bearer omni-master-admin-token' },
  });
  const getInvRes = await getInvoicesHandler(getInvReq);
  const getInvData = await getInvRes.json();
  assert(getInvData.invoices.some((o: any) => o.orderNumber === createdOrderNumber), '發票清單必須包含該筆訂單發票');
  console.log('  ✓ 通過：發票物流清單成功讀取到該發票！');

  // 【測試 5：測試紙本發票作廢刪除 (DELETE /api/admin/invoices)】
  console.log('\n▶ 測試 5：測試紙本發票作廢刪除 (DELETE /api/admin/invoices)...');
  const delInvReq = new Request(`http://localhost:3000/api/admin/invoices?orderNumber=${createdOrderNumber}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer omni-master-admin-token' },
  });
  const delInvRes = await deleteInvoiceHandler(delInvReq);
  const delInvData = await delInvRes.json();
  assert.equal(delInvRes.status, 200, '發票刪除 API 必須回傳 200');
  assert.equal(delInvData.success, true, '發票刪除必須回傳 success: true');

  // 再次檢查發票清單，該發票必須已被抹除
  const getInvRes2 = await getInvoicesHandler(getInvReq);
  const getInvData2 = await getInvRes2.json();
  assert(!getInvData2.invoices.some((o: any) => o.orderNumber === createdOrderNumber), '發票清單中該訂單發票必須徹底抹除');
  console.log('  ✓ 通過：紙本發票已成功作廢抹除！發票列表不再出現該單據！');

  // 【測試 6：測試訂單實體刪除 (DELETE /api/admin/orders)】
  console.log('\n▶ 測試 6：測試訂單實體刪除 (DELETE /api/admin/orders)...');
  const delOrderReq = new Request(`http://localhost:3000/api/admin/orders?orderNumber=${createdOrderNumber}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer omni-master-admin-token' },
  });
  const delOrderRes = await deleteOrderHandler(delOrderReq);
  const delOrderData = await delOrderRes.json();
  assert.equal(delOrderRes.status, 200, '訂單刪除 API 必須回傳 200');
  assert.equal(delOrderData.success, true, '訂單刪除必須回傳 success: true');

  // 再次呼叫 GET /api/admin/orders 檢驗該訂單是否徹底消失
  const getOrdersRes2 = await getOrdersHandler(getOrdersReq);
  const getOrdersData2 = await getOrdersRes2.json();
  assert(!getOrdersData2.orders.some((o: any) => o.orderNumber === createdOrderNumber), '訂單列表中絕不可再有該訂單！杜絕幽靈復活！');
  console.log('  ✓ 通過：訂單已自 GitHub 倉庫與資料庫中實體刪除，重新整理亦絕對不會殘留或復活！');

  console.log('\n================================================================');
  console.log('🎉 全部 6 大項測試 100% 通過！訂單與發票已全面接入 GitHub 雲端持久化！');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ 驗證失敗:', err);
  process.exit(1);
});

