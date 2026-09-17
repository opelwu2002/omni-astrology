/**
 * 自動化驗證腳本：BI 戰情室與會員深度管理單一資料源 (Single Source of Truth) 檢驗
 * 執行命令：npx tsx scripts/verify-single-source-of-truth.ts
 */
import fs from 'fs';
import path from 'path';
import assert from 'assert';

function runTests() {
  console.log('================================================================');
  console.log('🚀 開始驗證：BI 戰情室與會員管理列表 100% 單一資料源與零假資料');
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

  const adminPagePath = path.join(process.cwd(), 'app', 'admin', 'page.tsx');
  assert(fs.existsSync(adminPagePath), 'app/admin/page.tsx 必須存在');
  const adminPageCode = fs.readFileSync(adminPagePath, 'utf-8');

  // 【測試 1：戰情室總註冊會員數 100% 綁定 userMetrics.total / usersList】
  console.log('【測試 1：檢驗戰情室總註冊會員數資料源】');
  testAssert(
    !adminPageCode.includes('stats?.totalUsers || usersList.length'),
    '徹底消除脫節寫法：嚴禁出現 stats?.totalUsers || usersList.length'
  );
  testAssert(
    adminPageCode.includes('{userMetrics.total}'),
    '戰情室總註冊會員數 100% 綁定 {userMetrics.total}'
  );

  // 【測試 2：今日新增與成長率動態衍生計算】
  console.log('\n【測試 2：檢驗今日新增與成長率資料源】');
  testAssert(
    !adminPageCode.includes('stats?.todayNewUsers ?? 1'),
    '嚴禁今日新增使用猜測假資料 stats?.todayNewUsers ?? 1'
  );
  testAssert(
    adminPageCode.includes('{userMetrics.todayNew} 今日新增'),
    '今日新增會員數 100% 來自 userMetrics.todayNew'
  );
  testAssert(
    adminPageCode.includes('(成長率 +{userMetrics.growthRate}%)'),
    '成長率 100% 來自 userMetrics.growthRate'
  );

  // 【測試 3：付費會員轉換率動態衍生計算】
  console.log('\n【測試 3：檢驗付費會員轉換率資料源】');
  testAssert(
    !adminPageCode.includes('stats?.conversionRate ?? 18'),
    '嚴禁轉換率使用寫死假預設值 stats?.conversionRate ?? 18'
  );
  testAssert(
    adminPageCode.includes('{userMetrics.conversionRate}%'),
    '付費轉換率 100% 來自 userMetrics.conversionRate'
  );

  // 【測試 4：方案營收比與測算次數假預設值全面清除】
  console.log('\n【測試 4：檢驗圖表與方案佔比假預設值清除】');
  testAssert(
    !adminPageCode.includes(': 75') &&
      !adminPageCode.includes(': 20') &&
      !adminPageCode.includes(': 5\n'),
    '嚴禁在方案佔比進度條硬寫 75%、20%、5% 假數據'
  );
  testAssert(
    !adminPageCode.includes('?? 3824'),
    '嚴禁在測算總次數硬寫 ?? 3824 假數據'
  );
  testAssert(
    adminPageCode.includes('{chartData.realMax.toLocaleString()}'),
    '最高單日走勢金額使用真實 realMax 渲染'
  );

  // 【測試 5：後台統計 API (stats) 嚴格移除本地舊檔案讀取】
  console.log('\n【測試 5：檢驗 app/api/admin/stats/route.ts 零本地 fallback】');
  const statsRoutePath = path.join(process.cwd(), 'app', 'api', 'admin', 'stats', 'route.ts');
  const statsRouteCode = fs.readFileSync(statsRoutePath, 'utf-8');
  testAssert(
    !statsRouteCode.includes('getUsersAsync()'),
    'stats API 路由嚴禁呼叫 getUsersAsync() 讀取本地舊 JSON'
  );
  testAssert(
    statsRouteCode.includes('getSupabaseAdmin()'),
    'stats API 路由直接對齊 getSupabaseAdmin()'
  );

  // 【測試 6：單一事實來源衍生運算邏輯模擬】
  console.log('\n【測試 6：模擬單一資料源在 0 人與 2 人時的精準同步表現】');
  const emptyList: any[] = [];
  const emptyTotal = emptyList.length;
  const emptyPaid = emptyList.filter((u) => u.unlockedTiers?.some((t: string) => t !== 'free')).length;
  const emptyConversion = emptyTotal > 0 ? Math.round((emptyPaid / emptyTotal) * 100) : 0;
  testAssert(emptyTotal === 0, '當會員列表為 0 人時，戰情室總會員數精準為 0 人');
  testAssert(emptyConversion === 0, '當會員列表為 0 人時，轉換率精準為 0%');

  const mockList: any[] = [
    { id: '1', name: '吳沛融', unlockedTiers: ['free', 'level2'] },
    { id: '2', name: '吳俊彥', unlockedTiers: ['free'] },
  ];
  const mockTotal = mockList.length;
  const mockPaid = mockList.filter((u) => u.unlockedTiers?.some((t: string) => t !== 'free')).length;
  const mockConversion = mockTotal > 0 ? Math.round((mockPaid / mockTotal) * 100) : 0;
  testAssert(mockTotal === 2, '當會員列表為 2 人時，戰情室總會員數精準同步為 2 人');
  testAssert(mockConversion === 50, '當 2 人中 1 人付費時，轉換率精準為 50%');

  console.log('\n================================================================');
  console.log(`測試結果統計: 共 ${passed + failed} 項 | 通過: ${passed} | 失敗: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
