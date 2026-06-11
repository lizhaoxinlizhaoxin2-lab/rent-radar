import { useEffect, useMemo, useState } from 'react';
import type { Listing, Weights, UserProfile } from './types';
import { scoreListings } from './lib/scoring';
import WeightEditor from './components/WeightEditor';
import ProfileEditor from './components/ProfileEditor';
import ListingsEditor, { makeBlankListing } from './components/ListingsEditor';
import ResultsTable from './components/ResultsTable';
import AiPanel from './components/AiPanel';
import './App.css';

const DEFAULT_WEIGHTS: Weights = {
  cost: 30,
  commute: 30,
  lighting: 15,
  independence: 15,
  space: 10,
};

const DEFAULT_PROFILE: UserProfile = {
  monthlyIncome: 15000,
  workDaysPerMonth: 22,
};

// 初始示例房源，便于第一次打开就看到效果
function initialListings(): Listing[] {
  return [
    { ...makeBlankListing(), name: '市中心合租', rent: 3500, type: '合租', commuteMinutes: 15, dailyTransitCost: 6, lighting: 3, area: 15 },
    { ...makeBlankListing(), name: '近郊整租', rent: 3000, type: '整租', commuteMinutes: 50, dailyTransitCost: 14, lighting: 4, area: 45 },
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
    if (raw) return JSON.parse(raw) as PersistedState;
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
      <header>
        <h1>🏠 租房对比神器</h1>
        <p className="muted">
          按你的偏好为每套房打分、算清「真实开销」（含通勤时间折现），帮你理性做选择。
          所有数据只存在你的浏览器本地。
        </p>
      </header>

      <WeightEditor weights={weights} onChange={setWeights} />
      <ProfileEditor profile={profile} onChange={setProfile} />
      <ListingsEditor listings={listings} onChange={setListings} />
      <ResultsTable results={results} />
      <AiPanel results={results} weights={weights} profile={profile} />

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
