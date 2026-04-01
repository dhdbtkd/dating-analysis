import { callLLMJson } from '@/lib/llm';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { ChatMessage, ResultJson, WarmupAnswer, QuizDetail } from '@/types';

interface AnalyzeRequestBody {
    sessionId?: string;
    chatHistory?: ChatMessage[];
    ecrScores?: { anxiety: number; avoidance: number; typeName: string };
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
    if (score <= 4.5) return `경계값 — 혼합 양상 가능성 높음`;
    return `평균보다 높음 (${labels.high})`;
}

const RESULT_SCHEMA = {
    type: 'object',
    properties: {
        typeName: { type: 'string' },
        tagline: { type: 'string' },
        lovePattern: { type: 'string' },
        coreWound: { type: 'string' },
        actionTip: { type: 'array', items: { type: 'string' } },
        mindset: { type: 'string' },
        emotionalIntensity: { type: 'string', enum: ['낮음', '중간', '높음'] },
        distanceTendency: { type: 'string', enum: ['낮음', '중간', '높음'] },
    },
    required: [
        'typeName',
        'tagline',
        'lovePattern',
        'coreWound',
        'actionTip',
        'mindset',
        'emotionalIntensity',
        'distanceTendency',
    ],
    additionalProperties: false,
};

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    if (!checkRateLimit(`analyze:${ip}`, 10)) {
        return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
    }

    try {
        const body = (await request.json()) as AnalyzeRequestBody;
        const { sessionId, chatHistory = [], ecrScores, userInfo, warmupAnswers = [], quizDetails = [] } = body;

        if (!sessionId || !ecrScores || !userInfo) {
            return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const LIKERT_LEGEND =
            '1=전혀 그렇지 않다 / 2=그렇지 않다 / 3=약간 그렇지 않다 / 4=보통 / 5=약간 그렇다 / 6=그렇다 / 7=매우 그렇다';

        const warmupSummary = warmupAnswers
            .map((a) => `[측정: ${a.measures}]\n질문: ${a.questionText}\n답변: ${a.selectedText}`)
            .join('\n\n');

        const quizSummary = quizDetails
            .map((q, i) => `Q${i + 1}. ${q.questionText}\n선택한 점수: ${q.score}`)
            .join('\n\n');

        const conversationText = chatHistory
            .map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
            .join('\n');

        const system = `당신은 심리 분석 전문가입니다. 아래 데이터를 바탕으로 사용자의 연애 패턴을 분석하세요.`;

        const prompt = `사용자 정보:
- 이름: ${userInfo.nickname}, 나이: ${userInfo.age}세
- ECR 불안 점수: ${ecrScores.anxiety.toFixed(2)} → ${interpretScore(ecrScores.anxiety, 'anxiety')}
- ECR 회피 점수: ${ecrScores.avoidance.toFixed(2)} → ${interpretScore(ecrScores.avoidance, 'avoidance')}

워밍업 응답:
${warmupSummary || '없음'}

ECR 척도 응답 (${LIKERT_LEGEND}):
${quizSummary || '없음'}

심층 대화:
${conversationText}

각 필드 작성 지침:
작성 지침:
- typeName: 감성적 유형명 (예: '소용돌이 속의 별', '침묵의 성채' 등 창의적으로) — 동일 점수대라도 반드시 이 사람만의 고유한 이름으로
- tagline: 한 줄 저격 문장 (50자 이내)
- lovePattern: 연애 패턴 설명 (300자 이내)
- coreWound: 핵심 상처/공포 (200자 이내)
- actionTip: 구체적 행동 지침 3가지 배열
- mindset: 마인드셋 전환 문장 (150자 이내)
- anxietyScore: ${ecrScores.anxiety.toFixed(1)}
- avoidanceScore: ${ecrScores.avoidance.toFixed(1)}
- emotionalIntensity: 불안 점수 기반 — 3.5 미만=낮음 / 3.5~4.5=중간 / 4.5 초과=높음
- distanceTendency: 회피 점수 기반 — 3.5 미만=낮음 / 3.5~4.5=중간 / 4.5 초과=높음

주의사항:
- 일반적인 유형 설명 금지 — 이 사람의 점수와 대화 내용에서만 도출할 것
- 경계값(3.5~4.5) 점수는 반드시 혼합형 양상으로 표현할 것
- 동일 유형이어도 점수 강도가 다르면 완전히 다른 결과를 생성할 것`;

        console.log('\n========== [/api/analyze] SYSTEM PROMPT ==========');
        console.log(system);
        console.log('\n========== [/api/analyze] USER PROMPT ==========');
        console.log(prompt);
        console.log('===================================================\n');

        const llmResult = await callLLMJson<Omit<ResultJson, 'anxietyScore' | 'avoidanceScore'>>(
            [{ role: 'user', content: prompt }],
            RESULT_SCHEMA,
            'love_pattern_result',
            system,
        );
        const result: ResultJson = {
            ...llmResult,
            anxietyScore: Math.round(ecrScores.anxiety * 10) / 10,
            avoidanceScore: Math.round(ecrScores.avoidance * 10) / 10,
        };

        const supabase = createServerClient();
        await supabase.from('sessions').update({ result, consent: false }).eq('id', sessionId);

        return Response.json(result);
    } catch (err) {
        console.error('[/api/analyze]', err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: '분석에 실패했습니다.', detail: message }, { status: 500 });
    }
}
