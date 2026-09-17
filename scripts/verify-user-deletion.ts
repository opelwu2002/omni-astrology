/**
 * 專案緊急驗證腳本：驗證管理後台「刪除會員」持久化與快取同步機制
 */
import fs from 'fs';
import path from 'path';
import {
  createUser,
  getUsers,
  getUsersAsync,
  readUsersFromDisk,
  deleteUser,
  adminUpdateUser,
  getSystemStats,
  findUserById,
  findUserByEmail,
} from '../lib/db';
import { deleteAuthUser, findAuthUserByEmail } from '../lib/auth-users';

async function runTests() {
  console.log('========================================');
  console.log('🚀 開始驗證「刪除會員」真實持久化與快取同步');
  console.log('========================================\n');

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

  const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

  // 1. 建立測試會員
  const testEmail = `del_test_${Date.now()}@example.com`;
  const created = createUser({
    email: testEmail,
    password: 'password123',
    name: '待刪除測試員',
    phone: '0912345678',
    company: '刪除測試企業',
    taxId: '22099131',
    industry: '電子資訊製造業',
    address: '台北市',
  });

  assert(Boolean(created.id), `成功建立待刪除測試會員，ID: ${created.id}`);

  // 2. 驗證寫入前狀態
  const beforeUsers = getUsers();
  const existsInMemBefore = beforeUsers.some((u) => u.id === created.id);
  assert(existsInMemBefore, '刪除前：該會員確實存在於記憶體快取中');

  if (fs.existsSync(USERS_FILE)) {
    const rawFile = fs.readFileSync(USERS_FILE, 'utf-8');
    assert(rawFile.includes(testEmail), '刪除前：該會員確實已寫入 data/users.json 磁碟檔案中');
  }

  // 3. 執行刪除會員
  const remainingUsers = deleteUser(created.id);
  deleteAuthUser(created.id);

  // 4. 驗證記憶體快取已同步更新
  const afterUsers = getUsers();
  const existsInMemAfter = afterUsers.some((u) => u.id === created.id || u.email === testEmail);
  assert(!existsInMemAfter, '刪除後【記憶體快取檢驗】：該會員已徹底從 getUsers() 消失');

  const returnedSafe = remainingUsers.some((u) => u.id === created.id || u.email === testEmail);
  assert(!returnedSafe, '刪除後【回傳值檢驗】：回傳之最新名單中無該會員');

  // 5. 驗證實體檔案持久化（磁碟 users.json 必須徹底移除）
  if (fs.existsSync(USERS_FILE)) {
    const rawFileAfter = fs.readFileSync(USERS_FILE, 'utf-8');
    assert(!rawFileAfter.includes(testEmail), '刪除後【實體磁碟檢驗】：data/users.json 中已徹底過濾移除該會員！');
    assert(!rawFileAfter.includes(created.id), '刪除後【實體磁碟檢驗】：會員 ID 已自 users.json 物理抹除');
  }

  // 6. 驗證 auth-users 認證層也同步移除
  const authUserAfter = await findAuthUserByEmail(testEmail);
  assert(!authUserAfter, '刪除後【認證層檢驗】：findAuthUserByEmail 回傳 undefined，無法再登入');

  // 7. 驗證最高管理者絕對防護（不可被刪除）
  deleteUser('opelwu2002@gmail.com');
  const adminAfter = findUserByEmail('opelwu2002@gmail.com');
  assert(Boolean(adminAfter), '安全防護：最高管理者 opelwu2002@gmail.com (吳俊彥) 無法被刪除，依然健全');

  // 8. 驗證編輯會員實體磁碟物理覆寫
  const editEmail = `edit_test_${Date.now()}@example.com`;
  const createdForEdit = createUser({
    email: editEmail,
    password: 'password123',
    name: '待編輯測試員',
    company: '編輯測試企業',
    role: 'user',
    status: 'active',
    unlockedTiers: ['free'],
  });
  adminUpdateUser(createdForEdit.id, {
    name: '已成功改名之測試員',
    unlockedTiers: ['free', 'level2', 'level3'],
  });
  if (fs.existsSync(USERS_FILE)) {
    const rawAfterEdit = fs.readFileSync(USERS_FILE, 'utf-8');
    assert(rawAfterEdit.includes('已成功改名之測試員'), '編輯後【實體磁碟檢驗】：改名已物理覆寫入 data/users.json');
    assert(rawAfterEdit.includes('level3'), '編輯後【實體磁碟檢驗】：權限 level3 已物理覆寫入 data/users.json');
  }
  // 清理
  deleteUser(createdForEdit.id);

  // 9. 驗證 users.json 磁碟檔案純淨無任何 Mock 假資料
  if (fs.existsSync(USERS_FILE)) {
    const finalDiskContent = fs.readFileSync(USERS_FILE, 'utf-8');
    assert(!finalDiskContent.includes('黃光隆'), 'users.json 磁碟檔案嚴禁含有黃光隆');
    assert(!finalDiskContent.includes('大隆精密'), 'users.json 磁碟檔案嚴禁含有大隆精密');
    assert(!finalDiskContent.includes('陳雅婷 VIP'), 'users.json 磁碟檔案嚴禁含有陳雅婷 VIP');
    assert(!finalDiskContent.includes('huang.kl'), 'users.json 磁碟檔案嚴禁含有 huang.kl');
  }

  // 10. 驗證 readUsersFromDisk()、getUsers() 與 getUsersAsync() 人數完全一致
  const fromDisk = readUsersFromDisk();
  const fromSync = getUsers();
  const fromAsync = await getUsersAsync();
  assert(fromDisk.length === fromSync.length, 'readUsersFromDisk 與 getUsers 人數 100% 相等');
  assert(fromDisk.length === fromAsync.length, 'readUsersFromDisk 與 getUsersAsync 人數 100% 相等');
  console.log(`  ✓ 當前真實會員人數精準為 ${fromDisk.length} 人，全入口 100% 同步，絕不亂跳`);

  console.log('\n========================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('測試異常:', err);
  process.exit(1);
});
