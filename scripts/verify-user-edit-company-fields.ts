/**
 * 專屬驗證腳本：驗證後台會員編輯 Modal 之企業與通訊欄位、權限持久化儲存與黃光隆正確資料
 */

import { strict as assert } from 'assert';
import fs from 'fs';
import path from 'path';
import { PUT as updateUserHandler } from '../app/api/admin/users/update/route';
import {
  getAllUsers,
  findUserByEmail,
  updateUser,
} from '../lib/usersStorage';

async function runVerification() {
  console.log('================================================================');
  console.log('🚀 開始驗證：後台編輯 Modal 企業資訊欄位與權限持久化儲存');
  console.log('================================================================\n');

  // 【測試 1：檢驗前端 app/admin/page.tsx 之 Modal 欄位完整性】
  console.log('▶ 測試 1：檢驗前端 app/admin/page.tsx 編輯 Modal 欄位完整性...');
  const adminPageCode = fs.readFileSync(path.join(process.cwd(), 'app', 'admin', 'page.tsx'), 'utf-8');

  assert(adminPageCode.includes('editUserData.company'), 'Modal 必須綁定 editUserData.company');
  assert(adminPageCode.includes('editUserData.taxId'), 'Modal 必須綁定 editUserData.taxId');
  assert(adminPageCode.includes('editUserData.industry'), 'Modal 必須綁定 editUserData.industry');
  assert(adminPageCode.includes('editUserData.phone'), 'Modal 必須綁定 editUserData.phone');
  assert(adminPageCode.includes('editUserData.address'), 'Modal 必須綁定 editUserData.address');
  assert(adminPageCode.includes('unlocked_tiers'), '送出 payload 必須支援 unlocked_tiers 雙命名相容');
  assert(adminPageCode.includes('tax_id'), '送出 payload 必須支援 tax_id 雙命名相容');
  assert(adminPageCode.includes('學校或研究單位'), '行業分類下拉選單必須包含「學校或研究單位」');
  console.log('  ✓ 前端 Modal 已完整具備 5 大企業與聯絡欄位、下拉選單及雙命名支援！');

  // 【測試 2：檢驗黃光隆 (kc7470@gmail.com) 正確基本資料】
  console.log('\n▶ 測試 2：檢驗黃光隆 (kc7470@gmail.com) 正確資料對照...');
  const huangUser = await findUserByEmail('kc7470@gmail.com');
  assert(huangUser, '系統必須存在黃光隆 (kc7470@gmail.com) 會員');
  assert.equal(huangUser.company, '中央研究院', '企業機構必須為「中央研究院」');
  assert.equal(huangUser.taxId, '03811209', '統一編號必須為「03811209」');
  assert.equal(huangUser.industry, '學校或研究單位', '行業分類必須為「學校或研究單位」');
  assert.equal(huangUser.phone, '0932122156', '電話必須為「0932122156」');
  assert.equal(huangUser.address, '台北市南港區研究院路二段128號', '地址必須為「台北市南港區研究院路二段128號」');
  console.log('  ✓ 黃光隆會員目前資料已 100% 正確吻合中央研究院對照需求！');

  // 【測試 3：透過 API 模擬修改權限與企業資料（使用蛇形 unlocked_tiers 與 tax_id 命名）】
  console.log('\n▶ 測試 3：模擬管理員呼叫 PUT /api/admin/users/update 修改權限與企業資料...');
  const updatePayload = {
    targetUserId: huangUser.id,
    name: '黃光隆',
    company: '中央研究院',
    tax_id: '03811209',
    industry: '學校或研究單位',
    phone: '0932122156',
    address: '台北市南港區研究院路二段128號',
    unlocked_tiers: ['level2', 'level3'], // 傳入蛇形命名，驗證後端相容解析
  };

  const req = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify(updatePayload),
  });

  const res = await updateUserHandler(req);
  const data = await res.json();
  console.log('  - 更新 API 回傳狀態:', res.status);
  console.log('  - 更新 API 回傳訊息:', data.message);
  assert.equal(res.status, 200, '更新 API 必須回傳 200 OK');
  assert.equal(data.success, true, '更新 API 必須回傳 success: true');
  assert(Array.isArray(data.user.unlockedTiers), '回傳會員物件之 unlockedTiers 必須為陣列');
  assert(data.user.unlockedTiers.includes('level2'), '更新後必須包含 level2 權限');
  assert(data.user.unlockedTiers.includes('level3'), '更新後必須包含 level3 權限');
  assert(data.user.unlockedTiers.includes('free'), '更新後必須保留基礎 free 權限');
  console.log('  ✓ API 回傳權限正確變更:', data.user.unlockedTiers);

  // 【測試 4：檢驗單一事實來源與本地磁碟持久化深度】
  console.log('\n▶ 測試 4：檢驗儲存核心持久化與實體磁碟 data/users.json...');
  const reloadedHuang = await findUserByEmail('kc7470@gmail.com');
  assert(reloadedHuang, '持久化儲存庫必須能讀取到黃光隆');
  assert(reloadedHuang.unlockedTiers.includes('level2'), '持久化後 level2 依然存在');
  assert(reloadedHuang.unlockedTiers.includes('level3'), '持久化後 level3 依然存在');

  const diskPath = path.join(process.cwd(), 'data', 'users.json');
  if (fs.existsSync(diskPath)) {
    const rawDisk = fs.readFileSync(diskPath, 'utf-8');
    assert(rawDisk.includes('中央研究院'), '實體磁碟必須寫入「中央研究院」');
    assert(rawDisk.includes('03811209'), '實體磁碟必須寫入統編「03811209」');
    assert(rawDisk.includes('0932122156'), '實體磁碟必須寫入電話「0932122156」');
    assert(rawDisk.includes('level3'), '實體磁碟必須寫入權限「level3」');
    console.log('  ✓ 實體磁碟 data/users.json 100% 物理覆寫成功，絕不還原！');
  }

  // 【測試 5：再度切換權限（移除 level3，保留 level2），驗證可雙向自由增刪】
  console.log('\n▶ 測試 5：測試動態收回權限（移除 level3）並持久化儲存...');
  const downgradePayload = {
    targetUserId: huangUser.id,
    unlockedTiers: ['level2'], // 只留 level2
  };
  const req2 = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify(downgradePayload),
  });
  const res2 = await updateUserHandler(req2);
  const data2 = await res2.json();
  assert.equal(res2.status, 200, '降級更新必須成功');
  assert(data2.user.unlockedTiers.includes('level2'), '必須保留 level2');
  assert(!data2.user.unlockedTiers.includes('level3'), 'level3 必須已被精準移除');
  console.log('  ✓ 權限動態收回成功！目前最新權限:', data2.user.unlockedTiers);

  console.log('\n================================================================');
  console.log('🎉 所有驗證通過！後台編輯會員 Modal 企業欄位與權限儲存機制 100% 健全！');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ 驗證失敗:', err);
  process.exit(1);
});
