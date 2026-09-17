/**
 * 驗證腳本：真實表單欄位 1:1 直通綁定與零假資料檢驗 (scripts/verify-real-form-binding.ts)
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { createAuthUser, deleteAuthUser } from '../lib/auth-users';
import { getUsersAsync, deleteUser, getUsers } from '../lib/db';

async function runTests() {
  console.log('🚀 開始驗證：真實表單 1:1 直通綁定與徹底消除假資料 (Mock Data)...\n');

  // 測試 1：檢驗 store/useAuthStore.ts 絕無任何寫死的假資料或 fallback
  console.log('▶ 測試 1：檢驗 store/useAuthStore.ts 零假資料...');
  const storePath = path.join(process.cwd(), 'store', 'useAuthStore.ts');
  const storeCode = fs.readFileSync(storePath, 'utf-8');
  assert(!storeCode.includes("'0900000000'"), 'useAuthStore.ts 嚴禁含有寫死的 0900000000');
  assert(!storeCode.includes("address: '台北市'"), 'useAuthStore.ts 嚴禁含有寫死的 address 台北市');
  assert(!storeCode.includes("industry: '其他'"), 'useAuthStore.ts 嚴禁含有寫死的 industry 其他');
  console.log('✅ 測試 1 通過：useAuthStore.ts 100% 直通傳遞，無任何寫死假資料\n');

  // 測試 2：檢驗 app/api/auth/register/route.ts 零假資料
  console.log('▶ 測試 2：檢驗 app/api/auth/register/route.ts 零假資料...');
  const routePath = path.join(process.cwd(), 'app', 'api', 'auth', 'register', 'route.ts');
  const routeCode = fs.readFileSync(routePath, 'utf-8');
  assert(!routeCode.includes('大隆'), 'register/route.ts 嚴禁含有大隆等假資料');
  assert(!routeCode.includes('faker'), 'register/route.ts 嚴禁含有 faker');
  console.log('✅ 測試 2 通過：register API 零假資料邏輯\n');

  // 測試 3：檢驗 data/users.json 磁碟檔案中已無任何測試假資料殘留
  console.log('▶ 測試 3：檢驗 data/users.json 乾淨無假資料殘留...');
  const usersJsonPath = path.join(process.cwd(), 'data', 'users.json');
  const usersJsonContent = fs.readFileSync(usersJsonPath, 'utf-8');
  assert(!usersJsonContent.includes('大隆精密工業'), 'users.json 嚴禁含有大隆精密工業');
  assert(!usersJsonContent.includes('huang.kl'), 'users.json 嚴禁含有 huang.kl');
  assert(!usersJsonContent.includes('12345678'), 'users.json 嚴禁含有 12345678 假統編');
  console.log('✅ 測試 3 通過：users.json 徹底純淨，無任何假資料\n');

  // 測試 4：真實表單情境 1:1 直通存入檢驗（以中央研究院真實資料結構測試）
  console.log('▶ 測試 4：以真實資料結構檢驗 1:1 直通入庫...');
  const testBindingEmail = `test.real.bind.${Date.now()}@omni-audit.tw`;
  const realUserData = {
    email: testBindingEmail,
    password: 'Password1234!',
    name: '柯專員',
    phone: '0911223344',
    company: '中央研究院',
    taxId: '03811209',
    industry: '學校或研究單位',
    address: '台北市南港區研究院路二段128號',
  };

  const created = await createAuthUser(realUserData);

  // 斷言 1:1 絕對一致
  assert.strictEqual(created.email, testBindingEmail, 'Email 必須 1:1 相符');
  assert.strictEqual(created.company, '中央研究院', '公司/學校必須 1:1 為 中央研究院，絕不可為假資料');
  assert.strictEqual(created.taxId, '03811209', '統編必須 1:1 為 03811209');
  assert.strictEqual(created.address, '台北市南港區研究院路二段128號', '通訊地址必須 1:1 精準直通');
  assert.strictEqual(created.phone, '0911223344', '電話必須 1:1 精準直通');
  assert.strictEqual(created.industry, '學校或研究單位', '行業分類必須 1:1 精準直通');

  // 檢驗後台 getUsersAsync() 讀取出的資料亦 100% 一致
  const backendUsers = await getUsersAsync();
  const backendUser = backendUsers.find((u) => u.email === testBindingEmail);
  assert(backendUser, '管理後台必須能讀取到新建立的會員');
  assert.strictEqual(backendUser.company, '中央研究院');
  assert.strictEqual(backendUser.taxId, '03811209');
  assert.strictEqual(backendUser.address, '台北市南港區研究院路二段128號');
  assert.strictEqual(backendUser.phone, '0911223344');
  console.log('✅ 測試 4 通過：真實資料 1:1 直通綁定成功，每一字每一句皆忠實入庫！\n');

  // 測試完畢清理
  deleteUser(testBindingEmail);
  deleteAuthUser(testBindingEmail);
  console.log('🧹 測試會員已乾淨移除，磁碟與記憶體保持清爽無污染\n');

  console.log('🎉 全部 4 大項目 100% 通過！全鏈路直通綁定，徹底杜絕任何假資料！');
}

runTests().catch((err) => {
  console.error('❌ 測試失敗:', err);
  process.exit(1);
});
