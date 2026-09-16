/**
 * 專案緊急驗證腳本：驗證初次進站訪客模式與管理後台調整權限後的前端即時同步機制
 */
import { createUser, deleteUser, adminUpdateUser, findUserById, toSafeUser } from '../lib/db';
import { findAuthUserByEmail, updateAuthUserTiers } from '../lib/auth-users';
import { signToken, verifyToken } from '../lib/auth';

async function runTests() {
  console.log('========================================================');
  console.log('🚀 開始驗證：初次進站訪客狀態安全與後台權限調整即時同步');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ 通過: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ 失敗: ${desc}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // 一、訪客模式安全防護檢驗
  // ----------------------------------------------------
  console.log('【測試 1：初次進站預設訪客狀態檢驗】');
  const dummyToken = 'invalid-forged-token-xyz';
  const verified = verifyToken(dummyToken);
  assert(verified === null, '偽造或無效 Token 驗證失敗，無法通過');

  // ----------------------------------------------------
  // 二、後台調整會員權限後資料庫與認證層雙向即時同步
  // ----------------------------------------------------
  console.log('\n【測試 2：管理後台調整會員解鎖權限 (unlockedTiers) 即時同步】');
  const testEmail = `sync_tier_test_${Date.now()}@example.com`;
  const createdUser = createUser({
    email: testEmail,
    password: 'password123',
    name: '權限同步測試員',
    phone: '0912345678',
    company: '同步科技',
    taxId: '22099131',
    industry: '電子資訊製造業',
    address: '台北市',
  });

  assert(Boolean(createdUser.id), `建立測試會員成功，ID: ${createdUser.id}`);
  assert(
    createdUser.unlockedTiers?.length === 1 && createdUser.unlockedTiers[0] === 'free',
    '初始註冊會員預設解鎖權限僅有 "free"'
  );

  // 1. 管理後台調整權限：指派 level2
  const updatedUser1 = adminUpdateUser(createdUser.id, {
    unlockedTiers: ['free', 'level2'],
  });
  updateAuthUserTiers(createdUser.id, ['free', 'level2']);

  assert(
    Boolean(updatedUser1.unlockedTiers?.includes('level2')),
    '資料庫成功更新會員權限為包含 "level2"'
  );

  // 驗證 findUserById 讀取到最新 level2
  const freshDbUser1 = findUserById(createdUser.id);
  assert(
    Boolean(freshDbUser1?.unlockedTiers?.includes('level2')),
    '資料庫持久層即時調閱確認包含 "level2"'
  );

  // 驗證認證層同步更新
  const freshAuthUser1 = await findAuthUserByEmail(testEmail);
  assert(
    Boolean(freshAuthUser1?.unlockedTiers?.includes('level2')),
    '認證層 inMemory 快取即時同步確認包含 "level2"'
  );

  // 2. 模擬前端帶 Token 發起權限驗證 (/api/auth/me 邏輯)
  const userToken = signToken({
    userId: createdUser.id,
    email: testEmail,
    role: 'user',
  });
  const decoded = verifyToken(userToken);
  assert(Boolean(decoded && decoded.userId === createdUser.id), '會員簽署之 Token 驗證合法');

  const meUser1 = toSafeUser(findUserById(decoded!.userId)!);
  assert(
    Boolean(meUser1.unlockedTiers?.includes('level2')),
    '/api/auth/me 同步機制：回傳最新的解鎖方案包含 "level2"，前端付費牆瞬間解鎖！'
  );

  // 3. 管理後台再度調整權限：升級 level3
  const updatedUser2 = adminUpdateUser(createdUser.id, {
    unlockedTiers: ['free', 'level2', 'level3'],
  });
  updateAuthUserTiers(createdUser.id, ['free', 'level2', 'level3']);

  const meUser2 = toSafeUser(findUserById(decoded!.userId)!);
  assert(
    Boolean(meUser2.unlockedTiers?.includes('level3')),
    '/api/auth/me 同步機制：後台升級 level3 後，前端立即獲取最新 "level3"！'
  );

  // ----------------------------------------------------
  // 三、最高管理員帳號權限自動全開檢驗
  // ----------------------------------------------------
  console.log('\n【測試 3：最高管理員全方案自動開通檢驗】');
  const adminDb = findUserById('admin-master-001') || (await findAuthUserByEmail('opelwu2002@gmail.com'));
  assert(Boolean(adminDb), '成功查得最高管理員帳號');
  assert(
    Boolean(
      adminDb?.unlockedTiers?.includes('level2') &&
        adminDb?.unlockedTiers?.includes('level3') &&
        adminDb?.unlockedTiers?.includes('synastry_addon')
    ),
    '最高管理員吳俊彥帳號享有 full-tier 全套方案自動解鎖權限'
  );

  // 清理測試會員
  deleteUser(createdUser.id);
  const userAfterDel = findUserById(createdUser.id);
  assert(!userAfterDel, '測試完畢，測試會員已乾淨自儲存庫安全清理');

  console.log('\n========================================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('測試異常:', err);
  process.exit(1);
});
