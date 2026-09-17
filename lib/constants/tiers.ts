/**
 * 方案權限常數定義與容錯正規化模組 (lib/constants/tiers.ts)
 */

export const TIER_KEYS = {
  TIER_199: 'tier_199',
  TIER_399: 'tier_399',
  TIER_699: 'tier_699',
} as const;

/**
 * 容錯正規化函式：
 * 無論傳入 '199'、'tier_199'、'level2'、'399'、'synastry_addon' 或 '699'、'level3'，
 * 一律正規化為完整相容代碼集合，確保前後端所有模組 100% 識別。
 */
export function normalizeTiers(tiers: any[]): string[] {
  if (!Array.isArray(tiers)) return ['free'];
  const set = new Set<string>(['free']);

  tiers.forEach((t) => {
    const str = String(t).trim();
    if (str === '199' || str === 'tier_199' || str === 'level2') {
      set.add('tier_199');
      set.add('level2');
      set.add('199');
    }
    if (str === '399' || str === 'tier_399' || str === 'synastry_addon') {
      set.add('tier_399');
      set.add('synastry_addon');
      set.add('399');
    }
    if (str === '699' || str === 'tier_699' || str === 'level3') {
      set.add('tier_699');
      set.add('level3');
      set.add('699');
    }
  });

  return Array.from(set);
}
