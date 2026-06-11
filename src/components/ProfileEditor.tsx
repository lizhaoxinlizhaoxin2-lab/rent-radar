import type { UserProfile } from '../types';
import { hourlyWage } from '../lib/scoring';

interface Props {
  profile: UserProfile;
  onChange: (p: UserProfile) => void;
}

/** 录入收入信息，用于把通勤时间折算成机会成本 */
export default function ProfileEditor({ profile, onChange }: Props) {
  const wage = hourlyWage(profile);
  return (
    <div className="card">
      <h2>② 你的收入</h2>
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
      <p className="muted">
        按此计算，你的时薪约 <strong>{wage.toFixed(0)} 元/小时</strong>，
        每多花 1 小时/天通勤，每月约多耗 {(wage * profile.workDaysPerMonth).toFixed(0)} 元。
      </p>
    </div>
  );
}
