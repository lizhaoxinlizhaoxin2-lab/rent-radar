import { useState } from 'react';
import type { ScoredListing, Weights, UserProfile } from '../types';
import {
  analyzeListings,
  loadLlmConfig,
  saveLlmConfig,
  PROVIDER_PRESETS,
  type LlmConfig,
} from '../lib/llm';

interface Props {
  results: ScoredListing[];
  weights: Weights;
  profile: UserProfile;
}

/** AI 深度分析面板：配置模型 + 调用 + 展示点评 */
export default function AiPanel({ results, weights, profile }: Props) {
  const [config, setConfig] = useState<LlmConfig>(loadLlmConfig);
  const [showSettings, setShowSettings] = useState(!config.apiKey);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [error, setError] = useState('');

  function applyPreset(label: string) {
    const p = PROVIDER_PRESETS.find((x) => x.label === label);
    if (p) setConfig({ ...config, baseUrl: p.baseUrl, model: p.model });
  }

  async function run() {
    setError('');
    setAnalysis('');
    saveLlmConfig(config);
    setLoading(true);
    try {
      const text = await analyzeListings(config, results, weights, profile);
      setAnalysis(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const canRun = results.length > 0 && config.apiKey && !loading;

  return (
    <div className="card">
      <div className="row-between">
        <h2>⑤ AI 深度分析（可选）</h2>
        <button className="btn-ghost" onClick={() => setShowSettings((s) => !s)}>
          {showSettings ? '收起设置' : '模型设置'}
        </button>
      </div>
      <p className="muted">
        打分用纯公式（稳定可复现）；这一步让大模型用「人话」点评权衡、给建议。
        你的 API Key 只存在本地浏览器，不会上传到任何服务器。
      </p>

      {showSettings && (
        <div className="settings">
          <div className="field-row">
            <label>
              服务商预设
              <select onChange={(e) => applyPreset(e.target.value)} defaultValue="">
                <option value="" disabled>
                  选择以快速填入
                </option>
                {PROVIDER_PRESETS.map((p) => (
                  <option key={p.label} value={p.label}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              模型名
              <input
                value={config.model}
                onChange={(e) => setConfig({ ...config, model: e.target.value })}
              />
            </label>
          </div>
          <label className="full">
            API 地址（baseUrl）
            <input
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
          </label>
          <label className="full">
            API Key
            <input
              type="password"
              placeholder="sk-..."
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
          </label>
        </div>
      )}

      <button className="btn-primary" disabled={!canRun} onClick={run}>
        {loading ? '分析中…' : '🤖 让 AI 帮我分析'}
      </button>

      {error && <p className="error">⚠️ {error}</p>}
      {analysis && <div className="analysis">{analysis}</div>}
    </div>
  );
}
