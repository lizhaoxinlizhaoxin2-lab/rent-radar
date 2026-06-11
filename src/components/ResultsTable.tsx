import type { ScoredListing } from '../types';
import { DIMENSIONS } from '../types';
import RadarChart from './RadarChart';

interface Props {
  results: ScoredListing[];
}

function scoreColor(score: number): string {
  if (score >= 75) return 'var(--good)';
  if (score >= 50) return 'var(--text)';
  return 'var(--warn)';
}

/** 对比结果表：按总分排序，展示各维度得分与真实开销 */
export default function ResultsTable({ results }: Props) {
  if (results.length === 0) {
    return (
      <div className="card">
        <h2>④ 对比结果</h2>
        <p className="muted">先在上方添加房源，这里会自动算分排序。</p>
      </div>
    );
  }

  const winner = results[0];
  const runnerUp = results[1];
  const costGap = runnerUp ? runnerUp.cost.total - winner.cost.total : 0;

  return (
    <div className="card">
      <h2>④ 对比结果</h2>
      <p className="muted">总分越高越契合你的偏好。真实开销已含通勤时间折算。</p>

      {/* 冠军总结卡 */}
      <div className="winner-card">
        <div className="winner-badge">🏆 推荐</div>
        <div>
          <strong className="winner-name">{winner.listing.name}</strong>
          <span className="muted">
            ，综合得分 {winner.totalScore}，真实月开销约 {winner.cost.total} 元
            {runnerUp && costGap !== 0 && (
              <>
                ，比第二名{costGap > 0 ? '每月省' : '每月多'} {Math.abs(costGap)} 元
              </>
            )}
            。
          </span>
        </div>
      </div>

      {/* 雷达图 */}
      {results.length >= 2 && <RadarChart results={results} />}

      <div className="table-scroll">
        <table className="results-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>房源</th>
              <th>总分</th>
              {DIMENSIONS.map((d) => (
                <th key={d.key}>{d.label}</th>
              ))}
              <th>真实月开销</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.listing.id} className={r.rank === 1 ? 'winner' : ''}>
                <td>{r.rank === 1 ? '🏆 1' : r.rank}</td>
                <td>{r.listing.name}</td>
                <td>
                  <strong style={{ color: scoreColor(r.totalScore) }}>
                    {r.totalScore}
                  </strong>
                </td>
                {DIMENSIONS.map((d) => (
                  <td key={d.key} className="muted">
                    {r.dimensionScores[d.key]}
                  </td>
                ))}
                <td>
                  <strong>{r.cost.total}</strong>
                  <div className="cost-detail muted">
                    租 {r.cost.rent} + 杂费 {r.cost.fees} + 交通 {r.cost.transit} + 时间 {r.cost.commuteTimeCost}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
