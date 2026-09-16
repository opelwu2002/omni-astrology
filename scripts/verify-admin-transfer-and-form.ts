/**
 * 專案驗證腳本：管理員權限轉移、註冊欄位文案微調與行業分類擴充
 */
import fs from 'fs';
import path from 'path';
import { getUsers, findUserByEmail, deleteUser } from '../lib/db';
import { findAuthUserByEmail, verifyUserCredentials } from '../lib/auth-users';
import { CLIMATE_CHANGE_INDUSTRIES, isValidTaiwanTaxId } from '../lib/validators';

async function runTests() {
  console.log('====================================================');
  console.log('🚀 開始驗證：管理員權限轉移、註冊文案微調與行業選項擴充');
  console.log('====================================================\n');

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

  // ----------------------------------------------------
  // 一、舊管理員徹底刪除檢驗
  // ----------------------------------------------------
  console.log('【測試 1：舊系統管理員 (admin@omni-astrology.com) 徹底刪除】');
  const allUsers = getUsers();
  const oldAdminInUsers = allUsers.some((u) => u.email.toLowerCase() === 'admin@omni-astrology.com');
  assert(!oldAdminInUsers, 'getUsers() 名單中已徹底排除 admin@omni-astrology.com');

  if (fs.existsSync(USERS_FILE)) {
    const rawUsersJson = fs.readFileSync(USERS_FILE, 'utf-8');
    assert(!rawUsersJson.includes('admin@omni-astrology.com'), 'data/users.json 磁碟檔案中已徹底物理刪除舊管理員');
  }

  const oldAuth = await findAuthUserByEmail('admin@omni-astrology.com');
  const isOldAuthGone = !oldAuth || oldAuth.email !== 'admin@omni-astrology.com';
  assert(isOldAuthGone, '認證層中 admin@omni-astrology.com 已無法作為獨立實體被查找');

  // ----------------------------------------------------
  // 二、新系統最高管理員 (opelwu2002@gmail.com 吳俊彥) 驗證
  // ----------------------------------------------------
  console.log('\n【測試 2：新系統最高管理員 (opelwu2002@gmail.com 吳俊彥) 權限與登入】');
  const opelUser = findUserByEmail('opelwu2002@gmail.com');
  assert(Boolean(opelUser), '能精準查找新管理員 opelwu2002@gmail.com');
  assert(opelUser?.role === 'admin', 'opelwu2002@gmail.com 權限角色 (role) 為最高管理員 "admin"');
  assert(opelUser?.name === '吳俊彥', '管理者姓名為 "吳俊彥"');
  assert(
    Boolean(
      opelUser?.unlockedTiers?.includes('level2') &&
        opelUser?.unlockedTiers?.includes('level3') &&
        opelUser?.unlockedTiers?.includes('synastry_addon')
    ),
    'opelwu2002@gmail.com 擁有全套最高級別解鎖權限 (level2, level3, synastry_addon)'
  );

  // admin 別名查詢驗證
  const adminAliasUser = findUserByEmail('admin');
  assert(adminAliasUser?.email.toLowerCase() === 'opelwu2002@gmail.com', '以 "admin" 別名查找自動映射至 opelwu2002@gmail.com');

  // 憑證登入測試
  const loginByEmail = await verifyUserCredentials('opelwu2002@gmail.com', 'Opel6439');
  assert(loginByEmail.success && loginByEmail.user?.role === 'admin', '以 opelwu2002@gmail.com + Opel6439 成功登入最高管理員身分');

  const loginByAdminAlias = await verifyUserCredentials('admin', 'Opel6439');
  assert(loginByAdminAlias.success && loginByAdminAlias.user?.email.toLowerCase() === 'opelwu2002@gmail.com', '以 admin + Opel6439 快捷登入成功且映射至 opelwu2002@gmail.com');

  // 最高管理員安全防護：不可被刪除
  deleteUser('opelwu2002@gmail.com');
  const opelAfterDelete = findUserByEmail('opelwu2002@gmail.com');
  assert(Boolean(opelAfterDelete), '安全防護：最高管理員 opelwu2002@gmail.com 受系統保護不可被刪除');

  // ----------------------------------------------------
  // 三、統一編號學校專用 8 個 0 放行驗證
  // ----------------------------------------------------
  console.log('\n【測試 3：統一編號驗證與學校 00000000 通用碼】');
  assert(isValidTaiwanTaxId('00000000'), '學校專用通用代碼 00000000 成功放行通過！');
  assert(isValidTaiwanTaxId('93620650'), '宇沛實業統編 93620650 正常通過');
  assert(isValidTaiwanTaxId('22099131'), '台積電統編 22099131 正常通過');
  assert(!isValidTaiwanTaxId('12345678'), '一般非法統編 12345678 正確被阻擋');
  assert(!isValidTaiwanTaxId('0000000'), '7 碼 0 被正確阻擋');

  // ----------------------------------------------------
  // 四、行業分類選項擴充驗證
  // ----------------------------------------------------
  console.log('\n【測試 4：行業分類下拉選單選項擴充】');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('學校或研究單位' as any), '行業分類成功包含「學校或研究單位」');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('公家機關' as any), '行業分類成功包含「公家機關」');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('製造業' as any), '保留原本「製造業」');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('能源業' as any), '保留原本「能源業」');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('服務業' as any), '保留原本「服務業」');
  assert(CLIMATE_CHANGE_INDUSTRIES.includes('其他' as any), '保留原本「其他」');

  // ----------------------------------------------------
  // 五、註冊組件文案檢查
  // ----------------------------------------------------
  console.log('\n【測試 5：AuthModal.tsx 前端文案檢查】');
  const authModalPath = path.join(process.cwd(), 'components', 'auth', 'AuthModal.tsx');
  const authModalContent = fs.readFileSync(authModalPath, 'utf-8');
  assert(authModalContent.includes('服務公司 / 學校'), '公司欄位文案已改為「服務公司 / 學校」');
  assert(authModalContent.includes('公司統一編號 8 碼 (學校請填入8個0)'), '統編說明文案已改為「公司統一編號 8 碼 (學校請填入8個0)」');
  assert(authModalContent.includes('所屬行業分類 <span className="text-rose-400">*</span>'), '行業分類標題已簡化為「所屬行業分類*」');
  assert(!authModalContent.includes('(環境部氣候變遷署七大行業)'), '已移除舊標題中的「(環境部氣候變遷署七大行業)」');

  console.log('\n====================================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('測試異常:', err);
  process.exit(1);
});
