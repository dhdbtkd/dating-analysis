'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ResultCoreJson, ResultDetailJson, ResultDetailStatus, SessionRow } from '@/types';

const ScatterChart = dynamic(() => import('./ScatterChart').then((module) => module.ScatterChart), { ssr: false });

function splitIntoParagraphs(text: string): string[] {
    if (text.length <= 80) return [text];
    const mid = Math.floor(text.length / 2);
    const before = text.lastIndexOf('.', mid);
    const after = text.indexOf('.', mid);
    let cut = -1;
    if (before === -1 && after === -1) return [text];
    if (before === -1) cut = after;
    else if (after === -1) cut = before;
    else cut = mid - before <= after - mid ? before : after;
    return [text.slice(0, cut + 1).trim(), text.slice(cut + 1).trim()].filter(Boolean);
}

interface ResultCardProps {
    result: ResultCoreJson;
    detailResult: ResultDetailJson | null;
    detailStatus: ResultDetailStatus;
    detailError: string | null;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(247,249,251,0.9)', backdropFilter: 'blur(8px)' }}
            />
            <div className="relative w-full max-w-sm rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                <h3 className="mb-3 text-base font-bold" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                    개인정보 저장 동의
                </h3>
                <p className="mb-5 text-sm leading-relaxed" style={{ color: '#43474e' }}>
                    커플 분석을 위해 검사 결과(닉네임, 애착 유형, 대화 내용)가 서버에 저장됩니다. 초대 링크를 통해
                    파트너와 함께 분석 결과를 확인하게 됩니다.
                </p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 rounded-2xl py-3 text-sm transition-all"
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
                    className="mt-3 w-full rounded-2xl py-3 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: '#ffdad5', color: '#ba1a1a' }}
                >
                    결과 삭제
                </button>
            </div>
        </div>
    );
}

function DetailLoadingBlock({ message }: { message: string }) {
    return (
        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                더 깊은 분석을 정리하는 중
            </p>
            <p className="text-xs leading-relaxed" style={{ color: '#43474e' }}>
                {message}
            </p>
            <div className="mt-5 space-y-3">
                <div className="h-3 w-4/5 animate-pulse rounded-full" style={{ backgroundColor: '#eceef0' }} />
                <div className="h-3 w-full animate-pulse rounded-full" style={{ backgroundColor: '#eceef0' }} />
                <div className="h-3 w-3/4 animate-pulse rounded-full" style={{ backgroundColor: '#eceef0' }} />
            </div>
        </div>
    );
}

