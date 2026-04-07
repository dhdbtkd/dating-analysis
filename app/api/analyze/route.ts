import { callLLMJson } from '@/lib/llm';
import { getLlmConfig, assemblePromptParts } from '@/lib/llmConfig';
import { checkRateLimit, checkAndIncrementDailyQuota, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { ChatMessage, ResultCoreJson, ResultDetailJson, WarmupAnswer, QuizDetail } from '@/types';

type AnalyzeMode = 'core' | 'detail';

interface AnalyzeRequestBody {
    sessionId?: string;
    mode?: AnalyzeMode;
    resetDetail?: boolean;
    chatHistory?: ChatMessage[];
    ecrScores?: { anxiety: number; avoidance: number; trust?: number; selfDisclosure?: number; conflict?: number; relSelfEsteem?: number; typeName: string };
    userInfo?: { nickname: string; age: number; gender: string };
    warmupAnswers?: WarmupAnswer[];
    quizDetails?: QuizDetail[];
}

function interpretScore(score: number, axis: 'anxiety' | 'avoidance'): string {
    const labels =
        axis === 'anxiety'
            ? { low: '안정에 가까움', mid: '보통 수준', high: '불안 경향 강함' }
            : { low: '친밀감 허용', mid: '보통 수준', high: '거리 두는 경향 강함' };
    if (score < 3.5) return `평균보다 낮음 (${labels.low})`;
    if (score <= 4.5) return '경계값 — 혼합 양상 가능성 높음';
    return `평균보다 높음 (${labels.high})`;
}

const CORE_RESULT_SCHEMA = {
    type: 'object',
    properties: {
        typeName: { type: 'string' },
        tagline: { type: 'string' },
        lovePattern: { type: 'string' },
        coreWound: { type: 'string' },
        actionTip: { type: 'array', items: { type: 'string' } },
        mindset: { type: 'string' },
    },
    required: [
        'typeName',
        'tagline',
        'lovePattern',
        'coreWound',
        'actionTip',
        'mindset',
    ],
    additionalProperties: false,
};

const DETAIL_RESULT_SCHEMA = {
    type: 'object',
    properties: {
        patternFlow: { type: 'array', items: { type: 'string' } },
        shakyMoments: { type: 'array', items: { type: 'string' } },
        visibleReaction: { type: 'string' },
        realFeeling: { type: 'string' },
        partnerFeels: { type: 'array', items: { type: 'string' } },
        whenSafe: { type: 'string' },
        whenShaken: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'string' } },
        keyClues: { type: 'array', items: { type: 'string' } },
    },
    required: [
        'patternFlow',
        'shakyMoments',
        'visibleReaction',
        'realFeeling',
        'partnerFeels',
        'whenSafe',
        'whenShaken',
        'nextSteps',
        'keyClues',
    ],
    additionalProperties: false,
};

function buildAnalysisContext(
    chatHistory: ChatMessage[],
    ecrScores: { anxiety: number; avoidance: number; trust?: number; selfDisclosure?: number; conflict?: number; relSelfEsteem?: number; typeName: string },
    userInfo: { nickname: string; age: number; gender: string },
    warmupAnswers: WarmupAnswer[],
    quizDetails: QuizDetail[],
) {
    const likertLegend =
        '1=전혀 그렇지 않다 / 2=그렇지 않다 / 3=약간 그렇지 않다 / 4=보통 / 5=약간 그렇다 / 6=그렇다 / 7=매우 그렇다';

    const warmupSummary = warmupAnswers
        .map((answer) => `[측정: ${answer.measures}]\n질문: ${answer.questionText}\n답변: ${answer.selectedText}`)
        .join('\n\n');

    const quizSummary = quizDetails
        .map((detail, index) => `Q${index + 1}. ${detail.questionText}\n선택한 점수: ${detail.score}`)
        .join('\n\n');

    const conversationText = chatHistory
        .map((message) => `${message.role === 'user' ? '사용자' : 'AI'}: ${message.content}`)
        .join('\n');

    const extendedScores = [
        ecrScores.trust !== undefined ? `- 신뢰: ${ecrScores.trust.toFixed(2)}` : null,
        ecrScores.selfDisclosure !== undefined ? `- 자기개방성: ${ecrScores.selfDisclosure.toFixed(2)}` : null,
        ecrScores.conflict !== undefined ? `- 갈등 건강도: ${ecrScores.conflict.toFixed(2)}` : null,
        ecrScores.relSelfEsteem !== undefined ? `- 관계 자존감: ${ecrScores.relSelfEsteem.toFixed(2)}` : null,
    ].filter(Boolean).join('\n');

    return `사용자 정보:
- 이름: ${userInfo.nickname}, 나이: ${userInfo.age}세
- ECR 불안 점수: ${ecrScores.anxiety.toFixed(2)} → ${interpretScore(ecrScores.anxiety, 'anxiety')}
- ECR 회피 점수: ${ecrScores.avoidance.toFixed(2)} → ${interpretScore(ecrScores.avoidance, 'avoidance')}
${extendedScores ? extendedScores + '\n' : ''}
워밍업 응답:
${warmupSummary || '없음'}

ECR 척도 응답 (${likertLegend}):
${quizSummary || '없음'}

심층 대화:
${conversationText || '없음'}`;
}

