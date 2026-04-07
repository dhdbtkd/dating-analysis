'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { GoldButton } from '@/components/ui/GoldButton';
import type { ResultCoreJson, ResultDetailJson, ResultDetailStatus, SessionRow } from '@/types';

const RadarChart = dynamic(() => import('./RadarChart').then((module) => module.RadarChart), { ssr: false });

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
    coupleId?: string;
    scoreTrust?: number | null;
    scoreSelfDisclosure?: number | null;
    scoreConflict?: number | null;
    scoreRelSelfEsteem?: number | null;
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
                <ul className="mb-5 flex flex-col gap-1.5 text-xs leading-relaxed" style={{ color: '#43474e' }}>
                    <li>• 닉네임, 애착 유형이 서버에 저장돼요</li>
                    <li>• 연인도 같은 링크로 결과를 완성하면, 두 사람의 패턴을 함께 볼 수 있어요</li>
                    <li>• 대화 내용은 상대방에게 공개되지 않아요</li>
                </ul>
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
                {/* <button
                    type="button"
                    onClick={onDelete}
                    disabled={loading}
                    className="mt-3 w-full rounded-2xl py-3 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ backgroundColor: '#ffdad5', color: '#ba1a1a' }}
                >
                    결과 삭제
                </button> */}
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

