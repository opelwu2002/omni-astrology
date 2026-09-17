/**
 * 專屬自動化測試腳本：精準驗證 UserEditModal 欄位綁定與 unlocked_tiers 自由增刪 Bug 修復
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
  console.log('🚀 開始驗證：UserEditModal 5大企業欄位與 unlocked_tiers 增刪修復');
  console.log('================================================================\n');

  // 【測試 1：檢驗 UserEditModal.tsx 實體組件與欄位綁定】
  console.log('▶ 測試 1：檢驗 components/admin/UserEditModal.tsx 組件欄位與狀態綁定...');
  const modalPath = path.join(process.cwd(), 'components', 'admin', 'UserEditModal.tsx');
  assert(fs.existsSync(modalPath), 'UserEditModal.tsx 檔案必須存在');
  const modalCode = fs.readFileSync(modalPath, 'utf-8');

  assert(modalCode.includes('unlocked_tiers:'), 'State 必須包含 unlocked_tiers 陣列');
  assert(modalCode.includes('formData.company'), '必須綁定 formData.company (企業機構)');
  assert(modalCode.includes('formData.taxId'), '必須綁定 formData.taxId (統一編號)');
  assert(modalCode.includes('formData.industry'), '必須綁定 formData.industry (行業分類)');
  assert(modalCode.includes('formData.phone'), '必須綁定 formData.phone (聯絡電話)');
  assert(modalCode.includes('formData.address'), '必須綁定 formData.address (通訊地址)');
  assert(modalCode.includes('handleTierToggle'), '必須包含 handleTierToggle 獨立切換函式');
  console.log('  ✓ UserEditModal 組件具備完整 5 大企業欄位與獨立 handleTierToggle 函式！');

  // 【測試 2：檢驗黃光隆 (kc7470@gmail.com) 初始狀態絕無 199 權限】
  console.log('\n▶ 測試 2：檢驗初始狀態絕無 199 權限（杜絕沒加給卻預先給 199）...');
  const huangUser = await findUserByEmail('kc7470@gmail.com');
  assert(huangUser, '系統必須存在黃光隆 (kc7470@gmail.com) 會員');
  assert.equal(huangUser.company, '中央研究院', '企業機構必須為「中央研究院」');
  assert.equal(huangUser.taxId, '03811209', '統一編號必須為「03811209」');
  assert.equal(huangUser.industry, '學校或研究單位', '行業分類必須為「學校或研究單位」');
  assert.equal(huangUser.phone, '0932122156', '電話必須為「0932122156」');
  assert.equal(huangUser.address, '台北市南港區研究院路二段128號', '地址必須為「台北市南港區研究院路二段128號」');

  const has199Initial = huangUser.unlockedTiers.some((t) => ['199', 'tier_199', 'level2'].includes(t));
  assert(!has199Initial, '初始會員絕不可包含 199 權限！目前權限: ' + JSON.stringify(huangUser.unlockedTiers));
  console.log('  ✓ 通過：初始會員純淨無 199 權限，目前權限:', huangUser.unlockedTiers);

  // 【測試 3：多勾選 399 與 699 後儲存，驗證精準具備 399 與 699，且絕無 199】
  console.log('\n▶ 測試 3：多勾選 399 與 699 後儲存（杜絕只存 199 或無法增修）...');
  const add399And699Req = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify({
      email: 'kc7470@gmail.com',
      company: '中央研究院',
      taxId: '03811209',
      industry: '學校或研究單位',
      phone: '0932122156',
      address: '台北市南港區研究院路二段128號',
      unlocked_tiers: ['tier_399', 'tier_699'],
    }),
  });

  const res3 = await updateUserHandler(add399And699Req);
  const data3 = await res3.json();
  assert.equal(res3.status, 200, '更新 API 回傳 200');
  assert.equal(data3.success, true, '更新必須成功');

  const tiers3 = data3.user.unlockedTiers;
  assert(tiers3.some((t: string) => ['399', 'tier_399', 'synastry_addon'].includes(t)), '必須成功加入 399 權限');
  assert(tiers3.some((t: string) => ['699', 'tier_699', 'level3'].includes(t)), '必須成功加入 699 權限');
  assert(!tiers3.some((t: string) => ['199', 'tier_199', 'level2'].includes(t)), '絕不可殘留 199 權限');
  console.log('  ✓ 通過：399 與 699 成功寫入，且無 199 殘留！目前權限:', tiers3);

  // 【測試 4：加給 199 權限後儲存】
  console.log('\n▶ 測試 4：加給 199 權限後儲存...');
  const add199Req = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify({
      email: 'kc7470@gmail.com',
      unlocked_tiers: ['tier_199', 'tier_399', 'tier_699'],
    }),
  });
  const res4 = await updateUserHandler(add199Req);
  const data4 = await res4.json();
  const tiers4 = data4.user.unlockedTiers;
  assert(tiers4.some((t: string) => ['199', 'tier_199', 'level2'].includes(t)), '必須成功加入 199');
  console.log('  ✓ 通過：199 成功加入！目前權限:', tiers4);

  // 【測試 5：去除 199 權限後儲存，驗證 199 徹底抹除，絕不留有 199】
  console.log('\n▶ 測試 5：去除 199 權限後儲存（杜絕去除後依然留有 199）...');
  const remove199Req = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify({
      email: 'kc7470@gmail.com',
      unlocked_tiers: ['tier_399'], // 只留 399，徹底去除 199
    }),
  });
  const res5 = await updateUserHandler(remove199Req);
  const data5 = await res5.json();
  const tiers5 = data5.user.unlockedTiers;
  assert(!tiers5.some((t: string) => ['199', 'tier_199', 'level2'].includes(t)), '199 必須徹底移除，絕不可殘留！');
  assert(tiers5.some((t: string) => ['399', 'tier_399', 'synastry_addon'].includes(t)), '399 必須被保留');
  console.log('  ✓ 通過：去除 199 後儲存，199 徹底消失，絕不殘留！目前權限:', tiers5);

  // 【測試 6：檢驗全部清空（只留 free）】
  console.log('\n▶ 測試 6：測試全部清空方案（只保留基礎免費體驗）...');
  const clearAllReq = new Request('http://localhost:3000/api/admin/users/update', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer omni-master-admin-token',
    },
    body: JSON.stringify({
      email: 'kc7470@gmail.com',
      unlocked_tiers: [],
    }),
  });
  const res6 = await updateUserHandler(clearAllReq);
  const data6 = await res6.json();
  const tiers6 = data6.user.unlockedTiers;
  assert.equal(tiers6.length, 1, '全部清空後應只剩 free');
  assert.equal(tiers6[0], 'free', '唯一權限必須為 free');
  console.log('  ✓ 通過：全部清空後純淨為 [free]，無任何付費方案！');

  console.log('\n================================================================');
  console.log('🎉 全部 6 大項測試 100% 通過！unlocked_tiers 勾選儲存 Bug 徹底消滅！');
  console.log('================================================================\n');
}

runVerification().catch((err) => {
  console.error('❌ 驗證失敗:', err);
  process.exit(1);
});