export function ResultCard({
    result,
    detailResult,
    detailStatus,
    detailError,
    sessionId,
    nickname,
}: ResultCardProps) {
    const router = useRouter();
    const [currentResult, setCurrentResult] = useState(result);
    const [currentDetail, setCurrentDetail] = useState<ResultDetailJson | null>(detailResult);
    const [currentDetailStatus, setCurrentDetailStatus] = useState<ResultDetailStatus>(detailStatus);
    const [currentDetailError, setCurrentDetailError] = useState<string | null>(detailError);
    const [showConsent, setShowConsent] = useState(false);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [consentLoading, setConsentLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [deleteCompleted, setDeleteCompleted] = useState(false);
    const [adminUnlocked, setAdminUnlocked] = useState(false);
    const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
    const [regenLoading, setRegenLoading] = useState(false);
    const [regenMessage, setRegenMessage] = useState<string | null>(null);

    useEffect(() => {
        setCurrentResult(result);
    }, [result]);

    useEffect(() => {
        setCurrentDetail(detailResult);
        setCurrentDetailStatus(detailStatus);
        setCurrentDetailError(detailError);
    }, [detailError, detailResult, detailStatus]);

    useEffect(() => {
        if (currentDetail || currentDetailStatus === 'completed' || currentDetailStatus === 'failed') {
            return;
        }

        let cancelled = false;
        let retryTimer: number | undefined;

        async function requestDetail() {
            try {
                const response = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ sessionId, mode: 'detail' }),
                });

                if (cancelled) return;

                if (response.status === 202) {
                    setCurrentDetailStatus('pending');
                    retryTimer = window.setTimeout(() => {
                        void requestDetail();
                    }, 1800);
                    return;
                }

                const payload = (await response.json()) as ResultDetailJson | { error?: string; detail?: string };

                if (!response.ok) {
                    const errorPayload = payload as { error?: string; detail?: string };
                    throw new Error(errorPayload.detail ?? errorPayload.error ?? '상세 분석을 불러오지 못했습니다.');
                }

                const detailPayload: ResultDetailJson = payload as ResultDetailJson;
                setCurrentDetail(detailPayload);
                setCurrentDetailStatus('completed');
                setCurrentDetailError(null);
            } catch (error) {
                if (cancelled) return;
                setCurrentDetailStatus('failed');
                setCurrentDetailError(error instanceof Error ? error.message : '상세 분석을 불러오지 못했습니다.');
            }
        }

        if (currentDetailStatus === 'idle' || currentDetailStatus === 'pending') {
            void requestDetail();
        }

        return () => {
            cancelled = true;
            if (retryTimer) window.clearTimeout(retryTimer);
        };
    }, [currentDetail, currentDetailStatus, sessionId]);

    async function handleConsent() {
        setConsentLoading(true);
        try {
            const response = await fetch('/api/invite/create', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId }),
            });
            if (!response.ok) throw new Error('초대 링크 생성 실패');
            const data = (await response.json()) as { inviteUrl: string };
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
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            alert(inviteUrl);
        }
    }

    async function handleShare() {
        const text = `[${currentResult.typeName}] — 나의 연애 패턴 테스트 결과`;
        const url = window.location.href;

        if (navigator.share) {
            await navigator.share({ title: text, url });
            return;
        }

        await navigator.clipboard.writeText(`${text} | ${url}`);
        alert('링크가 복사되었습니다!');
    }

    function handleAdminTriggerClick() {
        const now = Date.now();
        const recentClicks = [...clickTimestamps, now].filter((timestamp) => now - timestamp <= 10000);
        setClickTimestamps(recentClicks);
        if (recentClicks.length >= 5) {
            setAdminUnlocked(true);
            setRegenMessage(null);
        }
    }

    async function fetchSessionForRegenerate() {
        const response = await fetch(`/api/sessions?id=${sessionId}`);
        const payload = (await response.json()) as SessionRow | { error?: string };

        if (!response.ok || !('warmup_answers' in payload) || !('quiz_details' in payload)) {
            throw new Error('세션 정보를 불러오지 못했습니다.');
        }

        return payload;
    }

    async function handleRegenerate() {
        setRegenLoading(true);
        setRegenMessage(null);

        try {
            const sessionData = await fetchSessionForRegenerate();

            if (!sessionData.warmup_answers.length || !sessionData.quiz_details.length) {
                setRegenMessage('이 세션은 선택지 저장 이전 데이터라 정확 재생성이 불가능합니다.');
                return;
            }

            const coreResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    mode: 'core',
                    chatHistory: sessionData.chat_history,
                    ecrScores: {
                        anxiety: sessionData.ecr_anxiety,
                        avoidance: sessionData.ecr_avoidance,
                        typeName: sessionData.attachment_type,
                    },
                    userInfo: {
                        nickname: sessionData.nickname,
                        age: sessionData.age,
                        gender: sessionData.gender,
                    },
                    warmupAnswers: sessionData.warmup_answers,
                    quizDetails: sessionData.quiz_details,
                    resetDetail: true,
                }),
            });

            const corePayload = (await coreResponse.json()) as ResultCoreJson | { error?: string; detail?: string };
            if (!coreResponse.ok) {
                const errorPayload = corePayload as { error?: string; detail?: string };
                throw new Error(errorPayload.detail ?? errorPayload.error ?? '결과 재생성에 실패했습니다.');
            }

            const nextCoreResult: ResultCoreJson = corePayload as ResultCoreJson;
            setCurrentResult(nextCoreResult);
            setCurrentDetail(null);
            setCurrentDetailStatus('pending');
            setCurrentDetailError(null);
            setRegenMessage('핵심 결과를 새로 만들었고, 하단의 상세 분석도 이어서 정리하고 있습니다.');

            void fetch('/api/analyze', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ sessionId, mode: 'detail' }),
                keepalive: true,
            }).catch((error) => {
                console.error('[ResultCard] detail regenerate failed', error);
            });
        } catch (error) {
            setRegenMessage(error instanceof Error ? error.message : '결과 재생성에 실패했습니다.');
        } finally {
            setRegenLoading(false);
        }
    }

    async function handleRetryDetail() {
        setCurrentDetail(null);
        setCurrentDetailStatus('idle');
        setCurrentDetailError(null);
    }

    return (
        <>
            {deleteCompleted && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-6"
                    style={{ backgroundColor: 'rgba(247,249,251,0.94)', backdropFilter: 'blur(10px)' }}
                >
                    <div
                        className="w-full max-w-sm rounded-3xl p-7 text-center soft-lift"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        <p className="mb-4 text-4xl">삭제됨</p>
                        <h2 className="mb-3 text-xl font-bold" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                            결과가 안전하게 삭제됐어요
                        </h2>
                        <p className="text-sm leading-relaxed" style={{ color: '#43474e' }}>
                            저장된 검사 데이터와 초대 흐름을 정리했고, 잠시 후 처음 화면으로 이동합니다.
                        </p>
                    </div>
                </div>
            )}

            {showConsent && (
                <ConsentModal
                    onAccept={handleConsent}
                    onClose={() => setShowConsent(false)}
                    onDelete={handleDelete}
                    loading={consentLoading}
                />
            )}

            <div className="flex flex-col gap-8 break-words">
                <div className="px-6">
                    <button
                        type="button"
                        onClick={handleAdminTriggerClick}
                        className="mb-6 w-full text-center text-lg font-semibold uppercase tracking-wider text-zinc-600"
                    >
                        {nickname}님의 결과지
                    </button>

                    {adminUnlocked && (
                        <div className="mb-6 rounded-2xl p-4 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#ba1a1a' }}>
                                Admin
                            </p>
                            <p className="mb-3 text-xs leading-relaxed" style={{ color: '#43474e' }}>
                                저장된 선택지와 대화 기록으로 핵심 결과를 먼저 다시 만들고, 하단의 깊은 분석은 이어서
                                갱신합니다.
                            </p>
                            <GoldButton onClick={handleRegenerate} disabled={regenLoading} className="w-full">
                                {regenLoading ? '재생성 중...' : '결과 다시 생성'}
                            </GoldButton>
                            {regenMessage && (
                                <p
                                    className="mt-3 text-xs leading-relaxed"
                                    style={{
                                        color:
                                            regenMessage.includes('실패') || regenMessage.includes('불가능')
                                                ? '#ba1a1a'
                                                : '#0060ac',
                                    }}
                                >
                                    {regenMessage}
                                </p>
                            )}
                        </div>
                    )}

                    <p className="text-xs">{nickname}님은</p>
                    <h1 className="mb-4 text-3xl font-bold leading-tight" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                        {currentResult.typeName}
                    </h1>
                    <p className="mb-6 text-base leading-relaxed" style={{ color: '#43474e' }}>
                        {currentResult.tagline}
                    </p>
                    <button
                        type="button"
                        onClick={handleShare}
                        className="rounded-2xl px-5 py-2.5 text-sm transition-all active:scale-[0.98]"
                        style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
                    >
                        결과 공유하기
                    </button>
                </div>

                <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                    <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        2축 애착 지도
                    </p>
                    <ScatterChart anxietyScore={currentResult.anxietyScore} avoidanceScore={currentResult.avoidanceScore} />

                    <div className="mt-5 flex flex-col gap-4">
                        {(
                            [
                                {
                                    label: '감정 반응 강도',
                                    score: currentResult.anxietyScore,
                                    intensity: currentResult.emotionalIntensity,
                                },
                                {
                                    label: '거리 유지 성향',
                                    score: currentResult.avoidanceScore,
                                    intensity: currentResult.distanceTendency,
                                },
                            ] as const
                        ).map(({ label, score, intensity }) => {
                            const pct = ((score - 1) / 6) * 100;
                            const color =
                                intensity === '낮음' ? '#0060ac' : intensity === '중간' ? '#f97316' : '#ba1a1a';
                            return (
                                <div key={label}>
                                    <div className="mb-2 flex justify-between text-xs font-semibold">
                                        <span style={{ color: '#43474e' }}>{label}</span>
                                        <span style={{ color }}>
                                            {score.toFixed(1)} · {intensity}
                                        </span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: '#eceef0' }}>
                                        <div
                                            className="h-1.5 rounded-full"
                                            style={{ width: `${pct}%`, backgroundColor: color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        연애에서의 당신
                    </p>
                    {splitIntoParagraphs(currentResult.lovePattern).map((paragraph, index) => (
                        <p
                            key={paragraph}
                            className={`text-xs leading-relaxed ${index > 0 ? 'mt-4' : ''}`}
                            style={{ color: '#191c1e' }}
                        >
                            {paragraph}
                        </p>
                    ))}
                </div>

                <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        마음이 예민해지는 지점
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                        {currentResult.coreWound}
                    </p>
                </div>

                <div className="rounded-3xl p-7" style={{ backgroundColor: '#ffdad5' }}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#c8724a' }}>
                        연인과의 관계를 다르게 보는 연습
                    </p>
                    <p className="text-xs font-medium leading-relaxed" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                        {currentResult.mindset}
                    </p>
                </div>

                <div className="px-6">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        앞으로 이렇게 해보세요.
                    </p>
                    <div className="flex flex-col gap-4">
                        {currentResult.actionTip.map((tip, index) => (
                            <div key={tip} className="flex items-start gap-4">
                                <div
                                    className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                    style={{ backgroundColor: '#dbeafe', color: '#002045' }}
                                >
                                    {index + 1}
                                </div>
                                <p className="pt-0.5 text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {tip}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {currentDetail ? (
                    <>
                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                연애에서 내 마음이 움직이는 순서
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentDetail.reactionSequence.map((step, index) => (
                                    <div key={step} className="flex items-start gap-3">
                                        <div
                                            className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                            style={{ backgroundColor: '#002045', color: '#ffffff' }}
                                        >
                                            {index + 1}
                                        </div>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {step}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                내가 특히 흔들리기 쉬운 순간
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {currentDetail.dominantTriggers.map((trigger) => (
                                    <span
                                        key={trigger}
                                        className="rounded-full px-3 py-2 text-xs"
                                        style={{ backgroundColor: '#f2f4f6', color: '#43474e' }}
                                    >
                                        {trigger}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                    겉으로 나는 이렇게 보여요
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {currentDetail.outerSignal}
                                </p>
                            </div>
                            <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                    내 속마음은 이쪽에 가까워요
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {currentDetail.innerSignal}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                상대는 나를 이렇게 느끼기 쉬워요
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentDetail.partnerImpact.map((item) => (
                                    <p key={item} className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                        • {item}
                                    </p>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                    내가 편안할 때 더 잘 드러나는 모습
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {currentDetail.protectiveStrength}
                                </p>
                            </div>
                            <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                    내가 불안해지면 이렇게 반응해요
                                </p>
                                <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                    {currentDetail.threatResponse}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-5 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                내가 관계를 바꾸는 연습 순서
                            </p>
                            <div className="flex flex-col gap-4">
                                {currentDetail.growthRoadmap.map((item, index) => (
                                    <div key={item} className="flex items-start gap-4">
                                        <div
                                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                                            style={{ backgroundColor: '#dbeafe', color: '#002045' }}
                                        >
                                            {index + 1}
                                        </div>
                                        <p className="pt-0.5 text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {item}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                이번 결과에 내 입력 중 많이 반영된 단서
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentDetail.analysisSignals.map((signal) => (
                                    <p key={signal} className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                        • {signal}
                                    </p>
                                ))}
                            </div>
                        </div>
                    </>
                ) : currentDetailStatus === 'failed' ? (
                    <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#ba1a1a' }}>
                            상세 분석을 아직 완성하지 못했어요
                        </p>
                        <p className="text-xs leading-relaxed" style={{ color: '#43474e' }}>
                            {currentDetailError ?? '하단의 근거 기반 분석 섹션을 가져오는 중 문제가 발생했습니다.'}
                        </p>
                        <GoldButton onClick={handleRetryDetail} className="mt-5 w-full">
                            상세 분석 다시 시도
                        </GoldButton>
                    </div>
                ) : (
                    <DetailLoadingBlock
                        message={
                            currentDetailStatus === 'pending'
                                ? '상단 결과는 먼저 보여드렸고, 지금 내 마음이 움직이는 흐름과 왜 그런지까지 더 자세히 정리하고 있어요.'
                                : '상단 결과를 바탕으로 내 관계 패턴을 더 자세히 풀어내고 있어요.'
                        }
                    />
                )}

                <div className="flex flex-col gap-3 pb-12">
                    {inviteUrl ? (
                        <div className="rounded-3xl p-5 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-2 text-xs font-semibold" style={{ color: '#43474e' }}>
                                초대 링크가 생성되었습니다
                            </p>
                            <p className="mb-4 break-all text-xs" style={{ color: '#0060ac' }}>
                                {inviteUrl}
                            </p>
                            <GoldButton onClick={handleCopy} className="w-full">
                                {copied ? '복사됨!' : '링크 복사하기'}
                            </GoldButton>
                        </div>
                    ) : (
                        <>
                            <GoldButton onClick={() => setShowConsent(true)} className="w-full">
                                연인에게 보내기 💑
                            </GoldButton>
                            <p className="mt-3 text-center text-xs leading-relaxed" style={{ color: '#74777f' }}>
                                연인도 검사를 완료하면, 두 사람의 애착 패턴이 어떻게 맞물리는지 함께 더 잘 연애하는
                                방법을 분석해 드립니다.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
