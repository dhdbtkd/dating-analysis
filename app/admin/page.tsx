'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatGradientBackground } from '@/components/ui/ChatGradientBackground';
import type { ChatBgConfig } from '@/components/ui/ChatGradientBackground';
import { DEFAULT_CHAT_BG_CONFIG } from '@/components/ui/ChatGradientBackground';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [bgConfig, setBgConfig] = useState<ChatBgConfig>(DEFAULT_CHAT_BG_CONFIG);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d: { chatBgConfig?: ChatBgConfig }) => {
        if (d.chatBgConfig) setBgConfig({ ...DEFAULT_CHAT_BG_CONFIG, ...d.chatBgConfig });
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        setError(data.error ?? '오류가 발생했습니다.');
        return;
      }

      router.push('/admin/dashboard');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 relative">
      <ChatGradientBackground config={bgConfig} />
      <div
        className="relative z-10 w-full max-w-sm p-6 md:p-8 rounded-2xl"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1 className="text-xl font-semibold text-white mb-6">Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full px-4 py-3 rounded-lg text-white placeholder-white/40 focus:outline-none transition-colors"
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.4)')}
            onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
            autoFocus
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-lg font-medium transition-all disabled:opacity-40"
            style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: '#000' }}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
