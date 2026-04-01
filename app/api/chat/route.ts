import { callLLM } from '@/lib/llm';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { NextRequest } from 'next/server';
import type { ChatMessage, WarmupAnswer } from '@/types';

interface ChatRequestBody {
  messages?: ChatMessage[];
  ecrScores?: { anxiety: number; avoidance: number; typeName: string };
  userInfo?: { nickname: string; age: number; gender: string };
  warmupAnswers?: WarmupAnswer[];
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`chat:${ip}`, 20)) {
    return Response.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
  }

  try {
    const body = await request.json() as ChatRequestBody;
    const { messages = [], ecrScores, userInfo, warmupAnswers = [] } = body;

    if (!ecrScores || !userInfo) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const warmupSummary = warmupAnswers
      .map((a) => `- ${a.questionId}: ${a.selectedLabel}번 (${a.selectedText})`)
      .join('\n');

    const system = `당신은 공감 능력이 뛰어난 심리 상담사입니다. 사용자의 연애 애착 패턴을 깊이 탐색하는 대화를 진행합니다.

사용자 정보:
- 이름: ${userInfo.nickname}, 나이: ${userInfo.age}세, 성별: ${userInfo.gender}
- ECR 불안 점수: ${ecrScores.anxiety.toFixed(2)} / 7
- ECR 회피 점수: ${ecrScores.avoidance.toFixed(2)} / 7
- 애착 유형: ${ecrScores.typeName}

워밍업 응답:
${warmupSummary || '없음'}

대화 지침:
- 한국어로 대화합니다
- 6턴 구조를 따릅니다:
  - 1~2번째 질문: 최근 연애 경험 탐색
  - 3~4번째 질문: 반복 패턴 / 회피 또는 집착 행동 탐색
  - 5번째 질문: 원가족 / 초기 애착 경험 탐색
  - 6번째 질문: 변화 가능성 / 이상적 연애 비전
- 판단하지 않고 공감하며 질문합니다
- 질문은 하나씩만 합니다
- 200자 이내로 응답합니다
- 현재 몇 번째 질문인지 파악하고 그에 맞는 내용을 다룹니다`;

    const message = await callLLM(messages, system);
    return Response.json({ message });
  } catch {
    return Response.json({ error: '응답 생성에 실패했습니다.' }, { status: 500 });
  }
}
