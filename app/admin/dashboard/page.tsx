'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

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

interface ExpandModal {
  label: string;
  value: string;
  onChange: (v: string) => void;
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

function ExpandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
      <path d="M8.5 1.5H12.5V5.5M12.5 1.5L8 6M5.5 12.5H1.5V8.5M1.5 12.5L6 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  rows = 12,
  hint,
  onExpand,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
  onExpand: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">{label}</label>
        <button
          type="button"
          onClick={onExpand}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors px-1.5 py-0.5 rounded hover:bg-gray-800"
        >
          <ExpandIcon />
          확대
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm font-mono leading-relaxed resize-y focus:outline-none focus:border-gray-500"
      />
      {hint && <p className="text-xs text-gray-600">{hint}</p>}
    </div>
  );
}

function ExpandedModal({ modal, onClose }: { modal: ExpandModal; onClose: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-4xl h-[90dvh] bg-gray-900 rounded-2xl flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-gray-800">
          <span className="text-sm font-medium text-gray-200">{modal.label}</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-1 rounded hover:bg-gray-800"
          >
            ✕
          </button>
        </div>
        <textarea
          ref={ref}
          value={modal.value}
          onChange={(e) => modal.onChange(e.target.value)}
          className="flex-1 w-full px-4 md:px-5 py-4 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none text-gray-100"
        />
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [selected, setSelected] = useState<LlmConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ExpandModal | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data: LlmConfig[]) => {
        setConfigs(data);
        if (data.length > 0) setSelected(structuredClone(data[0]));
      })
      .catch(() => setError('설정을 불러오지 못했습니다.'));
  }, []);

  const save = useCallback(async (config: LlmConfig) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
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
  }, []);

  function scheduleAutoSave(config: LlmConfig) {
    setSaved(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);

    setCountdown(3);
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimer.current!);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    debounceTimer.current = setTimeout(() => save(config), 3000);
  }

  function selectConfig(config: LlmConfig) {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setCountdown(null);
    setSelected(structuredClone(config));
    setSaved(false);
    setError('');
  }

  function updateField<K extends keyof LlmConfig>(field: K, value: LlmConfig[K]) {
    if (!selected) return;
    const next = { ...selected, [field]: value };
    setSelected(next);
    scheduleAutoSave(next);
  }

  function updatePart(index: number, content: string) {
    if (!selected) return;
    const parts = [...selected.prompt_parts];
    parts[index] = { ...parts[index], content };
    const next = { ...selected, prompt_parts: parts };
    setSelected(next);
    scheduleAutoSave(next);
  }

  const availableModels = selected ? (PROVIDER_MODELS[selected.provider] ?? []) : [];

  return (
    <>
      {modal && <ExpandedModal modal={modal} onClose={() => setModal(null)} />}

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
                  {saving && <span className="text-gray-500 text-xs md:text-sm">저장 중...</span>}
                  {!saving && saved && <span className="text-green-400 text-xs md:text-sm">저장됨</span>}
                  {!saving && !saved && countdown !== null && (
                    <span className="text-gray-500 text-xs tabular-nums">{countdown}초 후 자동저장</span>
                  )}
                  {error && <span className="text-red-400 text-xs md:text-sm max-w-[140px] text-right leading-tight">{error}</span>}
                  <button
                    onClick={() => {
                      if (debounceTimer.current) clearTimeout(debounceTimer.current);
                      if (countdownTimer.current) clearInterval(countdownTimer.current);
                      setCountdown(null);
                      if (selected) save(selected);
                    }}
                    disabled={saving}
                    className="px-3 md:px-4 py-1.5 md:py-2 rounded-lg bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    저장
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
                  <select
                    value={selected.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-sm focus:outline-none focus:border-gray-500"
                  >
                    {availableModels.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
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
              <TextareaField
                label="System Prompt"
                value={selected.system_prompt}
                onChange={(v) => updateField('system_prompt', v)}
                rows={12}
                hint={selected.key === 'chat' ? '{{user_context}} 위치에 유저 정보와 응답 데이터가 자동 삽입됩니다.' : undefined}
                onExpand={() => setModal({
                  label: 'System Prompt',
                  value: selected.system_prompt,
                  onChange: (v) => updateField('system_prompt', v),
                })}
              />

              {/* Prompt Parts */}
              {selected.prompt_parts.length > 0 && (
                <div className="flex flex-col gap-4">
                  <p className="text-xs text-gray-400">Prompt Parts (User Message에 순서대로 조립)</p>
                  {selected.prompt_parts.map((part, i) => (
                    <TextareaField
                      key={part.key}
                      label={`${i + 1}. ${part.label}`}
                      value={part.content}
                      onChange={(v) => updatePart(i, v)}
                      rows={10}
                      onExpand={() => setModal({
                        label: `${i + 1}. ${part.label}`,
                        value: part.content,
                        onChange: (v) => updatePart(i, v),
                      })}
                    />
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
    </>
  );
}
