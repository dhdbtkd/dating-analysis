'use client';

import type { CoupleAnalysis, SessionRow } from '@/types';
import { getAttachmentEmoji } from '@/lib/questions';

interface CoupleResultCardProps {
  session1: SessionRow;
  session2: SessionRow;
  analysis: CoupleAnalysis;
}

export function CoupleResultCard({ session1, session2, analysis }: CoupleResultCardProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div
        className="rounded-2xl p-6 border text-center"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <div className="text-4xl mb-3">💑</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
        >
          커플 분석 결과
        </h1>
        <p className="text-sm" style={{ color: '#8a8a9a' }}>
          두 사람의 애착 패턴 조합
        </p>
      </div>

      {/* Two profiles */}
      <div className="grid grid-cols-2 gap-3">
        {[session1, session2].map((s) => (
          <div
            key={s.id}
            className="rounded-xl p-4 border text-center"
            style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
          >
            <div className="text-3xl mb-2">{getAttachmentEmoji(s.ecr_anxiety, s.ecr_avoidance)}</div>
            <p className="font-bold text-sm" style={{ color: '#e0c898' }}>{s.nickname}</p>
            <p className="text-xs mt-1" style={{ color: '#8a8a9a' }}>{s.attachment_type}</p>
            <div className="text-xs mt-2" style={{ color: '#8a8a9a' }}>
              <span>불안 {s.ecr_anxiety.toFixed(1)}</span>
              <span className="mx-1">·</span>
              <span>회피 {s.ecr_avoidance.toFixed(1)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#e0c898' }}>두 사람의 조합</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{analysis.summary}</p>
      </div>

      {/* Dynamics */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#e0c898' }}>관계 역학</h2>
        <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{analysis.dynamics}</p>
      </div>

      {/* Communication Tips */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e0c898' }}>이렇게 대화해봐요</h2>
        <div className="flex flex-col gap-3">
          {analysis.communicationTips.map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                style={{ backgroundColor: '#c8a96e', color: '#0a0a0f' }}
              >
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Growth Suggestions */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: '#111118', borderColor: '#1e1e2e' }}
      >
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#e0c898' }}>더 나은 관계를 위해</h2>
        <div className="flex flex-col gap-3">
          {analysis.growthSuggestions.map((tip, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className="text-lg flex-shrink-0">{['✨', '🌱', '💬'][i] ?? '•'}</span>
              <p className="text-sm leading-relaxed" style={{ color: '#e8e8f0' }}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Compatibility Note */}
      <div
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: 'rgba(200,169,110,0.06)', borderColor: 'rgba(200,169,110,0.2)' }}
      >
        <p
          className="text-sm text-center leading-relaxed italic"
          style={{ fontFamily: 'Paperozi', color: '#e0c898' }}
        >
          {analysis.compatibilityNote}
        </p>
      </div>
    </div>
  );
}
