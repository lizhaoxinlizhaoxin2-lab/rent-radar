// ===== 核心数据类型 =====

export type RentalType = '整租' | '合租';

/** 一套候选房源 */
export interface Listing {
  id: string;
  name: string;            // 房源名称/备注，如「朝阳门 2 居室」
  rent: number;            // 月租（元）
  type: RentalType;        // 整租 / 合租
  commuteMinutes: number;  // 单程通勤时间（分钟）
  dailyTransitCost: number; // 每天往返交通费（元）
  lighting: number;        // 采光主观评分 1-5
  area: number;            // 面积（m²），0 表示未填
}

/** 可打分的维度 */
export type DimensionKey =
  | 'cost'         // 真实开销（越低越好）
  | 'commute'      // 通勤时长（越短越好）
  | 'lighting'     // 采光（越高越好）
  | 'independence' // 独立性（整租优于合租）
  | 'space';       // 居住空间（面积越大越好）

/** 各维度权重（0-100，代表用户「最看重什么」） */
export type Weights = Record<DimensionKey, number>;

/** 用户画像：用于把通勤时间折算成机会成本 */
export interface UserProfile {
  monthlyIncome: number;     // 月收入（元）
  workDaysPerMonth: number;  // 每月工作天数，默认 22
}

// ===== 打分结果 =====

export interface CostBreakdown {
  rent: number;              // 房租
  transit: number;           // 每月交通费
  commuteTimeCost: number;   // 每月通勤时间折算成本
  total: number;             // 真实月总成本
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
  { key: 'cost', label: '真实开销', hint: '房租 + 交通费 + 通勤时间折算，越低越好' },
  { key: 'commute', label: '通勤时长', hint: '单程通勤时间，越短越好' },
  { key: 'lighting', label: '采光', hint: '主观评分 1-5，越高越好' },
  { key: 'independence', label: '独立性', hint: '整租优于合租' },
  { key: 'space', label: '居住空间', hint: '面积，越大越好' },
];
