import type { Weights } from '../types';
import { DIMENSIONS } from '../types';

interface Props {
  weights: Weights;
  onChange: (w: Weights) => void;
}

/** 让用户用滑块表达「最看重什么」。底部实时显示各维度占比。 */
export default function WeightEditor({ weights, onChange }: Props) {
  const total = DIMENSIONS.reduce((s, d) => s + weights[d.key], 0) || 1;

  return (
    <div className="card">
      <h2>① 你最看重什么</h2>
      <p className="muted">拖动滑块，数字越大代表越在意。下方括号是实际占比。</p>
      {DIMENSIONS.map((d) => {
        const pct = Math.round((weights[d.key] / total) * 100);
        return (
          <div key={d.key} className="weight-row">
            <label>
              <span className="weight-label">
                {d.label}
                <span className="muted"> （{pct}%）</span>
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={weights[d.key]}
                onChange={(e) =>
                  onChange({ ...weights, [d.key]: Number(e.target.value) })
                }
              />
            </label>
            <span className="weight-hint muted">{d.hint}</span>
          </div>
        );
      })}
    </div>
  );
}