function buildCorePrompt(context: string, ecrScores: { anxiety: number; avoidance: number; trust?: number; selfDisclosure?: number; conflict?: number; relSelfEsteem?: number }, staticInstructions?: string) {
    if (staticInstructions) {
        return `${context}\n\n${staticInstructions}\n- anxietyScore: ${ecrScores.anxiety.toFixed(1)}\n- avoidanceScore: ${ecrScores.avoidance.toFixed(1)}`;
    }
    return `${context}

출력 형식:
JSON 객체 하나만 반환

각 필드 작성 지침:
- typeName: 유형명
- tagline: 한 줄 저격 문장 (50자 이내)
- lovePattern: 연애 패턴 설명 (600자 이내)
- coreWound: 핵심 상처/공포 (200자 이내)
- actionTip: 오늘 바로 할 수 있는 구체적 행동 3가지 배열
- mindset: 마인드셋 전환 문장 (150자 이내)
- anxietyScore: ${ecrScores.anxiety.toFixed(1)}
- avoidanceScore: ${ecrScores.avoidance.toFixed(1)}

중요 원칙:
1. 결과는 "이 사람이 어떤 사람인지" 규정하지 말고, "관계에서 어떤 반응과 행동을 반복하는지"를 설명할 것
2. 특히 tagline은 성격 정의 문장이 아니라, 사용자의 연애 상황에서 드러나는 반복 행동 패턴을 한 줄로 찌를 것
3. tagline의 행동 주체는 반드시 사용자 본인이다. 상대가 아니라 사용자가 하는 행동만 써라
4. 주어가 헷갈리는 표현 금지. 상대도 될 수 있는 문장 금지
5. "~한 사람", "~한 타입", "~한 성향" 같은 정체성 낙인 표현 금지
6. 문장은 분석문 말투가 아니라, 사용자가 읽자마자 "내 얘기다" 싶게 써라
7. 어려운 심리학 용어, 논문 말투, 상담사 말투 금지
8. 점수가 경계값(3.5~4.5)이면 한쪽으로 단정하지 말고, 끌리면서도 물러나는 혼합 패턴으로 표현할 것
9. 동일 유형이어도 점수 강도와 대화 내용에 따라 결과 톤과 강도를 완전히 다르게 만들 것
10. 6개 지표(불안·회피·신뢰·자기개방성·갈등 건강도·관계 자존감)를 종합해서 분석할 것. 불안·회피만 보지 말고 나머지 지표가 서로 어떻게 맞물리는지 반영할 것
11. 예: 불안이 높아도 자기개방성이 낮으면 "불안하지만 말을 못 하는" 패턴, 신뢰가 낮고 불안이 높으면 "믿고 싶지만 못 믿는" 패턴처럼 조합을 읽어낼 것

필드별 세부 규칙:

[typeName]
- 흔한 애착유형 이름 그대로 쓰지 말 것
- 이 사람의 점수와 대화 내용에서 드러난 특징을 바탕으로, 이해 쉬운 생활 언어로 만들 것
- 추상적이거나 뻔한 이름 금지

[tagline]
- 사용자의 연애 행동 패턴만 써라
- 상대 행동처럼 읽힐 수 있는 문장 금지
- 설명형 문장보다 직격형 문장 우선

[lovePattern]
- 관계 장면이 보이게 쓸 것
- 추상 설명보다 실제 관계 흐름이 느껴지게 작성

[coreWound]
- 가장 깊은 두려움을 짧고 강하게

[actionTip]
- 오늘 당장 할 수 있는 행동만
- 추상 조언 금지

[mindset]
- 한 문장
- 위로보다 전환`;
}

