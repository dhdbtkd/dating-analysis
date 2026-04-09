'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { DEFAULT_SPLASH_CONFIG, SplashPreviewCanvas, PATTERN_LABELS } from '@/components/screens/SplashScreen';
import type { SplashConfig, SplashPattern } from '@/components/screens/SplashScreen';
import { ChatBgPreviewCanvas, DEFAULT_CHAT_BG_CONFIG, CHAT_BG_PATTERN_LABELS } from '@/components/ui/ChatGradientBackground';
import type { ChatBgConfig, ChatBgPattern } from '@/components/ui/ChatGradientBackground';

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

interface AppSetting {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

interface ExpandModal {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

const PROVIDER_MODELS: Record<string, string[]> = {
  anthropic: [
    'claude-opus-4-6',
    'claude-sonnet-4-5-20250929',
    'claude-haiku-4-5-20251001',
    'claude-opus-4-5-20251101',
    'claude-opus-4-1-20250805',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
    'claude-opus-4-20250514',
    'claude-3-haiku-20240307',
  ],
  openai: ['gpt-5.4', 'gpt-5.4-mini', 'gpt-5.4-nano', 'gpt-5.2', 'gpt-5.1'],
};

const CONFIG_LABELS: Record<string, string> = {
  chat: 'Chat',
  analyze_core: 'Core 분석',
  analyze_detail: 'Detail 분석',
  couple: '커플 분석',
};

type NavTab = 'prompts' | 'settings' | 'splash';

/* ── 확대 모달 ── */
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-4xl h-[92dvh] sm:h-[88dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ backgroundColor: '#111' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#222' }}>
          <span className="text-sm font-medium text-white">{modal.label}</span>
          <button onClick={onClose} className="text-xs text-neutral-500 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/10">
            ESC
          </button>
        </div>
        <textarea
          ref={ref}
          value={modal.value}
          onChange={(e) => modal.onChange(e.target.value)}
          className="flex-1 w-full px-5 py-4 bg-transparent text-sm font-mono leading-relaxed resize-none focus:outline-none text-neutral-100"
          style={{ caretColor: '#fff' }}
        />
      </div>
    </div>
  );
}

/* ── 텍스트에어리어 필드 ── */
function TextareaField({
  label, value, onChange, rows = 12, hint, onExpand,
}: {
  label: string; value: string; onChange: (v: string) => void;
  rows?: number; hint?: string; onExpand: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium tracking-wide uppercase text-neutral-500">{label}</label>
        <button
          type="button"
          onClick={onExpand}
          className="text-[11px] text-neutral-600 hover:text-neutral-300 transition-colors px-2 py-0.5 rounded hover:bg-white/5"
        >
          확대
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3.5 py-3 rounded-xl text-sm font-mono leading-relaxed resize-y focus:outline-none transition-colors"
        style={{
          backgroundColor: '#111',
          border: '1px solid #222',
          color: '#e5e5e5',
          caretColor: '#fff',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#444')}
        onBlur={(e) => (e.target.style.borderColor = '#222')}
      />
      {hint && <p className="text-[11px] text-neutral-600">{hint}</p>}
    </div>
  );
}

/* ── 메인 ── */
export default function AdminDashboardPage() {
  const [tab, setTab] = useState<NavTab>('prompts');
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [selected, setSelected] = useState<LlmConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ExpandModal | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  const [splash, setSplash] = useState<SplashConfig>({ ...DEFAULT_SPLASH_CONFIG });
  const [splashSaving, setSplashSaving] = useState(false);
  const [splashSaved, setSplashSaved] = useState(false);
  const [splashError, setSplashError] = useState('');

  const [chatBg, setChatBg] = useState<ChatBgConfig>({ ...DEFAULT_CHAT_BG_CONFIG });
  const [chatBgSaving, setChatBgSaving] = useState(false);
  const [chatBgSaved, setChatBgSaved] = useState(false);
  const [chatBgError, setChatBgError] = useState('');

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data: LlmConfig[]) => { setConfigs(data); if (data.length > 0) setSelected(structuredClone(data[0])); })
      .catch(() => setError('설정을 불러오지 못했습니다.'));
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: AppSetting[]) => {
        setSettings(data);
        const sc = data.find(s => s.key === 'splash_config')?.value;
        if (sc && typeof sc === 'object') setSplash({ ...DEFAULT_SPLASH_CONFIG, ...(sc as SplashConfig) });
        const bc = data.find(s => s.key === 'chat_bg_config')?.value;
        if (bc && typeof bc === 'object') setChatBg({ ...DEFAULT_CHAT_BG_CONFIG, ...(bc as ChatBgConfig) });
      })
      .catch(() => {});
  }, []);

  async function saveSplash(cfg: SplashConfig) {
    setSplashSaving(true); setSplashError(''); setSplashSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'splash_config', value: cfg }),
      });
      const data = await res.json() as AppSetting & { error?: string };
      if (!res.ok) { setSplashError(data.error ?? '저장 실패'); return; }
      setSplashSaved(true);
      setTimeout(() => setSplashSaved(false), 2000);
    } catch { setSplashError('네트워크 오류'); }
    finally { setSplashSaving(false); }
  }

  function updateSplash(patch: Partial<SplashConfig>) {
    setSplash(prev => ({ ...prev, ...patch }));
  }

  async function saveChatBg(cfg: ChatBgConfig) {
    setChatBgSaving(true); setChatBgError(''); setChatBgSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'chat_bg_config', value: cfg }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setChatBgError((data as { error?: string }).error ?? '저장 실패'); return; }
      setChatBgSaved(true);
      setTimeout(() => setChatBgSaved(false), 2000);
    } catch { setChatBgError('네트워크 오류'); }
    finally { setChatBgSaving(false); }
  }

  function updateChatBg(patch: Partial<ChatBgConfig>) {
    setChatBg(prev => ({ ...prev, ...patch }));
  }

  async function saveSettings(key: string, value: unknown) {
    setSettingsSaving(true); setSettingsError(''); setSettingsSaved(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json() as AppSetting & { error?: string };
      if (!res.ok) { setSettingsError(data.error ?? '저장 실패'); return; }
      setSettings((prev) => prev.map((s) => s.key === key ? data : s));
      setSettingsSaved(true);
    } catch { setSettingsError('네트워크 오류'); }
    finally { setSettingsSaving(false); }
  }

  function getSettingValue(key: string): unknown {
    return settings.find((s) => s.key === key)?.value;
  }

  const save = useCallback(async (config: LlmConfig) => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json() as LlmConfig & { error?: string };
      if (!res.ok) { setError(data.error ?? '저장 실패'); return; }
      setConfigs((prev) => prev.map((c) => (c.id === data.id ? data : c)));
      setSelected(structuredClone(data));
      setSaved(true);
    } catch { setError('네트워크 오류'); }
    finally { setSaving(false); }
  }, []);

  function scheduleAutoSave(config: LlmConfig) {
    setSaved(false);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setCountdown(3);
    countdownTimer.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) { clearInterval(countdownTimer.current!); return null; }
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

  const selectStyle = {
    backgroundColor: '#111',
    border: '1px solid #222',
    color: '#e5e5e5',
  };

  return (
    <>
      {modal && <ExpandedModal modal={modal} onClose={() => setModal(null)} />}

      <div className="min-h-screen flex flex-col md:flex-row text-white" style={{ backgroundColor: '#0a0a0a' }}>

        {/* ── 사이드바 ── */}
        <nav className="md:w-48 md:shrink-0 flex flex-col md:min-h-screen"
          style={{ borderRight: '1px solid #1a1a1a', backgroundColor: '#0d0d0d' }}>

          {/* 로고 영역 */}
          <div className="px-5 py-5 hidden md:block" style={{ borderBottom: '1px solid #1a1a1a' }}>
            <span className="text-xs font-semibold tracking-widest uppercase text-neutral-500">Admin</span>
          </div>

          {/* 탭 */}
          <div className="flex md:flex-col gap-0 overflow-x-auto md:overflow-visible p-3 md:p-3 md:pt-4">
            {([
              { id: 'prompts',  label: 'Prompts' },
              { id: 'settings', label: '앱 설정' },
              { id: 'splash',   label: 'Splash' },
            ] as { id: NavTab; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="shrink-0 text-left px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap"
                style={{
                  backgroundColor: tab === id ? '#1e1e1e' : 'transparent',
                  color: tab === id ? '#fff' : '#555',
                  fontWeight: tab === id ? 500 : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Prompt 서브메뉴 */}
          {tab === 'prompts' && configs.length > 0 && (
            <div className="flex md:flex-col gap-0 overflow-x-auto md:overflow-visible px-3 pb-3 md:pb-0">
              <p className="hidden md:block text-[10px] font-semibold tracking-widest uppercase px-3 py-2"
                style={{ color: '#333' }}>모델</p>
              {configs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConfig(c)}
                  className="shrink-0 text-left px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap flex items-center gap-2"
                  style={{
                    backgroundColor: selected?.id === c.id ? '#1e1e1e' : 'transparent',
                    color: selected?.id === c.id ? '#e5e5e5' : '#444',
                  }}
                >
                  {CONFIG_LABELS[c.key] ?? c.key}
                  {!c.is_active && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e1e1e', color: '#444' }}>off</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* ── 메인 콘텐츠 ── */}
        <main className="flex-1 overflow-y-auto">

          {/* 앱 설정 탭 */}
          {tab === 'settings' && (
            <div className="max-w-xl p-6 md:p-10 flex flex-col gap-8">
              <div>
                <h1 className="text-base font-semibold text-white">앱 설정</h1>
                <p className="text-xs mt-1" style={{ color: '#555' }}>서비스 동작에 관한 런타임 설정</p>
              </div>

              {/* chat_max_turns */}
              <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">채팅 최대 턴 수</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>사용자가 대화할 수 있는 최대 횟수</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {settingsSaving && <span className="text-xs" style={{ color: '#555' }}>저장 중</span>}
                    {!settingsSaving && settingsSaved && <span className="text-xs text-green-500">저장됨</span>}
                    {settingsError && <span className="text-xs text-red-400">{settingsError}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={Number(getSettingValue('chat_max_turns') ?? 6)}
                    key={String(getSettingValue('chat_max_turns'))}
                    className="w-20 px-3 py-2 rounded-lg text-sm focus:outline-none text-white"
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #2a2a2a' }}
                    onFocus={(e) => (e.target.style.borderColor = '#444')}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#2a2a2a';
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= 1 && v <= 20) saveSettings('chat_max_turns', v);
                    }}
                  />
                  <span className="text-xs" style={{ color: '#444' }}>1 – 20</span>
                </div>
                {settings.find(s => s.key === 'chat_max_turns')?.updated_at && (
                  <p className="text-[11px]" style={{ color: '#333' }}>
                    수정: {new Date(settings.find(s => s.key === 'chat_max_turns')!.updated_at).toLocaleString('ko-KR')}
                  </p>
                )}
              </div>

              {/* Chat 배경 색상 */}
              <div className="flex flex-col gap-4 p-5 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">Chat 배경 색상</p>
                    <p className="text-xs mt-0.5" style={{ color: '#555' }}>채팅 화면 및 어드민 로그인 배경 셰이더</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {chatBgSaving && <span className="text-xs" style={{ color: '#555' }}>저장 중</span>}
                    {!chatBgSaving && chatBgSaved && <span className="text-xs text-green-500">저장됨</span>}
                    {chatBgError && <span className="text-xs text-red-400">{chatBgError}</span>}
                    <button
                      onClick={() => saveChatBg(chatBg)}
                      disabled={chatBgSaving}
                      className="px-3 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-30"
                      style={{ backgroundColor: '#fff', color: '#000' }}
                    >저장</button>
                    <button
                      onClick={() => setChatBg({ ...DEFAULT_CHAT_BG_CONFIG })}
                      className="px-3 py-1 rounded-lg text-xs transition-all"
                      style={{ backgroundColor: '#1e1e1e', color: '#888' }}
                    >초기화</button>
                  </div>
                </div>

                {/* 미리보기 */}
                <div className="relative rounded-xl overflow-hidden" style={{ height: 160, border: '1px solid #1e1e1e' }}>
                  <ChatBgPreviewCanvas config={chatBg} />
                </div>

                {/* 패턴 선택 */}
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Pattern</p>
                  <div className="grid grid-cols-5 gap-2">
                    {(Object.entries(CHAT_BG_PATTERN_LABELS) as [ChatBgPattern, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => updateChatBg({ pattern: key })}
                        className="py-2 rounded-lg text-xs font-medium transition-all"
                        style={{
                          backgroundColor: chatBg.pattern === key ? chatBg.colorC + '33' : '#1a1a1a',
                          color: chatBg.pattern === key ? '#fff' : '#555',
                          border: `1px solid ${chatBg.pattern === key ? chatBg.colorC + '88' : '#2a2a2a'}`,
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 색상 피커 */}
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Colors</p>
                  {([
                    { key: 'colorA', label: 'Base Dark' },
                    { key: 'colorB', label: 'Base Blue' },
                    { key: 'colorC', label: 'Highlight' },
                    { key: 'colorD', label: 'Glow Accent' },
                    { key: 'colorE', label: 'Secondary' },
                  ] as { key: keyof ChatBgConfig; label: string }[]).map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                      <input
                        type="color"
                        value={chatBg[key] as string}
                        onChange={(e) => updateChatBg({ [key]: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0.5"
                        style={{ backgroundColor: '#1a1a1a' }}
                      />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-white">{label}</p>
                        <p className="text-[11px] font-mono" style={{ color: '#555' }}>{chatBg[key] as string}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 파라미터 슬라이더 */}
                <div className="flex flex-col gap-4">
                  <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Parameters</p>
                  {([
                    { key: 'speed',         label: '속도',        min: 0.1, max: 2.0, step: 0.05 },
                    { key: 'warpStrength',  label: '왜곡 강도',   min: 0.1, max: 2.0, step: 0.05 },
                    { key: 'glowIntensity', label: '글로우 밝기', min: 0.1, max: 2.5, step: 0.05 },
                    { key: 'reactivity',    label: '채팅 반응 강도', min: 0.0, max: 1.0, step: 0.05 },
                  ] as { key: keyof ChatBgConfig; label: string; min: number; max: number; step: number }[]).map(({ key, label, min, max, step }) => (
                    <div key={key} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{label}</span>
                        <span className="text-xs font-mono tabular-nums" style={{ color: '#888' }}>
                          {Number(chatBg[key]).toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={min} max={max} step={step}
                        value={chatBg[key] as number}
                        onChange={(e) => updateChatBg({ [key]: parseFloat(e.target.value) })}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: chatBg.colorC, backgroundColor: '#2a2a2a' }}
                      />
                      <div className="flex justify-between text-[10px]" style={{ color: '#333' }}>
                        <span>{min}</span><span>{max}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Splash 탭 */}
          {tab === 'splash' && (
            <div className="max-w-xl p-6 md:p-10 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-base font-semibold text-white">Splash 셰이더</h1>
                  <p className="text-xs mt-1" style={{ color: '#555' }}>변경 즉시 미리보기 — 저장 눌러야 반영</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {splashSaving && <span className="text-xs" style={{ color: '#555' }}>저장 중…</span>}
                  {!splashSaving && splashSaved && <span className="text-xs text-green-500">저장됨</span>}
                  {splashError && <span className="text-xs text-red-400">{splashError}</span>}
                  <button
                    onClick={() => saveSplash(splash)}
                    disabled={splashSaving}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                    style={{ backgroundColor: '#fff', color: '#000' }}
                  >저장</button>
                  <button
                    onClick={() => { setSplash({ ...DEFAULT_SPLASH_CONFIG }); }}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all"
                    style={{ backgroundColor: '#1e1e1e', color: '#888' }}
                  >초기화</button>
                </div>
              </div>

              {/* 미리보기 — 실제 셰이더 */}
              <div className="relative rounded-2xl overflow-hidden" style={{ height: 220, border: '1px solid #1e1e1e' }}>
                <SplashPreviewCanvas config={splash} />
                <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
                  <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded" style={{ color: 'rgba(255,255,255,0.4)', backgroundColor: 'rgba(0,0,0,0.3)' }}>live preview</span>
                </div>
              </div>

              {/* 패턴 선택 */}
              <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Pattern</p>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.entries(PATTERN_LABELS) as [SplashPattern, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => updateSplash({ pattern: key })}
                      className="py-2 rounded-lg text-xs font-medium transition-all"
                      style={{
                        backgroundColor: splash.pattern === key ? splash.colorC + '33' : '#1a1a1a',
                        color: splash.pattern === key ? '#fff' : '#555',
                        border: `1px solid ${splash.pattern === key ? splash.colorC + '88' : '#2a2a2a'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 색상 */}
              <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Colors</p>
                {([
                  { key: 'colorA', label: 'Void (배경)' },
                  { key: 'colorB', label: 'Base Blue' },
                  { key: 'colorC', label: 'Cyan Glow' },
                  { key: 'colorD', label: 'Violet' },
                  { key: 'colorE', label: 'Lavender' },
                ] as { key: keyof SplashConfig; label: string }[]).map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-4">
                    <input
                      type="color"
                      value={splash[key] as string}
                      onChange={(e) => updateSplash({ [key]: e.target.value })}
                      className="w-9 h-9 rounded-lg cursor-pointer border-0 bg-transparent p-0.5"
                      style={{ backgroundColor: '#1a1a1a' }}
                    />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white">{label}</p>
                      <p className="text-[11px] font-mono" style={{ color: '#555' }}>{splash[key] as string}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 파라미터 슬라이더 */}
              <div className="flex flex-col gap-5 p-5 rounded-xl" style={{ backgroundColor: '#111', border: '1px solid #1e1e1e' }}>
                <p className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#555' }}>Parameters</p>
                {([
                  { key: 'speed',        label: '속도',       min: 0.1, max: 2.0, step: 0.05 },
                  { key: 'warpStrength', label: '왜곡 강도',  min: 0.1, max: 2.0, step: 0.05 },
                  { key: 'glowIntensity',label: '글로우 밝기', min: 0.1, max: 2.5, step: 0.05 },
                ] as { key: keyof SplashConfig; label: string; min: number; max: number; step: number }[]).map(({ key, label, min, max, step }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{label}</span>
                      <span className="text-xs font-mono tabular-nums" style={{ color: '#888' }}>
                        {Number(splash[key]).toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={min} max={max} step={step}
                      value={splash[key] as number}
                      onChange={(e) => updateSplash({ [key]: parseFloat(e.target.value) })}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: splash.colorC, backgroundColor: '#2a2a2a' }}
                    />
                    <div className="flex justify-between text-[10px]" style={{ color: '#333' }}>
                      <span>{min}</span><span>{max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prompts 탭 */}
          {tab === 'prompts' && (selected ? (
            <div className="max-w-3xl p-6 md:p-10 flex flex-col gap-6">

              {/* 헤더 */}
              <div className="flex items-center justify-between gap-4 pb-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
                <div>
                  <h1 className="text-base font-semibold text-white">{CONFIG_LABELS[selected.key] ?? selected.key}</h1>
                  <p className="text-xs mt-0.5" style={{ color: '#444' }}>{selected.provider} / {selected.model}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {saving && <span className="text-xs" style={{ color: '#555' }}>저장 중…</span>}
                  {!saving && saved && <span className="text-xs text-green-500">저장됨</span>}
                  {!saving && !saved && countdown !== null && (
                    <span className="text-xs tabular-nums" style={{ color: '#555' }}>{countdown}s</span>
                  )}
                  {error && <span className="text-xs text-red-400 max-w-[120px] text-right leading-tight">{error}</span>}
                  <button
                    onClick={() => {
                      if (debounceTimer.current) clearTimeout(debounceTimer.current);
                      if (countdownTimer.current) clearInterval(countdownTimer.current);
                      setCountdown(null);
                      if (selected) save(selected);
                    }}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-30"
                    style={{ backgroundColor: '#fff', color: '#000' }}
                  >
                    저장
                  </button>
                </div>
              </div>

              {/* Provider / Model / 활성화 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-medium tracking-wide uppercase" style={{ color: '#555' }}>Provider</label>
                  <select
                    value={selected.provider}
                    onChange={(e) => {
                      const p = e.target.value;
                      const firstModel = PROVIDER_MODELS[p]?.[0] ?? '';
                      setSelected({ ...selected, provider: p, model: firstModel });
                      setSaved(false);
                    }}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={selectStyle}
                  >
                    {Object.keys(PROVIDER_MODELS).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[11px] font-medium tracking-wide uppercase" style={{ color: '#555' }}>Model</label>
                  <select
                    value={selected.model}
                    onChange={(e) => updateField('model', e.target.value)}
                    className="px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={selectStyle}
                  >
                    {availableModels.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer py-2 sm:py-0">
                    <input
                      type="checkbox"
                      checked={selected.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="w-4 h-4 accent-white rounded"
                    />
                    <span className="text-sm" style={{ color: '#888' }}>활성화</span>
                  </label>
                </div>
              </div>

              {/* System Prompt */}
              <TextareaField
                label="System Prompt"
                value={selected.system_prompt}
                onChange={(v) => updateField('system_prompt', v)}
                rows={12}
                hint={selected.key === 'chat' ? '{{user_context}} 위치에 유저 정보가 삽입됩니다.' : undefined}
                onExpand={() => setModal({ label: 'System Prompt', value: selected.system_prompt, onChange: (v) => updateField('system_prompt', v) })}
              />

              {/* Prompt Parts */}
              {selected.prompt_parts.length > 0 && (
                <div className="flex flex-col gap-5">
                  <p className="text-[11px] font-medium tracking-wide uppercase" style={{ color: '#555' }}>
                    Prompt Parts
                  </p>
                  {selected.prompt_parts.map((part, i) => (
                    <TextareaField
                      key={part.key}
                      label={`${i + 1}. ${part.label}`}
                      value={part.content}
                      onChange={(v) => updatePart(i, v)}
                      rows={10}
                      onExpand={() => setModal({ label: `${i + 1}. ${part.label}`, value: part.content, onChange: (v) => updatePart(i, v) })}
                    />
                  ))}
                </div>
              )}

              <p className="text-[11px] pb-10" style={{ color: '#333' }}>
                수정: {new Date(selected.updated_at).toLocaleString('ko-KR')}
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm" style={{ color: '#333' }}>불러오는 중…</p>
            </div>
          ))}
        </main>
      </div>
    </>
  );
}
