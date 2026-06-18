import { useEffect, useMemo, useState } from 'react';
import type { Listing, Weights, UserProfile } from './types';
import { scoreListings } from './lib/scoring';
import WeightEditor from './components/WeightEditor';
import ProfileEditor from './components/ProfileEditor';
import ListingsEditor, {
  makeBlankListing,
  normalizeListing,
} from './components/ListingsEditor';
import ResultsTable from './components/ResultsTable';
import AiPanel from './components/AiPanel';
import ZhihuPanel from './components/ZhihuPanel';
import './App.css';

// 权重为 0-5 的「在意程度」挡位
const DEFAULT_WEIGHTS: Weights = {
  cost: 4,
  commute: 4,
  lighting: 3,
  independence: 3,
  space: 2,
};

/** 兼容旧数据：老版本权重是 0-100，统一映射回 0-5 挡位 */
function normalizeWeights(raw: Partial<Weights> | undefined): Weights {
  const out: Weights = { ...DEFAULT_WEIGHTS };
  if (raw) {
    (Object.keys(out) as (keyof Weights)[]).forEach((k) => {
      const v = Number(raw[k]);
      if (!Number.isFinite(v)) return;
      // 大于 5 视为旧的 0-100 值，按比例折算到 0-5
      out[k] = Math.max(0, Math.min(5, Math.round(v > 5 ? v / 20 : v)));
    });
  }
  return out;
}

const DEFAULT_PROFILE: UserProfile = {
  monthlyIncome: 15000,
  workDaysPerMonth: 22,
  timeValueFactor: 0.5,
};

// 初始示例房源，便于第一次打开就看到效果
function initialListings(): Listing[] {
  return [
    { ...makeBlankListing(), name: '市中心合租', rent: 3500, monthlyExtraFees: 200, type: '合租', commuteMinutes: 15, dailyTransitCost: 6, lighting: 3, independence: 3, area: 15 },
    { ...makeBlankListing(), name: '近郊整租', rent: 3000, monthlyExtraFees: 400, type: '整租', commuteMinutes: 50, dailyTransitCost: 14, lighting: 4, independence: 5, area: 45 },
  ];
}

const STORAGE_KEY = 'rent-radar.state';

interface PersistedState {
  weights: Weights;
  profile: UserProfile;
  listings: Listing[];
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      // 旧数据可能缺少新字段，统一补齐，避免出现 NaN
      return {
        weights: normalizeWeights(parsed.weights),
        profile: { ...DEFAULT_PROFILE, ...(parsed.profile ?? {}) },
        listings: (parsed.listings ?? []).map(normalizeListing),
      };
    }
  } catch {
    /* ignore */
  }
  return {
    weights: DEFAULT_WEIGHTS,
    profile: DEFAULT_PROFILE,
    listings: initialListings(),
  };
}

export default function App() {
  const initial = loadState();
  const [weights, setWeights] = useState<Weights>(initial.weights);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);
  const [listings, setListings] = useState<Listing[]>(initial.listings);

  // 任何输入变化都自动存到本地，刷新不丢
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ weights, profile, listings })
    );
  }, [weights, profile, listings]);

  // 打分是纯函数，输入变就重算
  const results = useMemo(
    () => scoreListings(listings, weights, profile),
    [listings, weights, profile]
  );

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-badge">🏠</div>
          <h1>租房对比神器</h1>
          <p className="hero-sub">把通勤时间折算成钱，帮你算清哪套房真的更划算</p>
          <p className="hero-tip">
            按偏好打分排序 · 真实开销含通勤时间折现 · 数据只存本地
          </p>
        </div>
      </header>

      <WeightEditor weights={weights} onChange={setWeights} />
      <ProfileEditor profile={profile} onChange={setProfile} />
      <ListingsEditor listings={listings} onChange={setListings} />
      <ResultsTable results={results} />
      <AiPanel results={results} weights={weights} profile={profile} />
      <ZhihuPanel />

      <footer className="muted">
        开源项目 · 打分用公式（稳定），AI 仅做解释。{' '}
        <a
          href="https://github.com/lizhaoxinlizhaoxin2-lab/rent-radar"
          target="_blank"
          rel="noreferrer"
        >
          GitHub 源码 ↗
        </a>
      </footer>
    </div>
  );
}