function buildDetailPrompt(context: string, staticInstructions?: string) {
    if (staticInstructions) {
        return `${context}\n\n${staticInstructions}`;
    }
    return `${context}

출력 형식:
JSON 객체 하나만 반환

반드시 아래 필드만 채워라:
- patternFlow: 관계에서 반복되는 흐름 4단계 배열
- shakyMoments: 특히 흔들리는 상황 3개 배열
- visibleReaction: 겉으로 보이는 반응 1문장
- realFeeling: 속에서 실제로 드는 마음 1문장
- partnerFeels: 상대가 느끼기 쉬운 반응 3개 배열
- whenSafe: 편안할 때 드러나는 좋은 모습 1문장
- whenShaken: 불안할 때 무너지는 방식 1문장
- nextSteps: 바꾸기 위해 해볼 3단계 배열
- keyClues: 이번 결과에 크게 반영된 단서 3개 배열

작성 원칙:
1. 사람을 규정하지 말고, 연애할 때 자주 나오는 모습만 써라
2. 어려운 말 쓰지 말고, 평소 대화하듯 쉬운 말로 써라
3. 추상적으로 설명하지 말고, 장면이 떠오르게 써라
4. 지어내지 말고, 워밍업 응답 / 척도 응답 / 대화 내용에서 보인 것만 써라
5. 각 항목은 짧고 또렷하게, 한 번에 읽히게 써라
6. 상담사 말투, 보고서 말투, 심리학 용어 금지
7. 있어 보이는 말보다 바로 이해되는 말을 우선 써라
8. 중학생도 바로 이해할 수 있는 단어만 써라

금지 표현:
- 경향, 성향, 양상, 기제, 신호, 촉발, 반응성, 취약성, 회피적, 방어적, 애착, 정서적, 관계 역동
- 활성화된다, 표출된다, 드러난다, 관찰된다, 기인한다, 비롯된다
- 불필요한 한자어와 분석 보고서 말투

권장 표현:
- 눈치 본다
- 혼자 정리한다
- 먼저 거리를 둔다
- 괜찮은 척한다
- 말수를 줄인다
- 속으로 서운해한다
- 확인하고 싶지만 참는다
- 다가가고 싶다가도 멈춘다

필드별 규칙:

[patternFlow]
- "무슨 일이 생김 -> 속으로 어떻게 받아들임 -> 겉으로 어떻게 행동함 -> 그 뒤 어떻게 꼬임" 순서로 쓸 것
- 4개 고정
- 각 항목은 짧고 쉬운 말로 쓸 것

[shakyMoments]
- 실제 연애 장면처럼 구체적으로 쓸 것
- "불안할 때" 같은 뭉뚱그린 표현 금지
- 예: "답장이 평소보다 늦어졌을 때"

[visibleReaction]
- 남들이 보기에도 보이는 행동만 쓸 것
- 어려운 말 금지

[realFeeling]
- 속마음을 쉬운 말로 쓸 것
- 머릿속에서 어떤 생각이 도는지 바로 이해되게 쓸 것

[partnerFeels]
- 상대 입장에서 느끼는 반응을 쉬운 말로 쓸 것
- 예: "갑자기 벽이 생긴 것처럼 느낀다"

[whenSafe]
- 편하고 안정적일 때 나오는 좋은 모습을 담백하게 쓸 것
- 과장 금지

[whenShaken]
- 불안하거나 서운할 때 무너지는 방식을 쉬운 말 한 문장으로 쓸 것

[nextSteps]
- 3개 고정
- 1단계: 먼저 알아차릴 것
- 2단계: 짧게라도 말로 꺼낼 것
- 3단계: 관계 안에서 실제로 해볼 것
- 오늘 바로 할 수 있는 수준으로 쓸 것

[keyClues]
- 이번 결과를 만들 때 중요했던 단서를 쉬운 말로 쓸 것
- "대화에서 계속 보인 ___", "답변에서 자주 나온 ___" 같은 식으로 쓸 것

좋은 표현 예시:
- 답이 늦으면 괜히 마음이 식은 건가부터 생각한다
- 서운해도 바로 말하지 않고 혼자 정리하려 한다
- 가까워지면 좋은데, 너무 빨라지면 한발 물러난다

피해야 할 표현 예시:
- 정서적 불안이 증폭된다
- 방어적 기제가 활성화된다
- 친밀감에 대한 양가적 반응이 나타난다
- 관계 내 취약성이 드러난다`;
}

