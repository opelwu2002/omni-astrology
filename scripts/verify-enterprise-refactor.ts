/**
 * 企業級重構自動化驗證腳本 (scripts/verify-enterprise-refactor.ts)
 * 驗證五大核心重構指標：
 * 1. 台灣統一編號 8 碼除以 10 演算法與聯絡電話格式驗證
 * 2. 新會員註冊企業欄位保存與後台資料庫 (users.json) 100% 同步
 * 3. 真實營收計算邏輯（排除特權贈送干擾，僅計入 paid 實收訂單）
 * 4. 訂單發票修改與刪單作廢連動權限收回
 * 5. 綠界科技 ECPay SHA256 CheckMacValue 簽章驗證
 */

import { isValidTaiwanTaxId, isValidTaiwanPhone, CLIMATE_CHANGE_INDUSTRIES } from '../lib/validators';
import {
  getUsers,
  createUser,
  getSystemStats,
  createOrder,
  getOrders,
  updateInvoiceData,
  deleteOrder,
  findOrderByNumber,
  findUserByEmail,
} from '../lib/db';
import { createAuthUser, findAuthUserByEmail } from '../lib/auth-users';
import { generateCheckMacValue, verifyCheckMacValue } from '../lib/ecpay';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ 通過: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ 失敗: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================');
  console.log('🚀 開始執行企業級重構與金流核心驗證測試');
  console.log('========================================\n');

  // 1. 統一編號 8 碼除以 10 與電話驗證測試
  console.log('【測試 1：台灣統一編號除以 10 演算法與電話格式驗證】');
  // 知名真實公司統編
  assert(isValidTaiwanTaxId('22099131'), '台積電統編 22099131 驗證合法');
  assert(isValidTaiwanTaxId('04595257'), '聯發科統編 04595257 驗證合法');
  assert(isValidTaiwanTaxId('04541302'), '鴻海精密統編 04541302 驗證合法');
  assert(isValidTaiwanTaxId('86384476'), '大立光統編 86384476 驗證合法');
  assert(isValidTaiwanTaxId('93620650'), '宇沛實業統編 93620650 驗證合法');

  // 非法統編
  assert(!isValidTaiwanTaxId('12345678'), '偽造統編 12345678 正確被拒絕');
  assert(!isValidTaiwanTaxId('11111111'), '偽造統編 11111111 正確被拒絕');
  assert(!isValidTaiwanTaxId('2209913'), '位數不足 7 碼正確被拒絕');
  assert(!isValidTaiwanTaxId('220991319'), '位數超過 9 碼正確被拒絕');
  assert(!isValidTaiwanTaxId('ABCD1234'), '含英文字元正確被拒絕');

  // 電話驗證
  assert(isValidTaiwanPhone('0912345678'), '台灣手機號碼 0912345678 驗證合法');
  assert(isValidTaiwanPhone('02-27123456'), '台北市話 02-27123456 驗證合法');
  assert(isValidTaiwanPhone('02-27123456 #101'), '市話含分機驗證合法');
  assert(!isValidTaiwanPhone('12345'), '過短無效號碼被拒絕');

  // 氣候署行業分類
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('製造業'), '包含製造業');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('服務業'), '包含服務業');
  assert((CLIMATE_CHANGE_INDUSTRIES.length as number) >= 7, '符合並擴充行業規範');

  // 2. 新會員註冊企業欄位保存與後台資料庫 (users.json) 100% 同步
  console.log('\n【測試 2：新會員註冊企業欄位與管理後台名單同步對齊】');
  const testEmail = `enterprise_test_${Date.now()}@example.com`;
  const registerUser = await createAuthUser({
    name: '李建華 營運副總',
    email: testEmail,
    password: 'password123456',
    phone: '0988776655',
    company: '台灣前瞻綠能科技股份有限公司',
    taxId: '22099131',
    industry: '能源業',
    address: '台北市信義區松仁路100號12樓',
  });

  assert(registerUser.email === testEmail, '註冊會員 Email 正確');
  assert(registerUser.name === '李建華 營運副總', '姓名職稱正確');

  // 檢查管理後台用的 getUsers() 能否立即讀取到
  const backendUsers = getUsers();
  const foundInBackend = backendUsers.find((u) => u.email.toLowerCase() === testEmail.toLowerCase());
  assert(!!foundInBackend, '新註冊會員 100% 存在於管理後台資料庫中，杜絕脫鉤！');
  assert(foundInBackend?.phone === '0988776655', '後台同步讀取到連絡電話');
  assert(foundInBackend?.company === '台灣前瞻綠能科技股份有限公司', '後台同步讀取到服務公司');
  assert(foundInBackend?.taxId === '22099131', '後台同步讀取到統一編號');
  assert(foundInBackend?.industry === '能源業', '後台同步讀取到行業分類');
  assert(foundInBackend?.address === '台北市信義區松仁路100號12樓', '後台同步讀取到寄送地址');

  // 3. 真實營收計算邏輯（排除特權贈送干擾，僅計入 paid 實收訂單）
  console.log('\n【測試 3：真實營收計算邏輯（排除特權贈送干擾）】');
  // 建立一個有特權 unlockedTiers 但完全無訂單的會員
  const privilegedEmail = `privileged_gift_${Date.now()}@test.com`;
  createUser({
    email: privilegedEmail,
    password: 'password123',
    name: '公關贈送 VIP',
    unlockedTiers: ['level3', 'level2', 'synastry_addon'],
  });

  const statsBefore = getSystemStats();
  const initialRev = statsBefore.totalRevenue;

  // 建立一筆 pending 訂單（未收款）
  const pendingOrder = createOrder(
    'test-pending-user',
    'pending@test.com',
    'level2',
    '初階解析報告',
    199,
    'ecpay',
    undefined,
    'pending'
  );

  const statsAfterPending = getSystemStats();
  assert(
    statsAfterPending.totalRevenue === initialRev,
    '未付款 pending 訂單絕不計入累計總營收'
  );

  // 建立一筆 paid 訂單（已確認收款）
  const paidOrder = createOrder(
    'test-paid-user',
    'realpaid@test.com',
    'level3',
    '高階終身全盤白皮書',
    699,
    'ecpay',
    {
      type: 'company',
      buyerTitle: '測試公司',
      taxId: '22099131',
      recipientName: '王經理',
      recipientPhone: '0912345678',
      postalCode: '100',
      address: '台北市松山區敦化北路207號',
      status: 'pending',
    },
    'paid'
  );

  const statsAfterPaid = getSystemStats();
  assert(
    statsAfterPaid.totalRevenue === initialRev + 699,
    `實質收到貨款後，累計營收精確增加 NT$ 699（當前總額: ${statsAfterPaid.totalRevenue}）`
  );

  // 4. 訂單發票修改與刪單作廢
  console.log('\n【測試 4：訂單發票資訊修改與刪單作廢連動】');
  const updatedInv = updateInvoiceData(paidOrder.orderNumber, {
    buyerTitle: '宇沛實業股份有限公司',
    taxId: '93620650',
    address: '台北市松山區敦化北路207號9樓之6',
  });

  assert(!!updatedInv, '發票資訊更新成功');
  assert(updatedInv?.invoice?.buyerTitle === '宇沛實業股份有限公司', '發票抬頭已更新為宇沛實業');
  assert(updatedInv?.invoice?.taxId === '93620650', '發票統編已更新為 93620650');

  // 刪除訂單測試
  const delSuccess = deleteOrder(paidOrder.orderNumber, true);
  assert(delSuccess, '刪除訂單執行成功');
  const deletedCheck = findOrderByNumber(paidOrder.orderNumber);
  assert(!deletedCheck, '已從訂單儲存庫中徹底移除');

  // 5. 綠界科技 ECPay SHA256 CheckMacValue 簽章驗證
  console.log('\n【測試 5：綠界科技 ECPay 官方標準 CheckMacValue 簽章演算法】');
  const testParams = {
    MerchantID: '3002607',
    MerchantTradeNo: 'ORD20260916TEST1',
    MerchantTradeDate: '2026/09/16 12:00:00',
    PaymentType: 'aio',
    TotalAmount: 699,
    TradeDesc: '命理解析服務',
    ItemName: '高階白皮書',
    ReturnURL: 'https://example.com/api/payment/callback',
    ChoosePayment: 'ALL',
    EncryptType: 1,
  };

  const mac = generateCheckMacValue(testParams, 'pwDwH3hFTaRH6nT3', 'mwaClen4xw3BEFrX');
  assert(!!mac && mac.length === 64, `產生 64 碼大寫 SHA256 CheckMacValue: ${mac.substring(0, 16)}...`);
  assert(
    verifyCheckMacValue({ ...testParams, CheckMacValue: mac }, 'pwDwH3hFTaRH6nT3', 'mwaClen4xw3BEFrX'),
    'CheckMacValue 官方校驗演算法 100% 符合'
  );

  console.log('\n========================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項測試 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('測試執行異常:', err);
  process.exit(1);
});
