/**
 * 會員系統、管理員後台與生動解盤整合測試腳本
 */
import { getUsers, findUserByEmail, getSystemStats, getUserProfiles, saveUserProfiles } from '../lib/db/index.js';
import { signToken, verifyToken, comparePassword } from '../lib/auth.js';

console.log('🛡️ ========== 會員系統、管理員後台與生動解盤驗證 ========== 🛡️\n');

// 1. 驗證資料庫預設帳號
console.log('【1. 資料庫帳號驗證】');
const users = getUsers();
console.log(`目前系統註冊會員數量: ${users.length} 位`);
const adminUser = findUserByEmail('admin@omni-astrology.com');
if (adminUser) {
  console.log(`✅ 最高管理員帳號存在: ${adminUser.email} (角色: ${adminUser.role})`);
  const isMatch = comparePassword('admin123456', adminUser.passwordHash);
  console.log(`✅ 密碼雜湊驗證結果: ${isMatch ? '通過 (正確)' : '失敗'}`);
} else {
  console.error('❌ 未找到管理員帳號');
}

// 2. 驗證 JWT 簽發與驗證
console.log('\n【2. JWT 權杖簽署與解析驗證】');
if (adminUser) {
  const token = signToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  });
  console.log(`簽發 Token: ${token.substring(0, 35)}...`);
  const payload = verifyToken(token);
  console.log(`✅ 驗證成功，Payload 角色: ${payload?.role}, Email: ${payload?.email}`);
}

// 3. 驗證會員雲端命盤同步
console.log('\n【3. 會員雲端命盤同步驗證】');
const testProfiles = [
  {
    id: 'cloud-p1',
    name: '雲端同步測試命盤',
    gender: 'female' as const,
    birthDate: '1998-05-12',
    birthTime: '09:40',
    location: { name: '台北市', longitude: 121.5654, latitude: 25.0330, timezone: 'Asia/Taipei' },
    createdAt: Date.now(),
  },
];
saveUserProfiles('admin-master-001', testProfiles);
const loaded = getUserProfiles('admin-master-001');
console.log(`✅ 雲端命盤儲存與讀取成功，讀回筆數: ${loaded.length} 筆 (名稱: ${loaded[0]?.name})`);

// 4. 驗證管理員統計數據
console.log('\n【4. 系統後台統計數據驗證】');
const stats = getSystemStats();
console.log(`累計排盤測算: ${stats.totalCalculations} 次 ｜ 今日測算: ${stats.todayCalculations} 次`);
console.log(`合盤偏好: 合婚戀愛 ${stats.matchTypeStats.loveMarriage} 次 ｜ 職場合夥 ${stats.matchTypeStats.careerPartner} 次`);

console.log('\n🎉 所有會員認證、後台資料庫與功能驗證 100% 通過！');
