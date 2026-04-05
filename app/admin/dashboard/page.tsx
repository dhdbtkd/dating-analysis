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
  anthropic: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-5'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1', 'o3-mini'],
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
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-gray-800 p-4 flex flex-col gap-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-widest mb-3">Prompts</p>
        {configs.map((c) => (
          <button
            key={c.id}
            onClick={() => selectConfig(c)}
            className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              selected?.id === c.id
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            {CONFIG_LABELS[c.key] ?? c.key}
            {!c.is_active && <span className="ml-1 text-xs text-gray-600">(off)</span>}
          </button>
        ))}
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-y-auto">
        {selected ? (
          <div className="max-w-3xl flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold">{CONFIG_LABELS[selected.key] ?? selected.key}</h1>
              <div className="flex items-center gap-3">
                {saved && <span className="text-green-400 text-sm">저장됨</span>}
                {error && <span className="text-red-400 text-sm">{error}</span>}
                <button
                  onClick={save}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>

            {/* Provider & Model */}
            <div className="flex gap-4">
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
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-gray-500"
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
                  className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-gray-500"
                />
                <datalist id={`models-${selected.id}`}>
                  {availableModels.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div className="flex flex-col gap-1.5 justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
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
                rows={8}
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
                      rows={6}
                      className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-gray-500"
                    />
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-600">
              마지막 수정: {new Date(selected.updated_at).toLocaleString('ko-KR')}
            </p>
          </div>
        ) : (
          <p className="text-gray-500">설정을 불러오는 중...</p>
        )}
      </main>
    </div>
  );
}
