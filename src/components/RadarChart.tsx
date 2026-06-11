import type { ScoredListing } from '../types';
import { DIMENSIONS } from '../types';

interface Props {
  results: ScoredListing[];
}

// 给每套房分配一个稳定的颜色
const COLORS = ['#2f6fed', '#e0567a', '#16a34a', '#d97706', '#7c3aed', '#0891b2'];

const SIZE = 280;
const CENTER = SIZE / 2;
const MAX_R = 100; // 半径对应满分 100
const PADDING = 40;

/** 把（维度序号, 分值 0-100）换算成 SVG 坐标 */
function point(axisIndex: number, total: number, value: number) {
  const angle = (Math.PI * 2 * axisIndex) / total - Math.PI / 2; // 从正上方开始
  const r = (value / 100) * MAX_R;
  return {
    x: CENTER + r * Math.cos(angle),
    y: CENTER + r * Math.sin(angle),
  };
}

/** 纯 SVG 雷达图：每套房一条多边形，直观对比各维度强弱 */
export default function RadarChart({ results }: Props) {
  if (results.length === 0) return null;

  const n = DIMENSIONS.length;
  // 最多叠加 6 套，避免太乱
  const shown = results.slice(0, COLORS.length);

  // 背景网格圈（25/50/75/100）
  const rings = [25, 50, 75, 100];

  return (
    <div className="radar-wrap">
      <svg
        viewBox={`${-PADDING} ${-PADDING} ${SIZE + PADDING * 2} ${SIZE + PADDING * 2}`}
        className="radar-svg"
        role="img"
        aria-label="各房源维度得分雷达图"
      >
        {/* 背景同心多边形 */}
        {rings.map((ring) => {
          const pts = DIMENSIONS.map((_, i) => {
            const p = point(i, n, ring);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={ring}
              points={pts}
              fill="none"
              stroke="#e3e6ea"
              strokeWidth={1}
            />
          );
        })}

        {/* 轴线 + 维度标签 */}
        {DIMENSIONS.map((d, i) => {
          const edge = point(i, n, 100);
          const label = point(i, n, 122);
          return (
            <g key={d.key}>
              <line
                x1={CENTER}
                y1={CENTER}
                x2={edge.x}
                y2={edge.y}
                stroke="#e3e6ea"
                strokeWidth={1}
              />
              <text
                x={label.x}
                y={label.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={12}
                fill="#6b7280"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* 每套房的多边形 */}
        {shown.map((r, idx) => {
          const color = COLORS[idx % COLORS.length];
          const pts = DIMENSIONS.map((d, i) => {
            const p = point(i, n, r.dimensionScores[d.key]);
            return `${p.x},${p.y}`;
          }).join(' ');
          return (
            <polygon
              key={r.listing.id}
              points={pts}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* 图例 */}
      <div className="radar-legend">
        {shown.map((r, idx) => (
          <span key={r.listing.id} className="legend-item">
            <span
              className="legend-dot"
              style={{ background: COLORS[idx % COLORS.length] }}
            />
            {r.listing.name}
          </span>
        ))}
      </div>
    </div>
  );
}
