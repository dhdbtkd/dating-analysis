'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
const ScatterChart = dynamic(() => import('./ScatterChart').then(m => m.ScatterChart), { ssr: false });
import { GoldButton } from '@/components/ui/GoldButton';
import type { ResultJson } from '@/types';
import { getAttachmentAcademic } from '@/lib/questions';

function splitIntoParagraphs(text: string): string[] {
  if (text.length <= 80) return [text];
  const mid = Math.floor(text.length / 2);
  // mid 기준으로 앞뒤에서 가장 가까운 마침표(。.!) 찾기
  const before = text.lastIndexOf('.', mid);
  const after = text.indexOf('.', mid);
  let cut = -1;
  if (before === -1 && after === -1) return [text];
  else if (before === -1) cut = after;
  else if (after === -1) cut = before;
  else cut = (mid - before) <= (after - mid) ? before : after;
  return [text.slice(0, cut + 1).trim(), text.slice(cut + 1).trim()].filter(Boolean);
}

interface ResultCardProps {
  result: ResultJson;
  sessionId: string;
  nickname: string;
}

interface ConsentModalProps {
  onAccept: () => void;
  onClose: () => void;
  onDelete: () => void;
  loading: boolean;
}

function ConsentModal({ onAccept, onClose, onDelete, loading }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-6">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(247,249,251,0.9)', backdropFilter: 'blur(8px)' }} />
      <div className="relative rounded-3xl p-6 max-w-sm w-full soft-lift" style={{ backgroundColor: '#ffffff' }}>
        <h3 className="text-base font-bold mb-3" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
          개인정보 저장 동의
        </h3>
        <p className="text-sm mb-5 leading-relaxed" style={{ color: '#43474e' }}>
          커플 분석을 위해 검사 결과(닉네임, 애착 유형, 대화 내용)가 서버에 저장됩니다.
          초대 링크를 통해 파트너와 함께 분석 결과를 확인하게 됩니다.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl text-sm transition-all"
            style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
          >
            닫기
          </button>
          <GoldButton onClick={onAccept} disabled={loading} className="flex-1">
            {loading ? '처리 중...' : '동의'}
          </GoldButton>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={loading}
          className="w-full mt-3 py-3 rounded-2xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#ffdad5', color: '#ba1a1a' }}
        >
          결과 삭제
        </button>
      </div>
    </div>
  );
}

