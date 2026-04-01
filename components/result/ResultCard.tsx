'use client';

import { useState } from 'react';
import { ScatterChart } from './ScatterChart';
import { QuoteBlock } from './QuoteBlock';
import { ActionItems } from './ActionItems';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ResultJson } from '@/types';
import { getAttachmentAcademic, getAttachmentEmoji } from '@/lib/questions';

interface ResultCardProps {
  result: ResultJson;
  sessionId: string;
  nickname: string;
}

interface ConsentModalProps {
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}

function ConsentModal({ onAccept, onReject, loading }: ConsentModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10,10,15,0.8)' }} />
      <div
        className="relative rounded-2xl p-6 border max-w-sm w-full"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <h3
          className="text-lg font-bold mb-3"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
        >
          개인정보 저장 동의
        </h3>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: '#8a8a9a' }}>
          커플 분석을 위해 검사 결과(닉네임, 애착 유형, 대화 내용)가 서버에 저장됩니다.
          초대 링크를 통해 파트너와 함께 분석 결과를 확인하게 됩니다.
          동의하시겠습니까?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm border transition-all min-h-[44px]"
            style={{ borderColor: '#1e1e2e', color: '#8a8a9a' }}
          >
            거절
          </button>
          <GoldButton onClick={onAccept} disabled={loading} className="flex-1">
            {loading ? '처리 중...' : '동의'}
          </GoldButton>
        </div>
      </div>
    </div>
  );
}

export function ResultCard({ result, sessionId }: ResultCardProps) {
  const [showConsent, setShowConsent] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const emoji = getAttachmentEmoji(result.anxietyScore, result.avoidanceScore);
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
      const data = await res.json() as { inviteUrl: string };
      setInviteUrl(data.inviteUrl);
      setShowConsent(false);
    } catch {
      alert('초대 링크 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setConsentLoading(false);
    }
  }

  async function handleReject() {
    const confirmed = window.confirm('검사 데이터가 삭제됩니다. 계속하시겠습니까?');
    if (!confirmed) return;
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } finally {
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
      {showConsent && (
        <ConsentModal
          onAccept={handleConsent}
          onReject={handleReject}
          loading={consentLoading}
        />
      )}

      <div className="flex flex-col gap-6 break-words">
        {/* Header */}
        <div
          className="rounded-2xl p-6 border text-center"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <div className="text-5xl mb-3">{emoji}</div>
          <p className="text-xs mb-1" style={{ color: '#8a8a9a' }}>{academic}</p>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
          >
            {result.typeName}
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: '#c8a96e' }}>
            {result.tagline}
          </p>
          <div className="flex gap-4 justify-center mt-4 text-xs" style={{ color: '#8a8a9a' }}>
            <span>불안 {result.anxietyScore.toFixed(1)}</span>
            <span>|</span>
            <span>회피 {result.avoidanceScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Scatter Chart */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e0c898' }}>2축 애착 지도</h2>
          <ScatterChart anxietyScore={result.anxietyScore} avoidanceScore={result.avoidanceScore} />
        </div>

        {/* Love Pattern */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#e0c898' }}>연애 패턴</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{result.lovePattern}</p>
        </div>

        {/* Core Wound */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#e0c898' }}>핵심 상처</h2>
          <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{result.coreWound}</p>
        </div>

        {/* Quote */}
        <QuoteBlock quote={result.quote} />

        {/* Action Tips */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#e0c898' }}>행동 제안</h2>
          <ActionItems items={result.actionTip} />
        </div>

        {/* Mindset */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: 'rgba(200,169,110,0.06)', borderColor: 'rgba(200,169,110,0.2)' }}
        >
          <p
            className="text-sm text-center leading-relaxed italic"
            style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
          >
            {result.mindset}
          </p>
        </div>

        {/* Famous Match */}
        <div
          className="rounded-2xl p-5 border"
          style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: '#e0c898' }}>닮은 유명인/캐릭터</h2>
          <p className="text-sm" style={{ color: '#e8e8f0' }}>{result.famousMatch}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 pb-8">
          {inviteUrl ? (
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
            >
              <p className="text-xs mb-2" style={{ color: '#8a8a9a' }}>초대 링크가 생성되었습니다</p>
              <p className="text-xs mb-3 break-all" style={{ color: '#c8a96e' }}>{inviteUrl}</p>
              <GoldButton onClick={handleCopy} className="w-full">
                {copied ? '복사됨!' : '링크 복사하기'}
              </GoldButton>
            </div>
          ) : (
            <GoldButton onClick={() => setShowConsent(true)} className="w-full">
              연인에게 보내기 💑
            </GoldButton>
          )}
          <button
            onClick={handleShare}
            className="w-full py-3 rounded-xl text-sm border transition-all"
            style={{ borderColor: '#1e1e2e', color: '#8a8a9a' }}
          >
            결과 공유하기
          </button>
        </div>
      </div>
    </>
  );
}
