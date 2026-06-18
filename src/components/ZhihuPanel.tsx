import { useState } from 'react';

/** 围绕一个区域关键词，提供几类高频的租房调研角度 */
const TOPICS = [
  { label: '租房避坑', suffix: '租房 避坑' },
  { label: '真实居住体验', suffix: '租房 真实体验' },
  { label: '哪个区适合租房', suffix: '哪个区适合租房' },
  { label: '通勤攻略', suffix: '通勤' },
  { label: '房租水平', suffix: '房租 多少' },
  { label: '中介/二房东', suffix: '租房 中介 靠谱吗' },
];

function zhihuSearch(query: string): string {
  return `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(query)}`;
}

/**
 * 知乎参考：把「定房前先去知乎查查这个区域口碑」这个动作做进工具。
 * 输入城市/区域，一键跳到知乎对应主题的讨论。
 */
export default function ZhihuPanel() {
  const [keyword, setKeyword] = useState('');
  const kw = keyword.trim();

  return (
    <div className="card">
      <h2>⑥ 看看知乎上怎么说</h2>
      <p className="muted">
        签约前先做功课：输入你在看的城市 / 区域 / 小区，一键查知乎上的真实口碑与避坑经验。
      </p>
      <input
        className="zhihu-input"
        placeholder="如：北京朝阳 / 上海浦东 / 天河区 / 某某小区"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="zhihu-chips">
        {TOPICS.map((t) => {
          const query = kw ? `${kw} ${t.suffix}` : t.suffix;
          return (
            <a
              key={t.label}
              className="zhihu-chip"
              href={zhihuSearch(query)}
              target="_blank"
              rel="noreferrer"
            >
              🔍 {kw ? `${kw} · ` : ''}
              {t.label}
            </a>
          );
        })}
      </div>
      {!kw && (
        <p className="muted zhihu-tip">💡 填入区域后，搜索会更精准地命中你关心的地方。</p>
      )}
    </div>
  );
}
