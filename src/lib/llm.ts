import type { ScoredListing, Weights, UserProfile } from '../types';
import { DIMENSIONS } from '../types';

/** 大模型连接配置，存在浏览器 localStorage，不经过任何服务器 */
export interface LlmConfig {
  baseUrl: string; // OpenAI 兼容的 API 地址，结尾不含 /chat/completions
  apiKey: string;
  model: string;
}

/** 常见服务商预设，方便用户一键填好 baseUrl */
export const PROVIDER_PRESETS: { label: string; baseUrl: string; model: string }[] = [
  { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  { label: '通义千问', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: '本地 Ollama', baseUrl: 'http://localhost:11434/v1', model: 'llama3.1' },
];

const STORAGE_KEY = 'rent-radar.llm-config';

export function loadLlmConfig(): LlmConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as LlmConfig;
  } catch {
    /* 忽略损坏的本地数据 */
  }
  return { baseUrl: PROVIDER_PRESETS[0].baseUrl, apiKey: '', model: PROVIDER_PRESETS[0].model };
}

export function saveLlmConfig(config: LlmConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** 把打分结果整理成给大模型看的文字 */
function buildPrompt(
  scored: ScoredListing[],
  weights: Weights,
  profile: UserProfile
): string {
  const levelLabels = ['不在意', '略微在意', '一般', '比较看重', '很看重', '极其看重'];
  const weightLines = DIMENSIONS.map((d) => {
    const lv = Math.max(0, Math.min(5, Math.round(weights[d.key] ?? 0)));
    return `- ${d.label}：${levelLabels[lv]}`;
  }).join('\n');

  const listingLines = scored
    .map((s) => {
      const l = s.listing;
      return [
        `【${l.name}】（当前排名第 ${s.rank}，总分 ${s.totalScore}）`,
        `  租金 ${l.rent} 元/月，杂费(取暖/网费/物业等) ${l.monthlyExtraFees} 元/月，${l.type}，独立性 ${l.independence}/5，面积 ${l.area || '未填'} m²，采光 ${l.lighting}/5`,
        `  单程通勤 ${l.commuteMinutes} 分钟，每天交通费 ${l.dailyTransitCost} 元`,
        `  月支出（实际掏的钱）${s.cost.outOfPocket} 元 = 房租 ${s.cost.rent} + 杂费 ${s.cost.fees} + 交通 ${s.cost.transit}`,
        `  真实月开销 ${s.cost.total} 元 = 月支出 ${s.cost.outOfPocket} + 通勤时间折算 ${s.cost.commuteTimeCost}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    '你是一位务实、懂行的租房顾问。请基于以下数据帮我做决策分析。',
    '',
    `我的月收入约 ${profile.monthlyIncome} 元，每月工作 ${profile.workDaysPerMonth} 天。`,
    `通勤时间我按时薪的 ${Math.round((profile.timeValueFactor ?? 0.5) * 100)}% 来折算（反映我对通勤时间的在意程度）。`,
    '我对各维度的看重程度（权重越高越在意）：',
    weightLines,
    '',
    '候选房源（真实开销已把通勤时间按我的时薪折算成钱）：',
    '',
    listingLines,
    '',
    '请用中文输出：',
    '1. 一句话结论：最推荐哪套，为什么；',
    '2. 逐套点评其优劣，特别指出我可能忽略的权衡（如「便宜但通勤拖累严重」）；',
    '3. 一条我没填、但值得实地确认的注意事项。',
    '语气简洁、口语化，不要复述我给的数字表格。',
  ].join('\n');
}

/**
 * 调用 OpenAI 兼容接口做分析。直接从浏览器发请求到模型服务商。
 * 注意：部分服务商可能限制浏览器跨域(CORS)直连，本地 Ollama 需开启允许跨域。
 */
export async function analyzeListings(
  config: LlmConfig,
  scored: ScoredListing[],
  weights: Weights,
  profile: UserProfile
): Promise<string> {
  const prompt = buildPrompt(scored, weights, profile);
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`模型请求失败（${resp.status}）：${text || resp.statusText}`);
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('模型返回为空，请检查模型名是否正确');
  return content as string;
}
