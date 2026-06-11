// ===== 核心数据类型 =====

export type RentalType = '整租' | '合租';

/** 一套候选房源 */
export interface Listing {
  id: string;
  name: string;            // 房源名称/备注，如「朝阳门 2 居室」
  rent: number;            // 月租（元）
  monthlyExtraFees: number; // 其他每月固定费用（取暖/网费/物业/水电均摊等）
  type: RentalType;        // 整租 / 合租（仅作标签）
  commuteMinutes: number;  // 单程通勤时间（分钟）
  dailyTransitCost: number; // 每天往返交通费（元）
  lighting: number;        // 采光主观评分 1-5
  independence: number;    // 独立性 1-5（整租/独卫/隐私程度，越高越独立）
  area: number;            // 面积（m²），0 表示未填
}

/** 可打分的维度 */
export type DimensionKey =
  | 'cost'         // 月支出：实际掏的钱（越低越好）
  | 'commute'      // 通勤时长（越短越好）
  | 'lighting'     // 采光（越高越好）
  | 'independence' // 独立性（越高越好）
  | 'space';       // 居住空间（面积越大越好）

/** 各维度权重（0-100，代表用户「最看重什么」） */
export type Weights = Record<DimensionKey, number>;

/** 用户画像：用于把通勤时间折算成机会成本 */
export interface UserProfile {
  monthlyIncome: number;     // 月收入（元）
  workDaysPerMonth: number;  // 每月工作天数，默认 22
  // 时间价值系数：通勤 1 小时相当于多少倍时薪。
  // 摸鱼/通勤能休息 → 调低；极度厌恶通勤/时间宝贵 → 调高。默认 0.5（交通经济学常用值）
  timeValueFactor: number;
}

// ===== 打分结果 =====

export interface CostBreakdown {
  rent: number;              // 房租
  fees: number;              // 其他月固定费用
  transit: number;           // 每月交通费
  outOfPocket: number;       // 月支出 = 房租 + 杂费 + 交通（实际掏的钱）
  commuteTimeCost: number;   // 每月通勤时间折算成本（仅汇总用，不计入月支出分）
  total: number;             // 真实月开销 = 月支出 + 通勤时间折算
}

export interface ScoredListing {
  listing: Listing;
  dimensionScores: Record<DimensionKey, number>; // 各维度 0-100
  totalScore: number;        // 加权总分 0-100
  cost: CostBreakdown;
  rank: number;              // 排名，从 1 开始
}

// ===== 维度元信息（UI 展示用） =====

export const DIMENSIONS: { key: DimensionKey; label: string; hint: string }[] = [
  { key: 'cost', label: '月支出', hint: '房租 + 杂费 + 交通，每月实际掏的钱，越低越好' },
  { key: 'commute', label: '通勤时长', hint: '单程通勤时间，越短越好' },
  { key: 'lighting', label: '采光', hint: '主观评分 1-5，越高越好' },
  { key: 'independence', label: '独立性', hint: '整租/独卫/隐私程度 1-5，越高越好' },
  { key: 'space', label: '居住空间', hint: '面积，越大越好' },
];