async function buildCoreResult(
    context: string,
    ecrScores: { anxiety: number; avoidance: number },
): Promise<ResultCoreJson> {
    const dbConfig = await getLlmConfig('analyze_core');
    const system = dbConfig?.system_prompt ??
        '당신은 심리 분석 전문가입니다. 아래 데이터를 바탕으로 사용자의 연애 패턴 핵심 결과를 간결하지만 선명하게 정리하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : null;
    const prompt = buildCorePrompt(context, ecrScores, staticInstructions ?? undefined);
    const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

    console.log('\n========== [/api/analyze][core] SYSTEM PROMPT ==========');
    console.log(system);
    console.log('\n========== [/api/analyze][core] USER PROMPT ==========');
    console.log(prompt);
    console.log('======================================================\n');

    const llmResult = await callLLMJson<Omit<ResultCoreJson, 'anxietyScore' | 'avoidanceScore'>>(
        [{ role: 'user', content: prompt }],
        CORE_RESULT_SCHEMA,
        'love_pattern_core_result',
        system,
        llmOpts,
    );

    return {
        ...llmResult,
        anxietyScore: Math.round(ecrScores.anxiety * 10) / 10,
        avoidanceScore: Math.round(ecrScores.avoidance * 10) / 10,
    };
}

async function buildDetailResult(context: string): Promise<ResultDetailJson> {
    const dbConfig = await getLlmConfig('analyze_detail');
    const system = dbConfig?.system_prompt ??
        '당신은 심리 분석가이자 관계 패턴 에디터입니다. 사용자 입력에서 근거를 뽑아, 관계에서 실제로 어떻게 반응하는지 구조적으로 정리하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : null;
    const prompt = buildDetailPrompt(context, staticInstructions ?? undefined);
    const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

    console.log('\n========== [/api/analyze][detail] SYSTEM PROMPT ==========');
    console.log(system);
    console.log('\n========== [/api/analyze][detail] USER PROMPT ==========');
    console.log(prompt);
    console.log('========================================================\n');

    return callLLMJson<ResultDetailJson>(
        [{ role: 'user', content: prompt }],
        DETAIL_RESULT_SCHEMA,
        'love_pattern_detail_result',
        system,
        llmOpts,
    );
}

async function claimCoreGeneration(sessionId: string, resetDetail: boolean) {
    const supabase = createServerClient();
    const claimableStatuses = resetDetail ? ['idle', 'failed', 'completed'] : ['idle', 'failed'];

    const { data, error } = await supabase
        .from('sessions')
        .update({
            result_status: 'pending',
            result_error: null,
            ...(resetDetail
                ? {
                      result_detail: null,
                      result_detail_status: 'idle',
                      result_detail_error: null,
                  }
                : {}),
        })
        .eq('id', sessionId)
        .in('result_status', claimableStatuses)
        .select('id')
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}

async function claimDetailGeneration(sessionId: string) {
    const supabase = createServerClient();
    const { data, error } = await supabase
        .from('sessions')
        .update({ result_detail_status: 'pending', result_detail_error: null })
        .eq('id', sessionId)
        .in('result_detail_status', ['idle', 'failed'])
        .select('id')
        .maybeSingle();

    if (error) throw error;
    return Boolean(data);
}

