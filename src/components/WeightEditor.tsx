import type { Weights } from '../types';
import { DIMENSIONS } from '../types';

interface Props {
  weights: Weights;
  onChange: (w: Weights) => void;
}

/** 6 个独立挡位，每个挡位都有名称和描述 */
export const WEIGHT_LEVELS = [
  { label: '不在意', desc: '完全不影响我的选择' },
  { label: '略微在意', desc: '有更好，没有也无所谓' },
  { label: '一般', desc: '会参考，但不关键' },
  { label: '比较看重', desc: '是重要的考量因素' },
  { label: '很看重', desc: '会明显影响我的决定' },
  { label: '极其看重', desc: '几乎是决定性因素' },
];

const MAX_LEVEL = WEIGHT_LEVELS.length - 1;

function clampLevel(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(MAX_LEVEL, Math.round(v)));
}

/** 让用户为每个维度独立选择「在意程度」，互不影响 */
export default function WeightEditor({ weights, onChange }: Props) {
  return (
    <div className="card">
      <h2>① 你最看重什么</h2>
      <p className="muted">每一项独立设置，互不影响。拖动滑块选择你的在意程度。</p>
      {DIMENSIONS.map((d) => {
        const lv = clampLevel(weights[d.key]);
        const level = WEIGHT_LEVELS[lv];
        return (
          <div key={d.key} className="weight-row">
            <div className="weight-head">
              <span className="weight-label">{d.label}</span>
              <span className="weight-level">{level.label}</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX_LEVEL}
              step={1}
              value={lv}
              onChange={(e) =>
                onChange({ ...weights, [d.key]: Number(e.target.value) })
              }
            />
            <div className="weight-ticks" aria-hidden="true">
              {WEIGHT_LEVELS.map((l, i) => (
                <span key={i} className={i === lv ? 'active' : ''}>
                  {l.label}
                </span>
              ))}
            </div>
            <span className="weight-hint muted">
              {level.desc} · {d.hint}
            </span>
          </div>
        );
      })}
    </div>
  );
}
