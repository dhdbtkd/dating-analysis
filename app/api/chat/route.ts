import { callLLMStream } from '@/lib/llm';
import { getLlmConfig, injectUserContext } from '@/lib/llmConfig';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { NextRequest } from 'next/server';
import type { ChatMessage, WarmupAnswer, QuizDetail } from '@/types';

interface ChatRequestBody {
    messages?: ChatMessage[];
    ecrScores?: { anxiety: number; avoidance: number; typeName: string };
    userInfo?: { nickname: string; age: number; gender: string };
    warmupAnswers?: WarmupAnswer[];
    quizDetails?: QuizDetail[];
}

export async function POST(request: NextRequest) {
    const ip = getClientIp(request);
    if (!checkRateLimit(`chat:${ip}`, 20)) {
        return Response.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = (await request.json()) as ChatRequestBody;
        const { messages = [], ecrScores, userInfo, warmupAnswers = [], quizDetails = [] } = body;

        if (!ecrScores || !userInfo) {
            return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
        }

        const LIKERT_LEGEND =
            '응답 척도: 1=전혀 그렇지 않다 / 2=그렇지 않다 / 3=약간 그렇지 않다 / 4=보통 / 5=약간 그렇다 / 6=그렇다 / 7=매우 그렇다';

        const warmupSummary = warmupAnswers
            .map((a) => `[측정: ${a.measures}]\n질문: ${a.questionText}\n답변: ${a.selectedText}`)
            .join('\n\n');

        const quizSummary = quizDetails
            .map((q, i) => `Q${i + 1}. ${q.questionText}\n선택한 점수: ${q.score}`)
            .join('\n\n');

        const userContext = `사용자 정보:
- 이름: ${userInfo.nickname}, 나이: ${userInfo.age}세, 성별: ${userInfo.gender}
- ECR 불안 점수: ${ecrScores.anxiety.toFixed(2)} / 7
- ECR 회피 점수: ${ecrScores.avoidance.toFixed(2)} / 7

워밍업 응답:
${warmupSummary || '없음'}

ECR 척도 응답 (${LIKERT_LEGEND}):
${quizSummary || '없음'}`;

        const dbConfig = await getLlmConfig('chat');
        const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

        const system = dbConfig
            ? injectUserContext(dbConfig.system_prompt, userContext)
            : `당신은 공감 능력이 뛰어난 심리 상담사입니다. 사용자의 연애 애착 패턴을 깊이 탐색하는 대화를 진행합니다.

${userContext}

대화 지침:
- 한국어로 대화합니다
- 친구처럼 친근하고 따뜻한 말투로 대화합니다
- 사용자의 직전 답변에서 감정적으로 의미 있는 단어나 표현을 반드시 다음 질문에 반영합니다 (예: 사용자가 "답답했어요"라고 하면 "그 답답함이 어디서 왔는지" 를 파고드는 방식)
- 일반적인 질문이 아닌, 방금 사용자가 한 말에서 출발하는 질문을 합니다
- ECR 척도와 워밍업 응답에서 드러난 패턴을 은연중에 탐색하되, 직접 언급하지 않습니다
- 6턴 구조를 따릅니다:
  - 1~2번째 질문: 최근 연애 경험 — 구체적인 장면이나 감정을 끌어냅니다
  - 3~4번째 질문: 반복되는 행동 패턴 — 사용자 스스로 패턴을 발견하게 유도합니다
  - 5번째 질문: 그 패턴의 기원 — 원가족 또는 첫 연애 경험으로 자연스럽게 연결합니다
  - 6번째 질문: 변화와 비전 — "그럼에도 원하는 관계"를 스스로 말하게 합니다
- 판단하지 않고 공감 → 반영 → 질문 순서로 응답합니다
- 질문은 하나씩만 합니다
- 200자 이내로 응답합니다`;

        console.log('\n========== [/api/chat] SYSTEM PROMPT ==========');
        console.log(system);
        console.log('\n========== [/api/chat] MESSAGES ==========');
        console.log(JSON.stringify(messages, null, 2));
        console.log('===========================================\n');

        const stream = await callLLMStream(messages, system, llmOpts);
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (err) {
        console.error('[/api/chat]', err);
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ error: '응답 생성에 실패했습니다.', detail: message }, { status: 500 });
    }
}
