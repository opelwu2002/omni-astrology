/**
 * 14 維度命理解析核心型別契約 (FourteenDimensionsReport)
 * 強制約束 14 個維度不可缺漏，作為全系統演算法與 UI 的核心資料契約
 */

export interface FourteenDimensionsReport {
  // 1. I/E 人格傾向與深度心理
  personality_mbti: {
    type: 'I' | 'E';
    score: number;
    explanation: string;
  };

  // 2. 十二生肖與星座契合
  zodiac_compatibility: {
    best_signs: string[];
    best_zodiacs: string[];
    reason: string;
  };

  // 3. 人生動態重大轉折里程碑時間線
  timeline_milestones: Array<{
    age: number;
    category: 'career' | 'marriage' | 'health';
    event: string;
  }>;

  // 4. 職涯志業天賦與避坑指南
  ideal_careers: {
    primary: string[];
    side_hustle: string[];
    avoid: string[];
  };

  // 5. 財富來源模式判定
  wealth_origin: 'self_made' | 'inheritance' | 'hybrid';

  // 6. 離鄉背井與海外發展建議
  relocation_advice: {
    recommendation: 'relocate' | 'stay_local';
    study_career_verdict: string;
  };

  // 7. 投資理財適性工具
  investment_tools: {
    high_yield: string[];
    safe_haven: string[];
    risky_avoid: string[];
  };

  // 8. 性情脾氣與心智耐受力
  temperament: {
    temper_level: 1 | 2 | 3 | 4 | 5;
    patience: string;
    diligence: string;
  };

  // 9. 開運飲食與幸運蔬果
  lucky_food: {
    foods: string[];
    fruits: string[];
    element_boost: string;
  };

  // 10. 健康脆弱器官與食補療法
  health_body: {
    vulnerable_organs: string[];
    dietary_therapy: string;
  };

  // 11. 命中正緣相遇年齡與特徵
  destined_partner: {
    meet_age: number;
    traits: string[];
    age_gap: 'older' | 'younger' | 'peer';
    marriage_timing: 'early' | 'late';
  };

  // 12. 專屬能量水晶開運物
  lucky_crystals: {
    crystal_name: string;
    magnetic_field_reason: string;
  };

  // 13. 子息緣分與教養特質
  children_fate: {
    estimated_count: number;
    description: string;
  };

  // 14. 未來三年流年運勢曲線與正念心咒
  annual_forecast: {
    next_3_years_curve: Array<{
      year: number;
      score: number;
    }>;
    key_months: string[];
    mindfulness_mantra: string;
  };

  // 跨宗教心靈神聖處方箋 (選配深度賦能)
  sanctuary?: import('@/types/astrology').CrossFaithSanctuary;
}