export function ResultCard({ result, detailResult, detailStatus, detailError, sessionId, nickname, coupleId, scoreTrust, scoreSelfDisclosure, scoreConflict, scoreRelSelfEsteem }: ResultCardProps) {
    type RegenerateMode = 'both' | 'core' | 'detail';

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
    const [regenerateMode, setRegenerateMode] = useState<RegenerateMode>('both');
    const [coupleAnalysisState, setCoupleAnalysisState] = useState<'loading' | 'ready' | 'error'>(
        coupleId ? 'loading' : 'ready',
    );

    useEffect(() => {
        setCurrentResult(result);
    }, [result]);

    useEffect(() => {
        setCurrentDetail(detailResult);
        setCurrentDetailStatus(detailStatus);
        setCurrentDetailError(detailError);
    }, [detailError, detailResult, detailStatus]);

    useEffect(() => {
        if (!coupleId) return;
        void (async () => {
            try {
                const res = await fetch('/api/couple/analyze', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ coupleId }),
                });
                if (res.ok) {
                    setCoupleAnalysisState('ready');
                } else {
                    setCoupleAnalysisState('error');
                }
            } catch {
                setCoupleAnalysisState('error');
            }
        })();
    }, [coupleId]);

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

    function buildOgImageUrl(): string {
        const base = window.location.origin;
        const toPercent = (s: number) => Math.round(((s - 1) / 6) * 100);
        const params = new URLSearchParams({
            nickname,
            type: currentResult.typeName,
            tagline: currentResult.tagline,
            s0: String(toPercent(8 - currentResult.anxietyScore)),
            s1: String(toPercent(scoreTrust ?? 4)),
            s2: String(toPercent(scoreSelfDisclosure ?? 4)),
            s3: String(toPercent(scoreConflict ?? 4)),
            s4: String(toPercent(scoreRelSelfEsteem ?? 4)),
            s5: String(toPercent(8 - currentResult.avoidanceScore)),
        });
        return `${base}/api/og?${params.toString()}`;
    }

    function handleShare() {
        const url = window.location.href;
        const base = window.location.origin;

        console.log('[Share] Kakao 존재:', !!window.Kakao);
        console.log('[Share] Kakao 초기화:', window.Kakao?.isInitialized());
        console.log('[Share] APP_KEY:', process.env.NEXT_PUBLIC_KAKAO_APP_KEY ? '있음' : '없음(빈값)');

        // SDK 로드됐지만 초기화 안 된 경우 재시도
        if (window.Kakao && !window.Kakao.isInitialized()) {
            const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
            if (key) window.Kakao.init(key);
        }

        if (window.Kakao?.isInitialized()) {
            window.Kakao.Share.sendDefault({
                objectType: 'feed',
                content: {
                    title: `${nickname}님의 연애 유형: ${currentResult.typeName}`,
                    description: currentResult.tagline,
                    imageUrl: buildOgImageUrl(),
                    link: { mobileWebUrl: url, webUrl: url },
                },
                buttons: [
                    {
                        title: '내 결과 보기',
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

        // 카카오 SDK 없으면 링크 복사 fallback
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        });
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

            const ecrScores = {
                anxiety: sessionData.ecr_anxiety,
                avoidance: sessionData.ecr_avoidance,
                typeName: sessionData.attachment_type,
            };
            const userInfo = {
                nickname: sessionData.nickname,
                age: sessionData.age,
                gender: sessionData.gender,
            };

            if (regenerateMode === 'detail') {
                setCurrentDetail(null);
                setCurrentDetailStatus('pending');
                setCurrentDetailError(null);

                const detailResponse = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ sessionId, mode: 'detail' }),
                });

                if (detailResponse.status === 202) {
                    setRegenMessage('상세 분석만 다시 정리하고 있어요. 하단 섹션이 도착하는 대로 갱신됩니다.');
                    return;
                }

                const detailPayload = (await detailResponse.json()) as
                    | ResultDetailJson
                    | { error?: string; detail?: string };
                if (!detailResponse.ok) {
                    const errorPayload = detailPayload as { error?: string; detail?: string };
                    throw new Error(errorPayload.detail ?? errorPayload.error ?? '상세 분석 재생성에 실패했습니다.');
                }

                setCurrentDetail(detailPayload as ResultDetailJson);
                setCurrentDetailStatus('completed');
                setCurrentDetailError(null);
                setRegenMessage('상세 분석만 다시 생성했습니다.');
                return;
            }

            const coreResponse = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    mode: 'core',
                    chatHistory: sessionData.chat_history,
                    ecrScores,
                    userInfo,
                    warmupAnswers: sessionData.warmup_answers,
                    quizDetails: sessionData.quiz_details,
                    resetDetail: regenerateMode === 'both',
                }),
            });

            const corePayload = (await coreResponse.json()) as ResultCoreJson | { error?: string; detail?: string };
            if (!coreResponse.ok) {
                const errorPayload = corePayload as { error?: string; detail?: string };
                throw new Error(errorPayload.detail ?? errorPayload.error ?? '결과 재생성에 실패했습니다.');
            }

            const nextCoreResult: ResultCoreJson = corePayload as ResultCoreJson;
            setCurrentResult(nextCoreResult);

            if (regenerateMode === 'core') {
                setRegenMessage('핵심 결과만 다시 생성했습니다.');
                return;
            }

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
                            <p
                                className="mb-2 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: '#ba1a1a' }}
                            >
                                Admin
                            </p>
                            <p className="mb-3 text-xs leading-relaxed" style={{ color: '#43474e' }}>
                                저장된 선택지와 대화 기록 기준으로, 필요한 분석만 다시 생성할 수 있어요. 비용을 아끼려면
                                아래에서 범위를 골라주세요.
                            </p>
                            <div className="mb-3 grid grid-cols-3 gap-2">
                                {[
                                    { value: 'both', label: '둘 다' },
                                    { value: 'core', label: '상단만' },
                                    { value: 'detail', label: '하단만' },
                                ].map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setRegenerateMode(option.value as RegenerateMode)}
                                        disabled={regenLoading}
                                        className="rounded-2xl px-3 py-2 text-xs transition-all disabled:opacity-40"
                                        style={{
                                            backgroundColor: regenerateMode === option.value ? '#dbeafe' : '#f2f4f6',
                                            color: regenerateMode === option.value ? '#002045' : '#43474e',
                                            fontWeight: regenerateMode === option.value ? 600 : 500,
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                            <GoldButton onClick={handleRegenerate} disabled={regenLoading} className="w-full">
                                {regenLoading
                                    ? '재생성 중...'
                                    : regenerateMode === 'both'
                                      ? '상단+하단 다시 생성'
                                      : regenerateMode === 'core'
                                        ? '상단 결과만 다시 생성'
                                        : '하단 분석만 다시 생성'}
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
                    <h1
                        className="mb-1.5 text-2xl font-bold leading-tight break-keep"
                        style={{ fontFamily: 'Paperozi', color: '#002045' }}
                    >
                        {currentResult.typeName}
                    </h1>
                    <p className="mb-6 text-xs leading-relaxed" style={{ color: '#43474e' }}>
                        {currentResult.tagline}
                    </p>
                </div>

                <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        관계 패턴 지도
                    </p>
                    <p className="mb-4 text-xs" style={{ color: '#74777f' }}>
                        6가지 관계 지표를 종합한 나의 프로필
                    </p>
                    <RadarChart
                        anxiety={currentResult.anxietyScore}
                        avoidance={currentResult.avoidanceScore}
                        trust={scoreTrust ?? null}
                        selfDisclosure={scoreSelfDisclosure ?? null}
                        conflict={scoreConflict ?? null}
                        relSelfEsteem={scoreRelSelfEsteem ?? null}
                    />
                </div>

                {/* 나의 패턴 — 연애 모습 + 예민한 지점 묶음 */}
                <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        나의 패턴
                    </p>
                    <div className="flex flex-col gap-5">
                        <div>
                            <p className="mb-2 text-xs font-semibold" style={{ color: '#43474e' }}>연애에서의 당신</p>
                            {splitIntoParagraphs(currentResult.lovePattern).map((paragraph, index) => (
                                <p
                                    key={paragraph}
                                    className={`text-xs leading-relaxed ${index > 0 ? 'mt-3' : ''}`}
                                    style={{ color: '#191c1e' }}
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid #f2f4f6', paddingTop: '16px' }}>
                            <p className="mb-2 text-xs font-semibold" style={{ color: '#43474e' }}>마음이 예민해지는 지점</p>
                            <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                {currentResult.coreWound}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 마인드셋 + 실천 팁 묶음 */}
                <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                        변화를 위한 제안
                    </p>
                    <div
                        className="mb-5 rounded-2xl p-4"
                        style={{ backgroundColor: '#ffdad5' }}
                    >
                        <p className="mb-1 text-xs font-semibold" style={{ color: '#c8724a' }}>관계를 다르게 보는 연습</p>
                        <p
                            className="text-xs font-medium leading-relaxed"
                            style={{ fontFamily: 'Paperozi', color: '#002045' }}
                        >
                            {currentResult.mindset}
                        </p>
                    </div>
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
                            <p
                                className="mb-5 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: '#0060ac' }}
                            >
                                연애할 때 내 마음은 이렇게 흘러가요
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentDetail.patternFlow.map((caseText) => {
                                    const steps = caseText.split(/\s*->\s*/);
                                    return (
                                        <div key={caseText} className="rounded-2xl px-4 py-3" style={{ backgroundColor: '#f7f9fb' }}>
                                            <div className="flex flex-wrap items-center gap-1">
                                                {steps.map((s, si) => (
                                                    <span key={si} className="flex items-center gap-1">
                                                        <span className="text-xs leading-relaxed" style={{ color: si === 0 ? '#002045' : '#191c1e', fontWeight: si === 0 ? 600 : 400 }}>
                                                            {s}
                                                        </span>
                                                        {si < steps.length - 1 && (
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                                <polyline points="12 5 19 12 12 19" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p
                                className="mb-4 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: '#0060ac' }}
                            >
                                나는 이럴 때 특히 흔들려요
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {currentDetail.shakyMoments.map((trigger) => (
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

                        {/* 반응 방식 — 겉/속 + 편할때/불안할때 묶음 */}
                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                반응 방식
                            </p>
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-3 grid-cols-2">
                                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#f7f9fb' }}>
                                        <p className="mb-1.5 text-xs font-semibold" style={{ color: '#43474e' }}>겉으로는</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {currentDetail.visibleReaction}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#f7f9fb' }}>
                                        <p className="mb-1.5 text-xs font-semibold" style={{ color: '#43474e' }}>속으로는</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {currentDetail.realFeeling}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ borderTop: '1px solid #f2f4f6', paddingTop: '12px' }}>
                                    <p className="mb-2 text-xs font-semibold" style={{ color: '#43474e' }}>상대는 나를 이렇게 느끼기 쉬워요</p>
                                    <div className="flex flex-col gap-2">
                                        {currentDetail.partnerFeels.map((item) => (
                                            <p key={item} className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                                • {item}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid gap-3 grid-cols-2" style={{ borderTop: '1px solid #f2f4f6', paddingTop: '12px' }}>
                                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#f0fdf4' }}>
                                        <p className="mb-1.5 text-xs font-semibold" style={{ color: '#15803d' }}>편안할 때</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {currentDetail.whenSafe}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl p-3" style={{ backgroundColor: '#fff7ed' }}>
                                        <p className="mb-1.5 text-xs font-semibold" style={{ color: '#c2410c' }}>불안할 때</p>
                                        <p className="text-xs leading-relaxed" style={{ color: '#191c1e' }}>
                                            {currentDetail.whenShaken}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p
                                className="mb-5 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: '#0060ac' }}
                            >
                                이제 나는 이렇게 해보면 좋아요
                            </p>
                            <div className="flex flex-col gap-4">
                                {currentDetail.nextSteps.map((item, index) => (
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
                            <p
                                className="mb-4 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: '#0060ac' }}
                            >
                                이번 결과를 만든 단서예요
                            </p>
                            <div className="flex flex-col gap-3">
                                {currentDetail.keyClues.map((signal) => (
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
                                ? '상단 결과는 먼저 보여드렸고, 지금 내 대답과 대화를 바탕으로 왜 이런 결과가 나왔는지 더 풀어쓰고 있어요.'
                                : '상단 결과를 바탕으로 내 연애 장면을 더 자세히 풀어내고 있어요.'
                        }
                    />
                )}

                <div className="flex flex-col gap-3 pb-12">
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
                    {coupleId ? (
                        <div className="rounded-3xl p-6 soft-lift" style={{ backgroundColor: '#ffffff' }}>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wider" style={{ color: '#0060ac' }}>
                                커플 분석
                            </p>
                            <p className="mb-4 text-sm font-bold leading-tight" style={{ fontFamily: 'Paperozi', color: '#002045' }}>
                                두 사람의 연애 패턴
                            </p>
                            <p className="mb-5 text-xs leading-relaxed" style={{ color: '#43474e' }}>
                                {coupleAnalysisState === 'loading'
                                    ? '상대방의 데이터와 대화를 함께 분석하고 있어요. 잠시만 기다려주세요.'
                                    : coupleAnalysisState === 'error'
                                      ? '커플 분석 중 문제가 생겼어요. 아래 버튼을 눌러 직접 확인해보세요.'
                                      : '두 사람의 애착 패턴이 어떻게 맞물리는지 분석이 완료됐어요.'}
                            </p>
                            {coupleAnalysisState === 'loading' ? (
                                <div
                                    className="w-full rounded-2xl py-3 text-center text-sm font-semibold"
                                    style={{ backgroundColor: '#eceef0', color: '#74777f' }}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <span
                                            className="inline-block w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: '#74777f',
                                                animation: 'pulse 1.2s ease-in-out infinite',
                                            }}
                                        />
                                        분석 중...
                                    </span>
                                </div>
                            ) : (
                                <a
                                    href={`/couple/${coupleId}`}
                                    className="block w-full rounded-2xl py-3 text-center text-sm font-semibold transition-all active:scale-[0.98]"
                                    style={{ backgroundColor: '#002045', color: '#ffffff' }}
                                >
                                    커플 분석 결과 보기 💑
                                </a>
                            )}
                        </div>
                    ) : inviteUrl ? (
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
                            <p className="mt-4 text-xs leading-relaxed text-center" style={{ color: '#74777f' }}>
                                상대방이 이 링크로 검사를 완료하면<br />두 사람의 연애 패턴을 함께 볼 수 있어요
                            </p>
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
