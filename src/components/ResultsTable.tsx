import type { ScoredListing } from '../types';
import { DIMENSIONS } from '../types';
import RadarChart from './RadarChart';

interface Props {
  results: ScoredListing[];
}

/** 根据分数返回一个颜色（用于分数条 / 数字） */
function scoreColor(score: number): string {
  if (score >= 75) return '#16a34a';
  if (score >= 50) return '#2f6fed';
  if (score >= 25) return '#d97706';
  return '#dc2626';
}

const MEDALS = ['🥇', '🥈', '🥉'];

/** 单元格内的迷你分数条 */
function ScoreCell({ value }: { value: number }) {
  const color = scoreColor(value);
  return (
    <div className="score-cell">
      <div className="score-track">
        <div
          className="score-fill"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="score-num" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/** 对比结果：冠军卡 + 雷达图 + 可视化分数表 */
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
        <div className="winner-medal">🏆</div>
        <div className="winner-body">
          <div className="winner-top">
            <span className="winner-name">{winner.listing.name}</span>
            <span className="winner-score" style={{ color: scoreColor(winner.totalScore) }}>
              {winner.totalScore}
              <small>分</small>
            </span>
          </div>
          <div className="winner-sub muted">
            真实月开销约 <strong>{winner.cost.total} 元</strong>
            {runnerUp && costGap !== 0 && (
              <>
                ，比第二名{costGap > 0 ? '每月省' : '每月多花'}{' '}
                <strong>{Math.abs(costGap)} 元</strong>
              </>
            )}
          </div>
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
                <td className="rank-cell">
                  <span className="rank-badge">
                    {MEDALS[r.rank - 1] ?? r.rank}
                  </span>
                </td>
                <td className="name-cell">{r.listing.name}</td>
                <td>
                  <span
                    className="total-pill"
                    style={{
                      background: scoreColor(r.totalScore),
                    }}
                  >
                    {r.totalScore}
                  </span>
                </td>
                {DIMENSIONS.map((d) => (
                  <td key={d.key}>
                    <ScoreCell value={r.dimensionScores[d.key]} />
                  </td>
                ))}
                <td>
                  <strong className="cost-total">{r.cost.total}</strong>
                  <div className="cost-detail muted">
                    租 {r.cost.rent} + 杂费 {r.cost.fees} + 交通 {r.cost.transit} + 时间{' '}
                    {r.cost.commuteTimeCost}
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
