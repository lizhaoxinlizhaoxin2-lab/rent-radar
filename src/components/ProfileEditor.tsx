import type { UserProfile } from '../types';
import { hourlyWage } from '../lib/scoring';

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
}

/** 根据系数给一句贴切的描述 */
function factorLabel(factor: number): string {
  if (factor <= 0.1) return '几乎不在意（路上能补觉/摸鱼，时间不值钱）';
  if (factor < 0.45) return '不太在意（通勤还算轻松）';
  if (factor < 0.75) return '中等（经济学常用值）';
  if (factor < 1.1) return '很在意（等于上班时薪）';
  return '极度厌恶通勤（比上班还折磨）';
}

/** 录入收入信息，并设定通勤时间的「时间价值系数」 */
export default function ProfileEditor({ profile, onChange }: Props) {
  const wage = hourlyWage(profile);
  const factor = profile.timeValueFactor ?? 0.5;
  const effectivePerHour = wage * factor;

  return (
    <div className="card">
      <h2>② 你的收入与时间观</h2>
      <p className="muted">用来把「通勤时间」折算成钱——这是判断远近房子值不值的关键。</p>
      <div className="field-row">
        <label>
          月收入（元）
          <input
            type="number"
            min={0}
            value={profile.monthlyIncome}
            onChange={(e) =>
              onChange({ ...profile, monthlyIncome: Number(e.target.value) })
            }
          />
        </label>
        <label>
          每月工作天数
          <input
            type="number"
            min={1}
            max={31}
            value={profile.workDaysPerMonth}
            onChange={(e) =>
              onChange({ ...profile, workDaysPerMonth: Number(e.target.value) })
            }
          />
        </label>
      </div>

      <div className="time-value">
        <label>
          <span className="weight-label" style={{ width: 'auto' }}>
            通勤时间价值：<strong>{Math.round(factor * 100)}%</strong> 时薪
          </span>
          <input
            type="range"
            min={0}
            max={150}
            step={5}
            value={Math.round(factor * 100)}
            onChange={(e) =>
              onChange({ ...profile, timeValueFactor: Number(e.target.value) / 100 })
            }
          />
        </label>
        <p className="muted" style={{ marginTop: 4 }}>
          {factorLabel(factor)} —— 上班摸鱼多就往左拉，越讨厌通勤就往右拉。
        </p>
      </div>

      <p className="muted">
        你的时薪约 <strong>{wage.toFixed(0)} 元/小时</strong>，按当前系数，通勤每小时折算
        <strong> {effectivePerHour.toFixed(0)} 元</strong>；每天多花 1 小时通勤，每月约多耗{' '}
        {(effectivePerHour * profile.workDaysPerMonth).toFixed(0)} 元。
      </p>
    </div>
  );
}
