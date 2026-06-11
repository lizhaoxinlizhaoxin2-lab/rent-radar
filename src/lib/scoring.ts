import type {
  Listing,
  UserProfile,
  Weights,
  DimensionKey,
  CostBreakdown,
  ScoredListing,
} from '../types';

// ===== 真实开销计算 =====
// 核心理念：便宜但远的房子，通勤时间其实是「隐形成本」。
// 把通勤时间按用户时薪折算成钱，才能公平地比较两套房子。

/** 时薪 = 月收入 / (工作天数 × 8 小时) */
export function hourlyWage(profile: UserProfile): number {
  const hours = profile.workDaysPerMonth * 8;
  if (hours <= 0) return 0;
  return profile.monthlyIncome / hours;
}

/** 计算一套房源的真实月开销明细 */
export function computeCost(listing: Listing, profile: UserProfile): CostBreakdown {
  const transit = listing.dailyTransitCost * profile.workDaysPerMonth;
  const fees = listing.monthlyExtraFees;
  // 月支出 = 实际掏出去的钱（房租 + 杂费 + 交通）
  const outOfPocket = listing.rent + fees + transit;
  // 单程分钟 × 2（往返）÷ 60 = 每天通勤小时
  const dailyCommuteHours = (listing.commuteMinutes * 2) / 60;
  // 乘以时间价值系数：你认为通勤 1 小时值多少倍时薪
  const factor = profile.timeValueFactor ?? 0.5;
  const commuteTimeCost =
    hourlyWage(profile) * dailyCommuteHours * profile.workDaysPerMonth * factor;
  // 真实月开销 = 月支出 + 通勤时间折算（汇总参考用）
  const total = outOfPocket + commuteTimeCost;
  return {
    rent: listing.rent,
    fees: Math.round(fees),
    transit: Math.round(transit),
    outOfPocket: Math.round(outOfPocket),
    commuteTimeCost: Math.round(commuteTimeCost),
    total: Math.round(total),
  };
}

// ===== 维度打分 =====
// 每个维度先取「原始值」（统一为越大越好），再在所有房源间做 min-max 归一化到 0-100。

/** 提取某维度的原始值（已统一方向：值越大越好） */
function rawValue(
  key: DimensionKey,
  listing: Listing,
  cost: CostBreakdown
): number {
  switch (key) {
    case 'cost':
      // 月支出（实际掏的钱）越低越好 → 取负值，使「越大越好」
      // 注意：不含通勤时间折现，避免与「通勤时长」维度重复计权
      return -cost.outOfPocket;
    case 'commute':
      // 通勤越短越好 → 取负值
      return -listing.commuteMinutes;
    case 'lighting':
      return listing.lighting;
    case 'independence':
      return listing.independence;
    case 'space':
      return listing.area;
  }
}

/** 把一组数值 min-max 归一化到 0-100；全部相等时都给满分 */
function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 100);
  return values.map((v) => ((v - min) / (max - min)) * 100);
}

const ALL_DIMENSIONS: DimensionKey[] = [
  'cost',
  'commute',
  'lighting',
  'independence',
  'space',
];

/**
 * 对所有房源打分并排序。
 * @returns 按总分从高到低排序的结果
 */
export function scoreListings(
  listings: Listing[],
  weights: Weights,
  profile: UserProfile
): ScoredListing[] {
  if (listings.length === 0) return [];

  // 1. 先算每套房的真实开销
  const costs = listings.map((l) => computeCost(l, profile));

  // 2. 逐维度归一化打分
  const scoresByDimension: Record<DimensionKey, number[]> = {} as Record<
    DimensionKey,
    number[]
  >;
  for (const key of ALL_DIMENSIONS) {
    const raws = listings.map((l, i) => rawValue(key, l, costs[i]));
    scoresByDimension[key] = normalize(raws);
  }

  // 3. 归一化权重（防止用户填的权重总和不是 100）
  const weightSum = ALL_DIMENSIONS.reduce((s, k) => s + (weights[k] || 0), 0);
  const safeSum = weightSum > 0 ? weightSum : 1;

  // 4. 加权求和得到总分
  const results: ScoredListing[] = listings.map((listing, i) => {
    const dimensionScores = {} as Record<DimensionKey, number>;
    let total = 0;
    for (const key of ALL_DIMENSIONS) {
      const s = scoresByDimension[key][i];
      dimensionScores[key] = Math.round(s);
      total += s * ((weights[key] || 0) / safeSum);
    }
    return {
      listing,
      dimensionScores,
      totalScore: Math.round(total),
      cost: costs[i],
      rank: 0, // 占位，排序后填
    };
  });

  // 5. 排序并标注排名
  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((r, i) => (r.rank = i + 1));
  return results;
}