export function ResultCard({ result, sessionId, nickname }: ResultCardProps) {
  const router = useRouter();
  const [showConsent, setShowConsent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteCompleted, setDeleteCompleted] = useState(false);

  const academic = getAttachmentAcademic(result.anxietyScore, result.avoidanceScore);

  async function handleConsent() {
    setConsentLoading(true);
    try {
      const res = await fetch('/api/invite/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('초대 링크 생성 실패');
      const data = (await res.json()) as { inviteUrl: string };
      setInviteUrl(data.inviteUrl);
      setShowConsent(false);
    } catch {
      alert('초대 링크 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setConsentLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('결과를 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?');
    if (!confirmed) return;
    try {
      setConsentLoading(true);
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      setDeleteCompleted(true);
      window.setTimeout(() => router.replace('/'), 1600);
    } finally {
      setConsentLoading(false);
      setShowConsent(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(inviteUrl);
    }
  }

  async function handleShare() {
    const text = `[${result.typeName}] — 나의 연애 패턴 테스트 결과`;
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: text, url });
    } else {
      await navigator.clipboard.writeText(`${text} | ${url}`);
      alert('링크가 복사되었습니다!');
    }
  }

  return (
    <>
      {deleteCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(247,249,251,0.94)', backdropFilter: 'blur(10px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-7 text-center soft-lift" style={{ backgroundColor: '#ffffff' }}>
            <p className="text-4xl mb-4">삭제됨</p>
            <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
              결과가 안전하게 삭제됐어요
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#43474e' }}>
              저장된 검사 데이터와 초대 흐름을 정리했고, 잠시 후 처음 화면으로 이동합니다.
            </p>
          </div>
        </div>
      )}
      {showConsent && <ConsentModal onAccept={handleConsent} onClose={() => setShowConsent(false)} onDelete={handleDelete} loading={consentLoading} />}

      <div className="flex flex-col gap-8 break-words">

        {/* 1블록: 첫 인상 */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-6" style={{ color: '#74777f' }}>
            {nickname}님의 결과지
          </p>
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#0060ac' }}>
            {academic}
          </p>
          <h1
            className="text-3xl font-bold mb-4 leading-tight"
            style={{ fontFamily: 'Paperozi', color: '#002045' }}
          >
            {result.typeName}
          </h1>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#43474e' }}>
            {result.tagline}
          </p>
          <button
            type="button"
            onClick={handleShare}
            className="text-sm px-5 py-2.5 rounded-2xl transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
          >
            결과 공유하기
          </button>
        </div>

        {/* 2블록: 좌표 맵 */}
        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#0060ac' }}>
            2축 애착 지도
          </p>
          <ScatterChart anxietyScore={result.anxietyScore} avoidanceScore={result.avoidanceScore} />

          <div className="mt-5 flex flex-col gap-4">
            {(
              [
                { label: '감정 반응 강도', score: result.anxietyScore, intensity: result.emotionalIntensity },
                { label: '거리 유지 성향', score: result.avoidanceScore, intensity: result.distanceTendency },
              ] as const
            ).map(({ label, score, intensity }) => {
              const pct = ((score - 1) / 6) * 100;
              const color = intensity === '낮음' ? '#0060ac' : intensity === '중간' ? '#f97316' : '#ba1a1a';
              return (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold mb-2">
                    <span style={{ color: '#43474e' }}>{label}</span>
                    <span style={{ color }}>{score.toFixed(1)} · {intensity}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: '#eceef0' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3블록: 연애 패턴 */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
            연애에서의 당신
          </p>
          {splitIntoParagraphs(result.lovePattern).map((para, i) => (
            <p key={para} className={`text-sm leading-relaxed ${i > 0 ? 'mt-4' : ''}`} style={{ color: '#191c1e' }}>{para}</p>
          ))}
        </div>

        {/* 4블록: 핵심 상처 */}
        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#0060ac' }}>
            마음이 예민해지는 지점
          </p>
          <p className="text-sm leading-relaxed" style={{ color: '#191c1e' }}>{result.coreWound}</p>
        </div>

        {/* 5블록: 마인드셋 전환 — 감정 강조 카드 */}
        <div
          className="rounded-3xl p-7"
          style={{ backgroundColor: '#ffdad5' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#c8724a' }}>
            이 관계를 다르게 보는 연습
          </p>
          <p
            className="text-base leading-relaxed font-medium"
            style={{ fontFamily: 'Paperozi', color: '#002045' }}
          >
            {result.mindset}
          </p>
        </div>

        {/* 6블록: 행동 팁 */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-5" style={{ color: '#0060ac' }}>
            지금 바로 해볼 것
          </p>
          <div className="flex flex-col gap-4">
            {result.actionTip.map((tip, i) => (
              <div key={tip} className="flex gap-4 items-start">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#dbeafe', color: '#002045' }}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed pt-0.5" style={{ color: '#191c1e' }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 커플 분석 CTA */}
        <div className="flex flex-col gap-3 pb-12">
          {inviteUrl ? (
            <div className="rounded-3xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>초대 링크가 생성되었습니다</p>
              <p className="text-xs mb-4 break-all" style={{ color: '#0060ac' }}>{inviteUrl}</p>
              <GoldButton onClick={handleCopy} className="w-full">
                {copied ? '복사됨!' : '링크 복사하기'}
              </GoldButton>
            </div>
          ) : (
            <>
              <GoldButton onClick={() => setShowConsent(true)} className="w-full">
                연인에게 보내기 💑
              </GoldButton>
              <p className="text-xs text-center mt-3 leading-relaxed" style={{ color: '#74777f' }}>
                연인도 검사를 완료하면, 두 사람의 애착 패턴이 어떻게 맞물리는지 함께 더 잘 연애하는 방법을 분석해 드립니다.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
