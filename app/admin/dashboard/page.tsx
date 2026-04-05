'use client';

import { useEffect, useState } from 'react';

interface PromptPart {
  key: string;
  label: string;
  content: string;
}

interface LlmConfig {
  id: string;
  key: string;
  provider: string;
  model: string;
  system_prompt: string;
  prompt_parts: PromptPart[];
  is_active: boolean;
  updated_at: string;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: [
    // Current
    'claude-opus-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    // Legacy
    'claude-opus-4-5-20251101',
    'claude-opus-4-1-20250805',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
    'claude-opus-4-20250514',
    'claude-3-haiku-20240307',
  ],
  openai: [
    // Current
    'gpt-5.4',
    'gpt-5.4-mini',
    'gpt-5.4-nano',
    // Legacy
    'gpt-5.2',
    'gpt-5.1',
  ],
};

const CONFIG_LABELS: Record<string, string> = {
  chat: '대화 (Chat)',
  analyze_core: '핵심 분석 (Core)',
  analyze_detail: '상세 분석 (Detail)',
  couple: '커플 분석 (Couple)',
};

export default function AdminDashboardPage() {
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [selected, setSelected] = useState<LlmConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data: LlmConfig[]) => {
        setConfigs(data);
        if (data.length > 0) setSelected(structuredClone(data[0]));
      })
      .catch(() => setError('설정을 불러오지 못했습니다.'));
  }, []);

  function selectConfig(config: LlmConfig) {
    setSelected(structuredClone(config));
    setSaved(false);
    setError('');
  }

  function updateField<K extends keyof LlmConfig>(field: K, value: LlmConfig[K]) {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
    setSaved(false);
  }

  function updatePart(index: number, content: string) {
    if (!selected) return;
    const parts = [...selected.prompt_parts];
    parts[index] = { ...parts[index], content };
    setSelected({ ...selected, prompt_parts: parts });
    setSaved(false);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected),
      });
      const data = await res.json() as LlmConfig & { error?: string };
      if (!res.ok) {
        setError(data.error ?? '저장에 실패했습니다.');
        return;
      }
      setConfigs((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      setSelected(structuredClone(data));
      setSaved(true);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  }

  const availableModels = selected ? (PROVIDER_MODELS[selected.provider] ?? []) : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row">
      {/* Nav — horizontal tabs on mobile, vertical sidebar on desktop */}
      <nav className="md:w-52 md:shrink-0 md:border-r md:border-gray-800 md:p-4 md:flex md:flex-col md:gap-1
                      border-b border-gray-800 overflow-x-auto">
        <p className="hidden md:block text-xs text-gray-500 font-medium uppercase tracking-widest mb-3">Prompts</p>
        <div className="flex md:flex-col gap-1 p-3 md:p-0">
          {configs.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConfig(c)}
              className={`shrink-0 text-left px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                selected?.id === c.id
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              {CONFIG_LABELS[c.key] ?? c.key}
              {!c.is_active && <span className="ml-1 text-xs text-gray-600">(off)</span>}
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="flex flex-col gap-5 p-4 md:p-8 max-w-3xl">
            {/* Header — sticky on mobile */}
            <div className="sticky top-0 z-10 bg-gray-950 py-3 -mx-4 px-4 md:static md:p-0 md:bg-transparent
                            flex items-center justify-between border-b border-gray-800/60 md:border-0">
              <h1 className="text-base md:text-lg font-semibold">{CONFIG_LABELS[selected.key] ?? selected.key}</h1>
              <div className="flex items-center gap-2 md:gap-3">
                {saved && <span className="text-green-400 text-xs md:text-sm">저장됨</span>}
                {error && <span className="text-red-400 text-xs md:text-sm max-w-[140px] text-right leading-tight">{error}</span>}
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            {/* Provider & Model */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-gray-400">Provider</label>
                <select
                  value={selected.provider}
                  onChange={(e) => {
                    const p = e.target.value;
                    const firstModel = PROVIDER_MODELS[p]?.[0] ?? '';
                    setSelected({ ...selected, provider: p, model: firstModel });
                    setSaved(false);
                  }}
                  className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-gray-500"
                >
                  {Object.keys(PROVIDER_MODELS).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs text-gray-400">Model</label>
                <input
                  list={`models-${selected.id}`}
                  value={selected.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-gray-500"
                />
                <datalist id={`models-${selected.id}`}>
                  {availableModels.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div className="flex items-center sm:items-end sm:pb-0.5">
                <label className="flex items-center gap-2 cursor-pointer py-2 sm:py-0">
                  <input
                    type="checkbox"
                    checked={selected.is_active}
                    onChange={(e) => updateField('is_active', e.target.checked)}
                    className="w-4 h-4 accent-white"
                  />
                  <span className="text-sm text-gray-300">활성화</span>
                </label>
              </div>
            </div>

            {/* System Prompt */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">System Prompt</label>
              <textarea
                value={selected.system_prompt}
                onChange={(e) => updateField('system_prompt', e.target.value)}
                rows={7}
                className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-gray-500"
              />
              {selected.key === 'chat' && (
                <p className="text-xs text-gray-600">
                  {'{{user_context}}'} 위치에 유저 정보와 응답 데이터가 자동 삽입됩니다.
                </p>
              )}
            </div>

            {/* Prompt Parts */}
            {selected.prompt_parts.length > 0 && (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-gray-400">Prompt Parts (User Message에 순서대로 조립)</p>
                {selected.prompt_parts.map((part, i) => (
                  <div key={part.key} className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-500">
                      {i + 1}. {part.label}
                    </label>
                    <textarea
                      value={part.content}
                      onChange={(e) => updatePart(i, e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-gray-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-600 pb-6">
              마지막 수정: {new Date(selected.updated_at).toLocaleString('ko-KR')}
            </p>
          </div>
        ) : (
          <p className="p-6 text-gray-500 text-sm">설정을 불러오는 중...</p>
        )}
      </main>
    </div>
  );
}