export async function POST(request: NextRequest) {
    let sessionId: string | undefined;
    let mode: AnalyzeMode = 'core';

    try {
        const body = (await request.json()) as AnalyzeRequestBody;
        sessionId = body.sessionId;
        mode = body.mode ?? 'core';

        const ip = getClientIp(request);
        if (!checkRateLimit(`analyze:${mode}:${ip}`, 10)) {
            return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
        }

        // core 분석만 일일 횟수 제한 (실제 LLM 비용 발생 지점)
        if (mode === 'core') {
            const allowed = await checkAndIncrementDailyQuota(ip);
            if (!allowed) {
                return Response.json(
                    { error: '하루 검사 횟수(5회)를 초과했습니다. 내일 다시 시도해주세요.' },
                    { status: 429 },
                );
            }
        }

        const {
            chatHistory = [],
            ecrScores,
            userInfo,
            warmupAnswers = [],
            quizDetails = [],
            resetDetail = false,
        } = body;

        if (!sessionId) {
            return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const supabase = createServerClient();
        if (mode === 'detail') {
            const { data: sessionData, error: sessionError } = await supabase
                .from('sessions')
                .select(
                    'nickname, age, gender, ecr_anxiety, ecr_avoidance, attachment_type, chat_history, warmup_answers, quiz_details, result_detail, result_detail_status, result_detail_error',
                )
                .eq('id', sessionId)
                .single();

            if (sessionError) throw sessionError;

            if (sessionData?.result_detail_status === 'completed' && sessionData.result_detail) {
                return Response.json(sessionData.result_detail);
            }

            if (sessionData?.result_detail_status === 'pending') {
                return Response.json({ status: 'pending' }, { status: 202 });
            }

            const claimed = await claimDetailGeneration(sessionId);
            if (!claimed) {
                const { data: latestSession, error: latestError } = await supabase
                    .from('sessions')
                    .select('result_detail, result_detail_status, result_detail_error')
                    .eq('id', sessionId)
                    .single();

                if (latestError) throw latestError;
                if (latestSession.result_detail_status === 'completed' && latestSession.result_detail) {
                    return Response.json(latestSession.result_detail);
                }
                return Response.json(
                    { status: latestSession.result_detail_status, error: latestSession.result_detail_error },
                    { status: 202 },
                );
            }

            const detailContext = buildAnalysisContext(
                sessionData.chat_history ?? [],
                {
                    anxiety: sessionData.ecr_anxiety,
                    avoidance: sessionData.ecr_avoidance,
                    typeName: sessionData.attachment_type,
                },
                {
                    nickname: sessionData.nickname,
                    age: sessionData.age,
                    gender: sessionData.gender,
                },
                sessionData.warmup_answers ?? [],
                sessionData.quiz_details ?? [],
            );

            const detailResult = await buildDetailResult(detailContext);

            await supabase
                .from('sessions')
                .update({
                    result_detail: detailResult,
                    result_detail_status: 'completed',
                    result_detail_error: null,
                })
                .eq('id', sessionId);

            return Response.json(detailResult);
        }

        if (!ecrScores || !userInfo) {
            return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const { data: currentSession, error: currentSessionError } = await supabase
            .from('sessions')
            .select('result, result_status, result_error')
            .eq('id', sessionId)
            .single();

        if (currentSessionError) throw currentSessionError;

        if (!resetDetail && currentSession.result_status === 'completed' && currentSession.result) {
            return Response.json(currentSession.result);
        }

        if (currentSession.result_status === 'pending') {
            return Response.json({ status: 'pending' }, { status: 202 });
        }

        const claimed = await claimCoreGeneration(sessionId, resetDetail);
        if (!claimed) {
            const { data: latestSession, error: latestError } = await supabase
                .from('sessions')
                .select('result, result_status, result_error')
                .eq('id', sessionId)
                .single();

            if (latestError) throw latestError;
            if (latestSession.result_status === 'completed' && latestSession.result) {
                return Response.json(latestSession.result);
            }
            return Response.json(
                { status: latestSession.result_status, error: latestSession.result_error },
                { status: 202 },
            );
        }

        const context = buildAnalysisContext(chatHistory, ecrScores, userInfo, warmupAnswers, quizDetails);

        const coreResult = await buildCoreResult(context, ecrScores);

        await supabase
            .from('sessions')
            .update({
                result: coreResult,
                result_status: 'completed',
                result_error: null,
                consent: false,
                warmup_answers: warmupAnswers,
                quiz_details: quizDetails,
            })
            .eq('id', sessionId);

        return Response.json(coreResult);
    } catch (err) {
        console.error(`[/api/analyze][${mode}]`, err);
        const message = err instanceof Error ? err.message : String(err);
        if (mode === 'detail' && sessionId) {
            const supabase = createServerClient();
            await supabase
                .from('sessions')
                .update({ result_detail_status: 'failed', result_detail_error: message })
                .eq('id', sessionId);
        }
        if (mode === 'core' && sessionId) {
            const supabase = createServerClient();
            await supabase
                .from('sessions')
                .update({ result_status: 'failed', result_error: message })
                .eq('id', sessionId);
        }
        return Response.json({ error: '분석에 실패했습니다.', detail: message }, { status: 500 });
    }
}
