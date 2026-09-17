/**
 * 自動化驗證腳本：後台編輯會員資料 API (/api/admin/users/update) 與 Modal 控制檢驗
 * 執行命令：npx tsx scripts/verify-user-edit-modal-and-api.ts
 */

import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { PUT as updateRouteHandler } from '../app/api/admin/users/update/route';
import { createAuthUser, findAuthUserByEmail, deleteAuthUserAsync } from '../lib/auth-users';
import { signToken } from '../lib/auth';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 開始驗證：後台編輯會員資料 API (/api/admin/users/update) 與 Modal 控制');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function testAssert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ 通過: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ 失敗: ${desc}`);
      failed++;
    }
  }

  // 【測試 1：後端更新端點檔案與導出檢查】
  console.log('【測試 1：檢驗 app/api/admin/users/update/route.ts 實體檔案】');
  const updateRoutePath = path.join(process.cwd(), 'app', 'api', 'admin', 'users', 'update', 'route.ts');
  testAssert(fs.existsSync(updateRoutePath), 'app/api/admin/users/update/route.ts 檔案必須存在');
  const updateRouteCode = fs.readFileSync(updateRoutePath, 'utf-8');
  testAssert(updateRouteCode.includes('export async function PUT'), '必須匯出 PUT 方法處理更新');
  testAssert(updateRouteCode.includes('export async function POST'), '必須匯出 POST 方法作為相容備援');

  // 【測試 2：前端 app/admin/page.tsx 控制邏輯檢驗】
  console.log('\n【測試 2：檢驗前端 app/admin/page.tsx handleSaveEditUser 與 Modal 關閉控制】');
  const adminPagePath = path.join(process.cwd(), 'app', 'admin', 'page.tsx');
  const adminPageCode = fs.readFileSync(adminPagePath, 'utf-8');

  testAssert(
    adminPageCode.includes("fetch('/api/admin/users/update'"),
    '前端表單必須發送請求至 /api/admin/users/update'
  );
  testAssert(
    adminPageCode.includes('setIsSavingUser(true)') && adminPageCode.includes('setIsSavingUser(false)'),
    '具備完整的 isSavingUser 狀態管理與 finally 復原'
  );
  testAssert(
    adminPageCode.includes('setIsEditUserModalOpen(false)'),
    '成功後必須明確關閉 Modal (setIsEditUserModalOpen(false))'
  );
  testAssert(
    adminPageCode.includes('fetchUsers()'),
    '成功後必須即時觸發 fetchUsers() 刷新會員名單'
  );
  testAssert(
    adminPageCode.includes('disabled={isSavingUser}'),
    '按鈕與表單控制具備 disabled={isSavingUser} 避免重複送出'
  );

  // 【測試 3：後端 API 整合測試 - 完整更新會員流程】
  console.log('\n【測試 3：檢驗 PUT /api/admin/users/update 真實業務更新行為】');
  const testEmail = `edit.member.${Date.now()}@example.com`;
  const adminToken = signToken({
    userId: 'admin-master-001',
    email: 'opelwu2002@gmail.com',
    role: 'admin',
  });

  try {
    // 3.1 建立測試會員
    const created = await createAuthUser({
      email: testEmail,
      password: 'Password123!',
      name: '原名測試員',
      phone: '0912345678',
      industry: '其他',
      address: '台北市信義區信義路一段1號',
    });
    testAssert(created.name === '原名測試員', '初始會員建立成功');

    // 3.2 發送 PUT 請求更新姓名、狀態與權限等級
    const req = new Request('http://localhost:3000/api/admin/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        targetUserId: created.id,
        name: '更新後尊榮會員',
        status: 'active',
        unlockedTiers: ['free', 'level2', 'level3'],
      }),
    });

    const res = await updateRouteHandler(req);
    testAssert(res.status === 200, `API 必須回傳 HTTP 200 (實際: ${res.status})`);
    const data = await res.json();
    testAssert(data.success === true, '回傳 JSON 必須包含 success: true');
    testAssert(data.user?.name === '更新後尊榮會員', '會員姓名已成功修改為「更新後尊榮會員」');
    testAssert(data.user?.unlockedTiers.includes('level3'), '解鎖權限已成功更新包含 level3');

    // 3.3 再次從儲存庫檢驗該會員資料
    const verifiedUser = await findAuthUserByEmail(testEmail);
    testAssert(verifiedUser?.name === '更新後尊榮會員', '自儲存庫讀取確認姓名已持久化更新');
    testAssert(verifiedUser?.unlockedTiers.includes('level3') === true, '自儲存庫讀取確認 level3 權限已持久化更新');

    // 3.4 缺少 targetUserId 時驗證
    const invalidReq = new Request('http://localhost:3000/api/admin/users/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: '無 ID 測試' }),
    });
    const invalidRes = await updateRouteHandler(invalidReq);
    testAssert(invalidRes.status === 400, '缺少 ID 時必須回傳 400 錯誤');

    // 3.5 無管理員權限時驗證
    const unauthReq = new Request('http://localhost:3000/api/admin/users/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: created.id, name: '未授權' }),
    });
    const unauthRes = await updateRouteHandler(unauthReq);
    testAssert(unauthRes.status === 403, '未帶 Token 或非管理員時必須回傳 403');
  } finally {
    // 清理測試會員
    await deleteAuthUserAsync(testEmail);
  }

  console.log('\n================================================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('❌ 測試執行發生異常:', err);
  process.exit(1);
});
