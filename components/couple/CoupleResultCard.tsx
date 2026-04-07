'use client';

import { useState, useCallback } from 'react';
import type { CoupleAnalysis, SessionRow } from '@/types';

function GenderIcon({ gender }: { gender: string }) {
  if (gender === 'female') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="9" r="5.5" stroke="#c2185b" strokeWidth="2" />
        <line x1="12" y1="14.5" x2="12" y2="21" stroke="#c2185b" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="18" x2="15" y2="18" stroke="#c2185b" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="14" r="5.5" stroke="#1565c0" strokeWidth="2" />
      <line x1="14.5" y1="9.5" x2="20" y2="4" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" />
      <polyline points="16,4 20,4 20,8" stroke="#1565c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
import { GoldButton } from '@/components/ui/GoldButton';

interface CoupleResultCardProps {
  coupleId: string;
  session1: SessionRow;
  session2: SessionRow;
  analysis: CoupleAnalysis;
}

export function CoupleResultCard({ coupleId, session1, session2, analysis: initialAnalysis }: CoupleResultCardProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  console.log('[CoupleResultCard] 초기 분석 데이터:', initialAnalysis);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenMessage, setRegenMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    const title = `${session1.nickname}님 × ${session2.nickname}님의 커플 연애 패턴`;
    const desc = analysis.summary;

    if (window.Kakao?.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: desc,
          imageUrl: `${base}/api/og?nickname=${encodeURIComponent(session1.nickname + '×' + session2.nickname)}&type=${encodeURIComponent('커플 연애 패턴')}&tagline=${encodeURIComponent(analysis.compatibilityNote ?? '')}`,
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [
          {
            title: '커플 결과 보기',
            link: { mobileWebUrl: url, webUrl: url },
          },
          {
            title: '나도 해보기',
            link: { mobileWebUrl: base, webUrl: base },
          },
        ],
      });
      return;
    }

    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [session1.nickname, session2.nickname, analysis]);

  function handleAdminTriggerClick() {
    const now = Date.now();
    const recent = [...clickTimestamps, now].filter((t) => now - t <= 10000);
    setClickTimestamps(recent);
    if (recent.length >= 5) {
      setAdminUnlocked(true);
      setRegenMessage(null);
    }
  }

  async function handleRegenerate() {
    setRegenLoading(true);
    setRegenMessage(null);
    try {
      const res = await fetch('/api/couple/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ coupleId, force: true }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? '재생성에 실패했습니다.');
      }
      const next = (await res.json()) as CoupleAnalysis;
      console.log('[CoupleResultCard] 재생성 결과:', next);
      setAnalysis(next);
      setRegenMessage('커플 분석을 다시 생성했습니다.');
    } catch (e) {
      setRegenMessage(e instanceof Error ? e.message : '재생성에 실패했습니다.');
    } finally {
      setRegenLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 break-words">
      {adminUnlocked && (
        <div className="rounded-2xl p-4 soft-lift" style={{ backgroundColor: '#ffffff' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#ba1a1a' }}>
            Admin
          </p>
          <p className="mb-3 text-xs leading-relaxed" style={{ color: '#43474e' }}>
            두 사람의 애착 데이터를 기반으로 커플 분석을 다시 생성합니다.
          </p>
          <GoldButton onClick={handleRegenerate} disabled={regenLoading} className="w-full">
            {regenLoading ? '재생성 중...' : '커플 분석 다시 생성'}
          </GoldButton>
          {regenMessage && (
            <p
              className="mt-3 text-xs leading-relaxed"
              style={{
                color: regenMessage.includes('실패') ? '#ba1a1a' : '#0060ac',
              }}
            >
              {regenMessage}
            </p>
          )}
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-2">
        <button
          type="button"
          onClick={handleAdminTriggerClick}
          className="text-xs font-semibold uppercase tracking-wider mb-2 cursor-default"
          style={{ color: '#0060ac' }}
        >
          커플 분석 결과
        </button>
        <h1 className="text-3xl font-bold leading-tight break-keep" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
          {session1.nickname}님과 {session2.nickname}님의<br />연애 패턴
        </h1>
      </div>

      {/* Two profiles */}
      <div className="grid grid-cols-2 gap-3">
        {[session1, session2].map((s) => (
          <div
            key={s.id}
            className="rounded-2xl p-4 soft-lift text-center"
            style={{ backgroundColor: '#ffffff' }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full mx-auto mb-2"
              style={{ backgroundColor: s.gender === 'female' ? '#fce4ec' : '#e3f2fd' }}
            >
              <GenderIcon gender={s.gender} />
            </div>
            <p className="font-bold text-sm" style={{ color: '#002045' }}>{s.nickname}</p>
            <p
              className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block"
              style={{ backgroundColor: '#dbeafe', color: '#0060ac' }}
            >
              {s.result?.typeName ?? s.attachment_type}
            </p>
            <div className="text-xs mt-2" style={{ color: '#74777f' }}>
              <span>불안 {s.ecr_anxiety.toFixed(1)}</span>
              <span className="mx-1">·</span>
              <span>회피 {s.ecr_avoidance.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
          두 사람의 조합
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{analysis.summary}</p>
      </div>

      {/* Conflict Pattern */}
      <div className="rounded-2xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
          반복되는 갈등 패턴
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{analysis.conflictPattern ?? '—'}</p>
      </div>

      {/* Each Person's Core */}
      <div className="rounded-2xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#0060ac' }}>
          각자가 진짜 원하는 것
        </p>
        <div className="flex flex-col gap-4">
          {(Array.isArray(analysis.eachPersonsCore) ? analysis.eachPersonsCore : []).map((item) => {
            // item.name이 "23님" 또는 "23" 두 형태 모두 대응
            const baseName = item.name.replace(/님$/, '');
            const session = [session1, session2].find((s) => s.nickname === baseName);
            return (
              <div key={item.name} className="flex gap-3 items-start">
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: session?.gender === 'female' ? '#fce4ec' : '#e3f2fd' }}
                >
                  <GenderIcon gender={session?.gender ?? 'male'} />
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#002045' }}>{baseName}님</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{item.core}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Couple Strengths */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#15803d' }}>
          이 조합의 강점
        </p>
        <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{analysis.coupleStrengths ?? '—'}</p>
      </div>

      {/* Communication Tips */}
      <div className="rounded-2xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#0060ac' }}>
          이렇게 대화해봐요
        </p>
        <div className="flex flex-col gap-3">
          {analysis.communicationTips.map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#dbeafe', color: '#0060ac' }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Crisis Script */}
      <div className="rounded-2xl p-5" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#c2410c' }}>
          싸웠을 때 꺼내볼 말
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ fontFamily: 'Paperozi', color: '#431407' }}
        >
          "{analysis.crisisScript ?? '—'}"
        </p>
      </div>

      {/* Compatibility Note */}
      <div
        className="rounded-2xl p-5"
        style={{ backgroundColor: '#dbeafe', border: '1px solid #bfdbfe' }}
      >
        <p
          className="text-sm text-center leading-relaxed"
          style={{ fontFamily: 'Paperozi', color: '#002045' }}
        >
          {analysis.compatibilityNote}
        </p>
      </div>

      {/* Share */}
      <div className="flex flex-col items-center gap-3 pb-10">
        <button
          type="button"
          onClick={handleShare}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ backgroundColor: '#FEE500', color: '#191919' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#191919" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.69 1.7 5.06 4.26 6.41L6.3 20.1a.5.5 0 0 0 .7.63l4.08-2.72c.3.03.61.05.92.05 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
          </svg>
          {copied ? '링크 복사됨!' : '카카오톡으로 공유하기'}
        </button>
        <p className="text-xs text-center" style={{ color: '#74777f' }}>
          상대방에게 이 링크를 공유하면 함께 볼 수 있어요
        </p>
      </div>
    </div>
  );
}
