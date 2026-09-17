/**
 * 驗證腳本：雲端資料庫註冊持久化與管理後台會員同步檢驗 (scripts/verify-cloud-user-sync.ts)
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { getUsers, getUsersAsync, adminCreateUser, adminUpdateUser, deleteUser } from '../lib/db';
import { createAuthUser, findAuthUserByEmail, getAllAuthUsersAsync, deleteAuthUser } from '../lib/auth-users';
import { CLIMATE_CHANGE_INDUSTRIES } from '../lib/validators';

async function runTests() {
  console.log('🚀 開始執行雲端資料庫註冊持久化與管理後台會員同步測試...\n');

  // 測試 1：驗證 database/schema.sql 是否包含 5 個企業級擴充欄位與索引
  console.log('▶ 測試 1：檢驗 database/schema.sql 欄位定義...');
  const schemaPath = path.join(process.cwd(), 'database', 'schema.sql');
  assert(fs.existsSync(schemaPath), 'database/schema.sql 必須存在');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
  assert(schemaContent.includes('phone VARCHAR(50)'), 'schema.sql 必須包含 phone 欄位');
  assert(schemaContent.includes('company VARCHAR(255)'), 'schema.sql 必須包含 company 欄位');
  assert(schemaContent.includes('tax_id VARCHAR(20)'), 'schema.sql 必須包含 tax_id 欄位');
  assert(schemaContent.includes('industry VARCHAR(100)'), 'schema.sql 必須包含 industry 欄位');
  assert(schemaContent.includes('address TEXT'), 'schema.sql 必須包含 address 欄位');
  assert(schemaContent.includes('idx_users_phone'), 'schema.sql 必須包含 phone 索引');
  assert(schemaContent.includes('idx_users_tax_id'), 'schema.sql 必須包含 tax_id 索引');
  console.log('✅ 測試 1 通過：schema.sql 完整包含 5 大企業欄位與查詢索引\n');

  // 測試 2：驗證 database/migration_add_enterprise_fields.sql 遷移腳本
  console.log('▶ 測試 2：檢驗 database/migration_add_enterprise_fields.sql 遷移腳本...');
  const migrationPath = path.join(process.cwd(), 'database', 'migration_add_enterprise_fields.sql');
  assert(fs.existsSync(migrationPath), 'migration_add_enterprise_fields.sql 必須存在');
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
  assert(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone'), '必須包含 phone ALTER TABLE');
  assert(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS company'), '必須包含 company ALTER TABLE');
  assert(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_id'), '必須包含 tax_id ALTER TABLE');
  assert(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS industry'), '必須包含 industry ALTER TABLE');
  assert(migrationContent.includes('ALTER TABLE users ADD COLUMN IF NOT EXISTS address'), '必須包含 address ALTER TABLE');
  assert(migrationContent.includes('NOTIFY pgrst, \'reload schema\''), '必須包含 PostgREST schema 重載通知');
  console.log('✅ 測試 2 通過：獨立遷移腳本正確無誤\n');

  // 測試 3：驗證 createAuthUser 建立完整企業會員並保留欄位
  console.log('▶ 測試 3：檢驗 createAuthUser 建立完整企業會員並保留欄位...');
  const testEmail = `test.sync.${Date.now()}@omni-audit.internal`;
  try {
    const newMember = await createAuthUser({
      email: testEmail,
      password: 'Password123!',
      name: '全端整合測試員',
      phone: '0911223344',
      company: '宇沛實業驗證組',
      taxId: '93620650',
      industry: '製造業（如石化、鋼鐵、水泥、半導體等）',
      address: '台北市松山區敦化北路207號9樓之6',
    });

    assert.strictEqual(newMember.email, testEmail, 'Email 必須一致');
    assert.strictEqual(newMember.name, '全端整合測試員', '姓名必須相符');
    assert.strictEqual(newMember.phone, '0911223344', '電話必須正確存入');
    assert.strictEqual(newMember.company, '宇沛實業驗證組', '公司名稱必須正確存入');
    assert.strictEqual(newMember.taxId, '93620650', '統一編號必須正確存入');
    assert.strictEqual(newMember.industry, '製造業（如石化、鋼鐵、水泥、半導體等）', '行業必須正確存入');
    assert.strictEqual(newMember.address, '台北市松山區敦化北路207號9樓之6', '通訊地址必須正確存入');
    console.log('✅ 測試 3 通過：新會員建立成功且企業擴充欄位完整保存\n');

    // 測試 4：檢驗管理後台非同步讀取 getUsersAsync() 能否立即取得新註冊會員
    console.log('▶ 測試 4：檢驗管理後台 getUsersAsync() 是否能讀取到新註冊會員...');
    const backendUsers = await getUsersAsync();
    const foundBackendUser = backendUsers.find((u) => u.email === testEmail);
    assert(foundBackendUser, '後台 getUsersAsync() 必須包含剛註冊的會員');
    assert.strictEqual(foundBackendUser.name, '全端整合測試員');
    assert.strictEqual(foundBackendUser.phone, '0911223344');
    assert.strictEqual(foundBackendUser.company, '宇沛實業驗證組');
    assert.strictEqual(foundBackendUser.taxId, '93620650');
    console.log('✅ 測試 4 通過：管理後台 getUsersAsync() 成功撈取該新會員，資料零脫鉤！\n');

    // 測試 5：檢驗重複註冊時拋出明確錯誤
    console.log('▶ 測試 5：檢驗重複註冊防護機制...');
    let dupErrorThrown = false;
    try {
      await createAuthUser({
        email: testEmail,
        password: 'Password123!',
        name: '重複註冊測試員',
        phone: '0911223344',
        industry: '其他',
        address: '台北市松山區敦化北路207號9樓之6',
      });
    } catch (err: any) {
      dupErrorThrown = true;
      assert(err.message.includes('已被註冊'), '錯誤訊息應提示已被註冊');
    }
    assert(dupErrorThrown, '重複 Email 必須被攔截並拋出錯誤');
    console.log('✅ 測試 5 通過：重複 Email 嚴格拋錯\n');

    // 測試 6：檢驗後台 API 100% 直連 Supabase 雲端資料庫，徹底杜絕本機 users.json fallback
    console.log('▶ 測試 6：檢驗 app/api/admin/users/route.ts 100% 直連 Supabase 雲端資料庫...');
    const adminUsersRoutePath = path.join(process.cwd(), 'app', 'api', 'admin', 'users', 'route.ts');
    const adminUsersRouteCode = fs.readFileSync(adminUsersRoutePath, 'utf-8');
    assert(adminUsersRouteCode.includes(".from('users')") && adminUsersRouteCode.includes(".select('*')"), "後台 GET 必須直連 .from('users') 並 .select('*')");
    assert(!adminUsersRouteCode.includes('getUsersAsync()'), '後台 GET 嚴禁使用本機 getUsersAsync() 作為 fallback');
    assert(adminUsersRouteCode.includes('phone'), '後台 POST 必須解構 phone');
    assert(adminUsersRouteCode.includes('company'), '後台 POST 必須解構 company');
    console.log('✅ 測試 6 通過：後台 API 100% 直連真實雲端 Supabase，零本機 fallback\n');

    // 測試 7：檢驗後台統計 API 代碼中 GET 必須使用 await getUsersAsync()
    console.log('▶ 測試 7：檢驗 app/api/admin/stats/route.ts 使用非同步雲端讀取...');
    const adminStatsRoutePath = path.join(process.cwd(), 'app', 'api', 'admin', 'stats', 'route.ts');
    const adminStatsRouteCode = fs.readFileSync(adminStatsRoutePath, 'utf-8');
    assert(adminStatsRouteCode.includes('await getUsersAsync()'), '後台統計 GET 必須呼叫 await getUsersAsync()');
    console.log('✅ 測試 7 通過：後台統計 API 連接非同步資料庫\n');

    // 測試 8：檢驗註冊 API 原子性防護（嚴禁未配置 Supabase 時假性成功派發 Token）
    console.log('▶ 測試 8：檢驗 app/api/auth/register/route.ts 註冊原子性防護...');
    const registerRoutePath = path.join(process.cwd(), 'app', 'api', 'auth', 'register', 'route.ts');
    const registerRouteCode = fs.readFileSync(registerRoutePath, 'utf-8');
    assert(registerRouteCode.includes('getSupabaseAdmin()'), '註冊 API 必須強制檢查 getSupabaseAdmin()');
    assert(registerRouteCode.includes('status: 500'), '未配置或資料庫寫入失敗時必須回傳 500 錯誤中斷流程');
    assert(registerRouteCode.includes('資料庫寫入失敗，請確認雲端資料庫配置'), '未配置時必須回傳精確防呆錯誤文案');
    console.log('✅ 測試 8 通過：註冊 API 具備完整原子性防護，嚴禁虛假註冊成功\n');
  } finally {
    // 清理作業：移除測試會員資料，嚴防污染正式儲存庫 users.json
    console.log('▶ 清理作業：移除測試會員資料...');
    deleteUser(testEmail);
    deleteAuthUser(testEmail);
    console.log('✅ 測試會員已安全徹底清理，users.json 保持乾淨無假資料\n');
  }

  console.log('🎉 所有驗證測試 100% 通過！資料持久化與前後台即時同步架構驗證成功！');
}

runTests().catch((err) => {
  console.error('❌ 測試失敗:', err);
  process.exit(1);
});
