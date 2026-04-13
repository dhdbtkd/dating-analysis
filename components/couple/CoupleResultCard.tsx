'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { CoupleAnalysis, SessionRow } from '@/types';
import { getCoupleType, calcAxisGaps } from '@/lib/coupleType';

const CoupleRadarChart = dynamic(() => import('./CoupleRadarChart').then((m) => m.CoupleRadarChart), { ssr: false });

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
            <polyline
                points="16,4 20,4 20,8"
                stroke="#1565c0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
import { GoldButton } from '@/components/ui/GoldButton';

interface CoupleResultCardProps {
    coupleId: string;
    session1: SessionRow;
    session2: SessionRow;
    analysis: CoupleAnalysis;
    isShared?: boolean;
}

export function CoupleResultCard({
    coupleId,
    session1,
    session2,
    analysis: initialAnalysis,
    isShared,
}: CoupleResultCardProps) {
    const [analysis, setAnalysis] = useState(initialAnalysis);
    const [letterTab, setLetterTab] = useState<0 | 1>(0);
    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
    const [regenLoading, setRegenLoading] = useState(false);
    const [regenMessage, setRegenMessage] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleShare = useCallback(() => {
        const url = window.location.href;
        const base = window.location.origin;
        const title = `${session1.nickname}님 × ${session2.nickname}님의 커플 연애 패턴`;
        const desc = analysis.summary;

        if (window.Kakao?.isInitialized()) {
            const sharedUrl = url.includes('?') ? `${url}&shared=1` : `${url}?shared=1`;
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title,
                    description: desc,
                    imageUrl: `${base}/couple_ogimage.png`,
                    link: { mobileWebUrl: sharedUrl, webUrl: sharedUrl },
                },
                buttons: [
                    {
                        title: '커플 결과 보기',
                        link: { mobileWebUrl: sharedUrl, webUrl: sharedUrl },
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
                <h1
                    className="text-3xl font-bold leading-tight break-keep"
                    style={{ fontFamily: 'Paperozi', color: '#002045' }}
                >
                    {session1.nickname}님과 {session2.nickname}님의
                    <br />
                    연애 패턴
                </h1>
            </div>

            {/* Couple type — rule-based */}
            {(() => {
                const ct = getCoupleType(
                    session1.ecr_anxiety,
                    session1.ecr_avoidance,
                    session2.ecr_anxiety,
                    session2.ecr_avoidance,
                );
                return (
                    <div className="rounded-2xl p-5" style={{ backgroundColor: '#002045' }}>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#64a8fe' }}>
                            두 사람의 조합 유형
                        </p>
                        <p className="text-xl font-bold mb-2" style={{ fontFamily: 'Paperozi', color: '#ffffff' }}>
                            {ct.name}
                        </p>
                        <p className="text-xs leading-relaxed mb-3" style={{ color: '#b0c4de' }}>
                            {ct.description}
                        </p>
                        <span
                            className="inline-block rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ backgroundColor: '#1a365d', color: '#64a8fe' }}
                        >
                            {ct.dynamic}
                        </span>
                    </div>
                );
            })()}

            {/* ── 섹션 1: 두 사람의 프로필 ── */}
            <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                두 사람의 프로필
            </p>

            <div className="rounded-2xl soft-lift overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                {/* Profile cards */}
                <div className="grid grid-cols-2 gap-px" style={{ backgroundColor: '#f2f4f6' }}>
                    {[session1, session2].map((s) => {
                        const toP = (v: number) => Math.round(((v - 1) / 6) * 100);
                        const scores = [
                            { label: '안정감', value: toP(8 - s.ecr_anxiety) },
                            { label: '친밀감', value: toP(8 - s.ecr_avoidance) },
                            { label: '신뢰', value: s.score_trust != null ? toP(s.score_trust) : null },
                            {
                                label: '속마음',
                                value: s.score_self_disclosure != null ? toP(s.score_self_disclosure) : null,
                            },
                            { label: '갈등', value: s.score_conflict != null ? toP(s.score_conflict) : null },
                            {
                                label: '자존감',
                                value: s.score_rel_self_esteem != null ? toP(s.score_rel_self_esteem) : null,
                            },
                        ];
                        return (
                            <div key={s.id} className="p-4 text-center" style={{ backgroundColor: '#ffffff' }}>
                                <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full mx-auto mb-2"
                                    style={{ backgroundColor: s.gender === 'female' ? '#fce4ec' : '#e3f2fd' }}
                                >
                                    <GenderIcon gender={s.gender} />
                                </div>
                                <p className="font-bold text-sm" style={{ color: '#002045' }}>
                                    {s.nickname}
                                </p>
                                <p
                                    className="text-xs font-semibold mt-1 px-2 py-0.5 rounded-full inline-block"
                                    style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
                                >
                                    {s.result?.typeName ?? s.attachment_type}
                                </p>
                                <div className="mt-3 grid grid-cols-3 gap-1">
                                    {scores.map(
                                        ({ label, value }) =>
                                            value != null && (
                                                <div
                                                    key={label}
                                                    className="rounded-lg px-1 py-1.5"
                                                    style={{ backgroundColor: '#f7f9fb' }}
                                                >
                                                    <p
                                                        className="text-[9px] font-semibold"
                                                        style={{ color: '#74777f' }}
                                                    >
                                                        {label}
                                                    </p>
                                                    <p className="text-xs font-bold" style={{ color: '#0060ac' }}>
                                                        {value}
                                                    </p>
                                                </div>
                                            ),
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Radar + Gap table */}
                <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: '#43474e' }}>
                        지표 비교
                    </p>
                    <p className="text-xs mb-3" style={{ color: '#9ca3af' }}>
                        두 사람의 6가지 지표를 겹쳐 비교해요
                    </p>
                    <CoupleRadarChart session1={session1} session2={session2} />

                    <div style={{ borderTop: '1px solid #f2f4f6', marginTop: '16px', paddingTop: '16px' }}>
                        <div
                            className="grid gap-2 text-xs font-semibold mb-2"
                            style={{ gridTemplateColumns: '1fr 2fr 1fr', color: '#9ca3af' }}
                        >
                            <span>{session1.nickname}</span>
                            <span className="text-center">지표</span>
                            <span className="text-right">{session2.nickname}</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            {calcAxisGaps(session1, session2).map(({ label, score1, score2, gap }) => (
                                <div
                                    key={label}
                                    className="grid gap-2 items-center"
                                    style={{ gridTemplateColumns: '1fr 2fr 1fr' }}
                                >
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: gap >= 20 ? '#c2410c' : '#191c1e' }}
                                    >
                                        {score1}
                                    </span>
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className="text-xs" style={{ color: '#43474e' }}>
                                            {label}
                                        </span>
                                        {gap >= 20 && (
                                            <span
                                                className="text-[9px] font-semibold rounded-full px-1.5 py-0.5"
                                                style={{ backgroundColor: '#f7f9fb', color: '#c2410c' }}
                                            >
                                                차이 {gap}
                                            </span>
                                        )}
                                    </div>
                                    <span
                                        className="text-xs font-bold text-right"
                                        style={{ color: gap >= 20 ? '#c2410c' : '#191c1e' }}
                                    >
                                        {score2}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {analysis.axisGaps && analysis.axisGaps.length > 0 && (
                        <div className="flex flex-col gap-3 mt-4 pt-4" style={{ borderTop: '1px solid #f2f4f6' }}>
                            {analysis.axisGaps.map((item) => (
                                <div key={item.axis} className="flex gap-3 items-start">
                                    <span
                                        className="text-xs font-semibold flex-shrink-0"
                                        style={{
                                            width: '7rem',
                                            minWidth: '7rem',
                                            color: '#43474e',
                                            backgroundColor: '#f2f4f6',
                                            borderRadius: '999px',
                                            padding: '2px 8px',
                                            textAlign: 'center',
                                            lineHeight: '1.6',
                                        }}
                                    >
                                        {item.axis}
                                    </span>
                                    <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                        {item.gap}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── 섹션 2: 우리의 패턴 ── */}
            <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                우리의 패턴
            </p>

            <div className="rounded-2xl soft-lift" style={{ backgroundColor: '#ffffff' }}>
                {/* Summary */}
                <div className="p-5">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                        두 사람의 조합
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                        {analysis.summary}
                    </p>
                </div>

                {/* Conflict + Core Fears */}
                <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                        반복되는 갈등 패턴
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                        {analysis.conflictPattern ?? '—'}
                    </p>
                    {analysis.coreFearsCollision && (
                        <div className="mt-3 rounded-xl p-3" style={{ backgroundColor: '#f7f9fb' }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: '#74777f' }}>
                                서로의 불안이 맞닿는 지점
                            </p>
                            <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                {analysis.coreFearsCollision}
                            </p>
                        </div>
                    )}
                </div>

                {/* Each person's core */}
                <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#43474e' }}>
                        각자가 진짜 원하는 것
                    </p>
                    <div className="flex flex-col gap-4">
                        {(Array.isArray(analysis.eachPersonsCore) ? analysis.eachPersonsCore : []).map((item) => {
                            const baseName = item.name.replace(/님$/, '');
                            const session = [session1, session2].find((s) => s.nickname === baseName);
                            return (
                                <div key={item.name} className="flex gap-3 items-start">
                                    <div
                                        className="flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                                        style={{
                                            backgroundColor: session?.gender === 'female' ? '#fce4ec' : '#e3f2fd',
                                        }}
                                    >
                                        <GenderIcon gender={session?.gender ?? 'male'} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold mb-1" style={{ color: '#002045' }}>
                                            {baseName}님
                                        </p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {item.core}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── 섹션 3: 강점과 제안 ── */}
            <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                강점과 제안
            </p>

            <div className="rounded-2xl soft-lift" style={{ backgroundColor: '#ffffff' }}>
                {/* Strengths */}
                <div className="p-5">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                        두 사람이 함께라서 좋은 점
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                        {analysis.coupleStrengths ?? '—'}
                    </p>
                </div>

                {/* Communication Tips */}
                <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: '#43474e' }}>
                        이렇게 대화해봐요
                    </p>
                    <div className="flex flex-col gap-3">
                        {analysis.communicationTips.map((tip, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <span
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                                    style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
                                >
                                    {i + 1}
                                </span>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {tip}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Growth Edge */}
                {analysis.growthEdge && (
                    <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                        <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                            지금 당장 해볼 수 있는 것
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                            {analysis.growthEdge}
                        </p>
                    </div>
                )}
            </div>

            {/* ── 섹션 4: 주의할 점 ── */}
            {analysis.redFlags && analysis.redFlags.length > 0 && (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                        주의할 점
                    </p>
                    <div className="rounded-2xl soft-lift" style={{ backgroundColor: '#ffffff' }}>
                        <div className="p-5">
                            <p className="text-xs font-semibold mb-3" style={{ color: '#43474e' }}>
                                이런 신호가 보이면 주의하세요
                            </p>
                            <div className="flex flex-col gap-3">
                                {analysis.redFlags.map((flag, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 items-start rounded-xl p-3"
                                        style={{ backgroundColor: '#f7f9fb', borderLeft: '3px solid #fca5a5' }}
                                    >
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {flag}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── 섹션 5: 이런 장면, 낯설지 않나요? ── */}
            {analysis.relationshipScenario && (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                        이런 장면, 낯설지 않나요?
                    </p>
                    <div className="rounded-2xl soft-lift p-5" style={{ backgroundColor: '#ffffff' }}>
                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e', lineHeight: '1.9' }}>
                            {analysis.relationshipScenario}
                        </p>
                    </div>
                </>
            )}

            {/* ── 섹션 6: 잘 되는 조건 / 틀어지는 조건 ── */}
            {analysis.relationshipConditions && (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                        이 관계의 조건
                    </p>
                    <div className="rounded-2xl soft-lift overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                        <div className="p-5">
                            <p className="text-xs font-semibold mb-3" style={{ color: '#43474e' }}>
                                이럴 때 잘 돼요
                            </p>
                            <div className="flex flex-col gap-2">
                                {analysis.relationshipConditions.good.map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }}>
                                            ✓
                                        </span>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                            <p className="text-xs font-semibold mb-3" style={{ color: '#43474e' }}>
                                이럴 때 틀어져요
                            </p>
                            <div className="flex flex-col gap-2">
                                {analysis.relationshipConditions.bad.map((item, i) => (
                                    <div key={i} className="flex gap-2 items-start">
                                        <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: '#f97316' }}>
                                            !
                                        </span>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* ── 섹션 7: 연락 / 데이트 / 갈등 패턴 ── */}
            {analysis.practicalPatterns && (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                        실전 패턴
                    </p>
                    <div className="rounded-2xl soft-lift overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                        {[
                            { label: '연락할 때', value: analysis.practicalPatterns.contact },
                            { label: '데이트할 때', value: analysis.practicalPatterns.date },
                            { label: '갈등이 생겼을 때', value: analysis.practicalPatterns.conflict },
                        ].map(({ label, value }, i, arr) => (
                            <div
                                key={label}
                                className="p-5"
                                style={i < arr.length - 1 ? { borderBottom: '1px solid #f2f4f6' } : {}}
                            >
                                <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                                    {label}
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── 섹션 8: 편지 ── */}
            {(analysis.letterToA || analysis.letterToB) && (
                <>
                    <p className="text-xs font-semibold uppercase tracking-wider px-1" style={{ color: '#9ca3af' }}>
                        서로에게 전하는 말
                    </p>
                    <div className="rounded-2xl soft-lift overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                        {/* 탭 */}
                        <div className="grid grid-cols-2" style={{ borderBottom: '1px solid #f2f4f6' }}>
                            {[session1, session2].map((s, i) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setLetterTab(i as 0 | 1)}
                                    className="py-3 text-xs font-semibold transition-colors"
                                    style={{
                                        color: letterTab === i ? '#002045' : '#9ca3af',
                                        borderBottom: letterTab === i ? '2px solid #002045' : '2px solid transparent',
                                        backgroundColor: 'transparent',
                                    }}
                                >
                                    {s.nickname}님에게
                                </button>
                            ))}
                        </div>
                        {/* 편지 내용 */}
                        <div className="p-5">
                            <p className="text-[10px] font-semibold mb-3" style={{ color: '#9ca3af' }}>
                                {letterTab === 0 ? session2.nickname : session1.nickname}님의 속마음일거예요
                            </p>
                            <p
                                className="text-xs leading-relaxed whitespace-pre-line"
                                style={{ color: '#191c1e', lineHeight: '2', fontFamily: 'Paperozi' }}
                            >
                                {letterTab === 0 ? analysis.letterToA : analysis.letterToB}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* ── 마무리 ── */}
            <div className="rounded-2xl soft-lift" style={{ backgroundColor: '#ffffff' }}>
                <div className="p-5">
                    <p className="text-xs font-semibold mb-2" style={{ color: '#43474e' }}>
                        싸웠을 때 꺼내볼 말
                    </p>
                    <p className="text-xs leading-relaxed" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                        "{analysis.crisisScript ?? '—'}"
                    </p>
                </div>
                <div className="p-5" style={{ borderTop: '1px solid #f2f4f6' }}>
                    <p
                        className="text-xs text-center leading-relaxed"
                        style={{ fontFamily: 'Paperozi', color: '#002045' }}
                    >
                        {analysis.compatibilityNote}
                    </p>
                </div>
            </div>

            {/* Share */}
            <div className="flex flex-col items-center gap-3 pb-10">
                {isShared ? (
                    <a
                        href="/"
                        className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center"
                        style={{ backgroundColor: '#002045', color: '#ffffff' }}
                    >
                        나도 해보기
                    </a>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={handleShare}
                            className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#FEE500', color: '#191919' }}
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="#191919"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.69 1.7 5.06 4.26 6.41L6.3 20.1a.5.5 0 0 0 .7.63l4.08-2.72c.3.03.61.05.92.05 4.97 0 9-3.36 9-7.5S16.97 3 12 3z" />
                            </svg>
                            {copied ? '링크 복사됨!' : '카카오톡으로 공유하기'}
                        </button>
                        <p className="text-xs text-center" style={{ color: '#74777f' }}>
                            상대방에게 이 링크를 공유하면 함께 볼 수 있어요
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
