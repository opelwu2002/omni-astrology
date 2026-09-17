/**
 * 自動化驗證腳本：GitHub 倉庫雲端資料庫 (lib/github-db.ts) 與無縫 CRUD 檢驗
 * 執行命令：npx tsx scripts/verify-github-db.ts
 */

import assert from 'assert';
import {
  getGitHubDbConfig,
  isGitHubDbConfigured,
  filterOutGhostUsers,
  fetchUsersFromGithub,
  commitUsersToGithub,
} from '../lib/github-db';
import {
  createAuthUser,
  findAuthUserByEmail,
  getAllAuthUsersAsync,
  updateAuthUserTiers,
  deleteAuthUserAsync,
  verifyUserCredentials,
} from '../lib/auth-users';
import { getUsersAsync } from '../lib/db';

async function runTests() {
  console.log('================================================================');
  console.log('🚀 開始驗證：GitHub 倉庫雲端資料庫存取層與全站無縫對接');
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

  // 【測試 1：GitHub DB 配置解析】
  console.log('【測試 1：檢驗 GitHub 資料庫設定與環境變數解析】');
  const config = getGitHubDbConfig();
  testAssert(config.owner === 'opelwu2002', `預設 Owner 必須為 opelwu2002 (目前: ${config.owner})`);
  testAssert(config.repo === 'omni-astrology', `預設 Repo 必須為 omni-astrology (目前: ${config.repo})`);
  testAssert(config.branch === 'main', `預設 Branch 必須為 main (目前: ${config.branch})`);
  testAssert(config.filePath === 'data/users.json', `預設儲存路徑為 data/users.json (目前: ${config.filePath})`);

  // 【測試 2：幽靈資料過濾防線】
  console.log('\n【測試 2：檢驗幽靈會員嚴密過濾機制（不誤殺真實用戶）】');
  const dirtyData = [
    { email: 'opelwu2002@gmail.com', name: '吳俊彥' },
    { email: 'huang.kl@omni-enterprise.tw', name: '假資料黃光隆' },
    { email: 'kc7470@gmail.com', name: '黃光隆' },
    { email: 'admin@omni-astrology.com', name: '舊管理員' },
    { email: 'peirung1121@gmail.com', name: '吳沛融' },
  ];
  const cleaned = filterOutGhostUsers(dirtyData);
  testAssert(cleaned.length === 3, `幽靈資料應被精準剔除剩餘 3 筆 (實際: ${cleaned.length})`);
  testAssert(
    !cleaned.some((u) => u.email === 'huang.kl@omni-enterprise.tw' || u.email === 'admin@omni-astrology.com'),
    '絕對禁止特定假 Email 進入資料陣列'
  );
  testAssert(
    cleaned.some((u) => u.email === 'kc7470@gmail.com' && u.name === '黃光隆'),
    '真實會員黃光隆（kc7470@gmail.com）必須被合法保留，絕不依姓名誤殺！'
  );
  testAssert(
    cleaned.some((u) => u.email === 'opelwu2002@gmail.com') &&
      cleaned.some((u) => u.email === 'peirung1121@gmail.com'),
    '合法會員吳俊彥與吳沛融被正確保留'
  );

  // 【測試 3：讀取函式 fetchUsersFromGithub】
  console.log('\n【測試 3：檢驗 fetchUsersFromGithub 讀取與本機降級機制】');
  const readRes = await fetchUsersFromGithub();
  testAssert(Array.isArray(readRes.users), '回傳之 users 必須為陣列');
  testAssert(readRes.users.length >= 2, `讀取到的會員清單至少需包含 2 位現有會員 (實際: ${readRes.users.length})`);
  testAssert(
    readRes.users.some((u) => u.email === 'opelwu2002@gmail.com'),
    '會員清單中必須包含最高管理員 opelwu2002@gmail.com'
  );

  // 【測試 4：全流程 CRUD：新會員建立、登入比對、權限更新、刪除】
  console.log('\n【測試 4：檢驗全流程會員 CRUD 與 GitHub/本地儲存庫聯動】');
  const testEmail = `github.db.test.${Date.now()}@example.com`;
  const testPassword = 'Password2026!';

  try {
    // 4.1 建立會員
    const createdUser = await createAuthUser({
      email: testEmail,
      password: testPassword,
      name: 'GitHub儲存測試員',
      phone: '0988776655',
      company: '星辰科研科技',
      taxId: '54321098',
      industry: '服務業（如金融、觀光、醫療、餐飲等）',
      address: '台北市信義區松仁路100號',
    });
    testAssert(createdUser.email === testEmail, '新會員 Email 正確寫入');
    testAssert(createdUser.role === 'user', '預設角色為 user');

    // 4.2 登入比對
    const loginRes = await verifyUserCredentials(testEmail, testPassword);
    testAssert(loginRes.success === true, '使用註冊密碼登入比對成功');
    testAssert(loginRes.user?.email === testEmail, '登入取回安全會員物件無誤');

    // 4.3 權限更新
    updateAuthUserTiers(testEmail, ['free', 'level2', 'level3']);
    const updatedUser = await findAuthUserByEmail(testEmail);
    testAssert(
      updatedUser?.unlockedTiers.includes('level3') === true,
      '會員解鎖權限已成功更新包含 level3'
    );

    // 4.4 確保 getAllAuthUsersAsync 包含新註冊會員
    const allUsers = await getAllAuthUsersAsync();
    testAssert(
      allUsers.some((u) => u.email === testEmail),
      'getAllAuthUsersAsync() 成功即時撈取新會員'
    );

    // 4.5 確保 lib/db 之 getUsersAsync 也同步更新
    const dbUsers = await getUsersAsync();
    testAssert(
      dbUsers.some((u) => u.email === testEmail),
      'lib/db 的 getUsersAsync() 也同步取得新會員'
    );

    // 4.6 永久刪除該會員
    await deleteAuthUserAsync(testEmail);
    const afterDeleteUsers = await getAllAuthUsersAsync();
    testAssert(
      !afterDeleteUsers.some((u) => u.email === testEmail),
      'deleteAuthUserAsync() 成功自儲存庫徹底抹除該會員'
    );
  } finally {
    // 防禦性清理
    await deleteAuthUserAsync(testEmail);
  }

  // 【測試 5：最高管理員保護防線】
  console.log('\n【測試 5：檢驗最高管理員安全防刪保護】');
  await deleteAuthUserAsync('opelwu2002@gmail.com');
  const masterCheck = await findAuthUserByEmail('opelwu2002@gmail.com');
  testAssert(Boolean(masterCheck), '最高管理者 opelwu2002@gmail.com 受到防刪保護，絕對不可被刪除');

  const masterLogin = await verifyUserCredentials('admin', 'Opel6439');
  testAssert(masterLogin.success === true, 'admin / Opel6439 最高管理員憑證驗證成功');

  console.log('\n================================================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('❌ 測試執行發生未捕獲異常:', err);
  process.exit(1);
});
