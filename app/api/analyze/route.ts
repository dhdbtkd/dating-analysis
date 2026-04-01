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

        const system = `당신은 심리 분석 전문가입니다. 아래 데이터를 바탕으로 사용자의 연애 패턴을 분석하세요. 결과는 추상적 성격 평가가 아니라, 관계 안에서 반복되는 행동 패턴 중심으로 설명하세요.`;

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

출력 형식:
JSON 객체 하나만 반환

각 필드 작성 지침:
- typeName: 유형명
- tagline: 한 줄 저격 문장 (50자 이내)
- lovePattern: 연애 패턴 설명 (300자 이내)
- coreWound: 핵심 상처/공포 (100자 이내)
- actionTip: 오늘 바로 할 수 있는 구체적 행동 3가지 배열
- mindset: 마인드셋 전환 문장 (150자 이내)
- anxietyScore: ${ecrScores.anxiety.toFixed(1)}
- avoidanceScore: ${ecrScores.avoidance.toFixed(1)}
- emotionalIntensity: 불안 점수 기반 — 3.5 미만=낮음 / 3.5~4.5=중간 / 4.5 초과=높음
- distanceTendency: 회피 점수 기반 — 3.5 미만=낮음 / 3.5~4.5=중간 / 4.5 초과=높음

중요 원칙:
1. 결과는 "이 사람이 어떤 사람인지" 규정하지 말고, "관계에서 어떤 반응과 행동을 반복하는지"를 설명할 것
2. 특히 tagline은 성격 정의 문장이 아니라, 사용자의 연애 상황에서 드러나는 반복 행동 패턴을 한 줄로 찌를 것
3. tagline의 행동 주체는 반드시 사용자 본인이다. 상대가 아니라 사용자가 하는 행동만 써라
4. 주어가 헷갈리는 표현 금지. 상대도 될 수 있는 문장 금지
5. "~한 사람", "~한 타입", "~한 성향" 같은 정체성 낙인 표현 금지
6. "빠져나간다, 멀어진다, 거리를 둔다" 같은 표현은 반드시 사용자가 그렇게 행동한다는 뜻으로만 읽히게 쓸 것
7. 모호한 생략형 금지. 필요하면 "먼저", "스스로", "내가" 같은 말로 주체를 고정할 것
8. 문장은 분석문 말투가 아니라, 사용자가 읽자마자 "내 얘기다" 싶게 써라
9. 어려운 심리학 용어, 논문 말투, 상담사 말투 금지
10. 점수가 경계값(3.5~4.5)이면 한쪽으로 단정하지 말고, 끌리면서도 물러나는 혼합 패턴으로 표현할 것
11. 동일 유형이어도 점수 강도와 대화 내용에 따라 결과 톤과 강도를 완전히 다르게 만들 것

필드별 세부 규칙:

[typeName]
- 흔한 애착유형 이름 그대로 쓰지 말 것
- 이 사람의 점수와 대화 내용에서 드러난 특징을 바탕으로, 이해 쉬운 생활 언어로 만들 것
- 추상적이거나 뻔한 이름 금지

[tagline]
- 50자 이내
- 사용자의 연애 '행동 패턴'만 써라
- 상대 행동처럼 읽힐 수 있는 문장 금지
- 성격 평가처럼 읽히는 문장 금지
- 설명형 문장보다 직격형 문장 우선
- 접속사 남발 금지
- 좋은 예:
  - 가까워질수록, 먼저 거리를 둔다
  - 불안해질수록, 확인보다 눈치부터 본다
  - 붙잡고 싶지만, 표현 대신 혼자 버틴다
- 나쁜 예:
  - 가까움을 원하지만, 빠져나간다
  - 다가가다가 멈춘다
  - 상처받기 싫어하는 사람
  - 사랑이 두려운 타입

[lovePattern]
- 300자 이내
- "당신은"으로 시작 금지
- 관계 장면이 보이게 쓸 것
- 추상 설명보다 실제 관계 흐름이 느껴지게 작성
- 예: "처음엔 마음을 열고 싶어 하다가도, 상대가 예상보다 빨리 들어오면 속도를 줄이고 혼자 정리할 시간을 만든다"

[coreWound]
- 100자 이내
- 가장 깊은 두려움을 짧고 강하게
- 논문 말투 금지
- 예: "기대했다가 실망하는 순간이 누구보다 무섭다"

[actionTip]
- 배열 3개
- 오늘 당장 할 수 있는 행동만
- 추상 조언 금지
- 예:
  1. 서운할 때 잠수 대신 한 문장만 먼저 보내기
  2. 답장 해석하기 전에 사실과 추측을 따로 적기
  3. 관계가 버거울 때 이유 없이 거리 두지 말고 하루만 시간이 필요하다고 말하기

[mindset]
- 150자 이내
- 한 문장
- 위로보다 전환
- 예: "가까워진다고 해서 휘둘리는 게 아니라, 불편함을 말할 수 있어야 비로소 관계를 내가 선택하게 된다"

최종 점검:
- tagline의 주체가 누구인지 헷갈리면 다시 쓸 것
- tagline이 행동이 아니라 성격처럼 읽히면 다시 쓸 것
- 상대 행동으로도 해석 가능하면 다시 쓸 것
- 모든 문장은 사용자의 실제 관계 패턴을 찌르는 방향으로 작성할 것`;

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
        await supabase
            .from('sessions')
            .update({
                result,
                consent: false,
                warmup_answers: warmupAnswers,
                quiz_details: quizDetails,
            })
            .eq('id', sessionId);

        return Response.json(result);
    } catch (err) {
        console.error('[/api/analyze]', err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: '분석에 실패했습니다.', detail: message }, { status: 500 });
    }
}
