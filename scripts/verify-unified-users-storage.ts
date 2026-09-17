/**
 * 驗證腳本：單一事實來源 (Single Source of Truth) 與真實會員註冊後台一致性驗證
 * 針對「用 kc7470@gmail.com（黃光隆）註冊時顯示已註冊，但後台會員名單找不到人」的核心 Bug 進行全流程閉環檢驗。
 */

import { strict as assert } from 'assert';
import {
  getAllUsers,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../lib/usersStorage';
import { getUsers, toSafeUser } from '../lib/auth-users';
import { getUsersAsync } from '../lib/db';
import { POST as registerHandler } from '../app/api/auth/register/route';
import { GET as adminGetUsersHandler } from '../app/api/admin/users/route';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 開始驗證：單一事實來源 (Single Source of Truth) & 黃光隆註冊一致性');
  console.log('================================================================\n');

  // 1. 初始化資料載入
  console.log('▶ 步驟 1：檢驗儲存庫初次載入與資料庫同步...');
  const initialUsers = await getAllUsers();
  console.log(`  ✓ 當前系統會員總數: ${initialUsers.length} 人`);
  assert(Array.isArray(initialUsers), '會員名單必須為陣列');
  assert(
    initialUsers.some((u) => u.email === 'opelwu2002@gmail.com'),
    '系統必須包含站長 opelwu2002@gmail.com'
  );

  // 2. 清理現有的 kc7470@gmail.com（若有）以確保乾淨測試
  console.log('\n▶ 步驟 2：預備環境，確保 kc7470@gmail.com 處於乾淨基準狀態...');
  const existingUser = await findUserByEmail('kc7470@gmail.com');
  if (existingUser) {
    console.log(`  - 偵測到現有測試帳號 id: ${existingUser.id}，進行重設...`);
    await deleteUser(existingUser.id);
  }
  const checkCleared = await findUserByEmail('kc7470@gmail.com');
  assert(checkCleared === undefined, 'kc7470@gmail.com 必須已清理完畢');
  console.log('  ✓ 乾淨基準狀態確認完成');

  // 3. 模擬透過 POST /api/auth/register 註冊「黃光隆 (kc7470@gmail.com)」
  console.log('\n▶ 步驟 3：模擬真實 API 註冊「黃光隆 (kc7470@gmail.com)」...');
  const registerPayload = {
    email: 'kc7470@gmail.com',
    password: 'TestPassword123!',
    name: '黃光隆',
    phone: '0988776655',
    company: '大隆工業',
    industry: '製造業',
    address: '台中市西屯區工業區一路',
  };

  const fakeRegisterReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });

  const registerRes = await registerHandler(fakeRegisterReq);
  const registerData = await registerRes.json();

  console.log('  - 註冊 API 回傳狀態:', registerRes.status);
  console.log('  - 註冊 API 回傳內容:', registerData);
  assert([200, 201].includes(registerRes.status), '註冊 API 必須回傳 200 或 201');
  assert.equal(registerData.success, true, '註冊必須回傳 success: true');
  assert.equal(registerData.user.email, 'kc7470@gmail.com', '回傳會員 Email 必須為 kc7470@gmail.com');
  assert.equal(registerData.user.name, '黃光隆', '回傳會員姓名必須為 黃光隆');

  // 4. 驗證 Single Source of Truth：立即可於儲存核心讀取到黃光隆
  console.log('\n▶ 步驟 4：檢驗儲存核心立即讀取到「黃光隆 (kc7470@gmail.com)」...');
  const savedUser = await findUserByEmail('kc7470@gmail.com');
  assert(savedUser !== undefined, '儲存核心必須能透過 Email 查找到 kc7470@gmail.com');
  assert.equal(savedUser?.name, '黃光隆', '姓名必須為「黃光隆」，絕不被過濾');
  assert.equal(savedUser?.email, 'kc7470@gmail.com', 'Email 必須吻合');
  console.log(`  ✓ 儲存核心已確認存在會員: [${savedUser?.id}] ${savedUser?.name} (${savedUser?.email})`);

  // 5. 驗證全域所有讀取出口 100% 保持一致，無 Split-Brain
  console.log('\n▶ 步驟 5：檢驗所有 API 與轉發層出口資料 100% 同步...');
  // (a) usersStorage.getAllUsers()
  const listFromStorage = await getAllUsers();
  assert(
    listFromStorage.some((u) => u.email === 'kc7470@gmail.com' && u.name === '黃光隆'),
    'usersStorage.getAllUsers() 必須包含黃光隆'
  );

  // (b) lib/auth-users.ts getUsers()
  const listFromAuthUsers = getUsers();
  assert(
    listFromAuthUsers.some((u) => u.email === 'kc7470@gmail.com' && u.name === '黃光隆'),
    'lib/auth-users.ts getUsers() 必須包含黃光隆'
  );

  // (c) lib/db/index.ts getUsersAsync()
  const listFromDb = await getUsersAsync();
  assert(
    listFromDb.some((u) => u.email === 'kc7470@gmail.com' && u.name === '黃光隆'),
    'lib/db/index.ts getUsersAsync() 必須包含黃光隆'
  );

  // (d) 後台管理 API GET /api/admin/users
  const fakeAdminReq = new Request('http://localhost:3000/api/admin/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
  });
  const adminRes = await adminGetUsersHandler(fakeAdminReq);
  const adminData = await adminRes.json();
  assert.equal(adminRes.status, 200, '後台 GET API 必須回傳 200 OK');
  assert(Array.isArray(adminData.users), '後台 API 回傳之 users 必須為陣列');
  const adminHuangUser = adminData.users.find((u: any) => u.email === 'kc7470@gmail.com');
  assert(adminHuangUser, '後台會員管理清單必須 100% 呈現黃光隆 (kc7470@gmail.com)！');
  assert.equal(adminHuangUser.name, '黃光隆', '後台呈現的姓名必須為「黃光隆」');
  console.log(`  ✓ 後台 API 成功讀取到黃光隆會員！會員總數: ${adminData.users.length}`);

  // 6. 模擬二次重複註冊 kc7470@gmail.com
  console.log('\n▶ 步驟 6：測試重複註冊防護，驗證報錯時後台會員依然存在（杜絕狀態分裂）...');
  const fakeDuplicateRegisterReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });
  const duplicateRegisterRes = await registerHandler(fakeDuplicateRegisterReq);
  const duplicateData = await duplicateRegisterRes.json();
  console.log('  - 重複註冊回傳狀態:', duplicateRegisterRes.status);
  console.log('  - 重複註冊錯誤訊息:', duplicateData.error);
  assert.equal(duplicateRegisterRes.status, 400, '重複註冊應回傳 400 Bad Request');
  assert(
    duplicateData.error.includes('已被註冊') || duplicateData.error.includes('already exists'),
    '重複註冊必須回傳已被註冊之錯誤訊息'
  );

  // 重複註冊後，再度確認後台清單絕不丟失
  const fakeAdminReq2 = new Request('http://localhost:3000/api/admin/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
  });
  const afterDuplicateAdminRes = await adminGetUsersHandler(fakeAdminReq2);
  const afterDuplicateData = await afterDuplicateAdminRes.json();
  const stillExistsInAdmin = afterDuplicateData.users.find((u: any) => u.email === 'kc7470@gmail.com');
  assert(stillExistsInAdmin, '重複註冊報錯後，後台名單中黃光隆依然 100% 存在，完全不丟失！');
  console.log('  ✓ 重複註冊防護通過：正確提示已註冊，且後台名單完好無損');

  // 7. 測試幽靈假帳號過濾防線（確保只過濾特定寫死假 Email，不誤殺真實用戶）
  console.log('\n▶ 步驟 7：檢驗幽靈帳號過濾機制（特定假 Email huang.kl@omni-enterprise.tw 依然被杜絕）...');
  const ghostPayload = {
    email: 'huang.kl@omni-enterprise.tw',
    password: 'MockPassword123!',
    name: '假帳號測試員',
  };
  const ghostReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ghostPayload),
  });
  const ghostRes = await registerHandler(ghostReq);
  const ghostData = await ghostRes.json();
  assert.equal(ghostRes.status, 400, '假網域帳號必須被註冊端點拒絕 (400)');
  console.log('  ✓ 假 Email 阻擋機制正常，成功攔截幽靈網域');

  console.log('\n================================================================');
  console.log('🎉 所有驗證通過！單一事實來源架構完美運作，黃光隆先生已可正常註冊且後台即時可見！');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ 驗證失敗:', err);
  process.exit(1);
});
