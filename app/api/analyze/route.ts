import { callLLM } from '@/lib/llm';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { ChatMessage, ResultJson } from '@/types';

interface AnalyzeRequestBody {
  sessionId?: string;
  chatHistory?: ChatMessage[];
  ecrScores?: { anxiety: number; avoidance: number; typeName: string };
  userInfo?: { nickname: string; age: number; gender: string };
}

const DEFAULT_RESULT: ResultJson = {
  typeName: '탐색 중인 연인',
  tagline: '아직 나의 패턴을 찾아가는 중',
  lovePattern: '연애에서 자신만의 패턴을 형성하는 과정에 있습니다.',
  coreWound: '아직 명확히 드러나지 않은 내면의 욕구가 있습니다.',
  actionTip: ['자신의 감정에 귀 기울이기', '파트너와 솔직한 대화 시도하기', '연애 일기 써보기'],
  mindset: '지금 이 순간의 나도 충분히 괜찮습니다.',
  quote: '나 자신을 이해하는 것이 사랑의 첫 걸음입니다.',
  famousMatch: '헤르미온느 그레인저 — 이성과 감성의 균형을 찾아가는 중',
  anxietyScore: 0,
  avoidanceScore: 0,
};

function parseResultJson(text: string, anxiety: number, avoidance: number): ResultJson {
  let parsed: Partial<ResultJson> | null = null;

  // Try direct JSON parse
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]) as Partial<ResultJson>;
    }
  } catch {
    // ignore
  }

  if (!parsed) return { ...DEFAULT_RESULT, anxietyScore: anxiety, avoidanceScore: avoidance };

  return {
    typeName: typeof parsed.typeName === 'string' ? parsed.typeName : DEFAULT_RESULT.typeName,
    tagline: typeof parsed.tagline === 'string' ? parsed.tagline : DEFAULT_RESULT.tagline,
    lovePattern: typeof parsed.lovePattern === 'string' ? parsed.lovePattern : DEFAULT_RESULT.lovePattern,
    coreWound: typeof parsed.coreWound === 'string' ? parsed.coreWound : DEFAULT_RESULT.coreWound,
    actionTip: Array.isArray(parsed.actionTip) ? parsed.actionTip as string[] : DEFAULT_RESULT.actionTip,
    mindset: typeof parsed.mindset === 'string' ? parsed.mindset : DEFAULT_RESULT.mindset,
    quote: typeof parsed.quote === 'string' ? parsed.quote : DEFAULT_RESULT.quote,
    famousMatch: typeof parsed.famousMatch === 'string' ? parsed.famousMatch : DEFAULT_RESULT.famousMatch,
    anxietyScore: anxiety,
    avoidanceScore: avoidance,
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`analyze:${ip}`, 10)) {
    return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
  }

  try {
    const body = await request.json() as AnalyzeRequestBody;
    const { sessionId, chatHistory = [], ecrScores, userInfo } = body;

    if (!sessionId || !ecrScores || !userInfo) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const conversationText = chatHistory
      .map((m) => `${m.role === 'user' ? '사용자' : 'AI'}: ${m.content}`)
      .join('\n');

    const system = `당신은 심리 분석 전문가입니다. 아래 대화와 ECR 점수를 바탕으로 사용자의 연애 패턴을 분석하고 정확히 아래 JSON 형식으로만 응답하세요. JSON 이외의 텍스트는 절대 포함하지 마세요.`;

    const prompt = `사용자 정보:
- 이름: ${userInfo.nickname}, 나이: ${userInfo.age}세
- ECR 불안 점수: ${ecrScores.anxiety.toFixed(2)} (1~7)
- ECR 회피 점수: ${ecrScores.avoidance.toFixed(2)} (1~7)
- 애착 유형: ${ecrScores.typeName}

심층 대화:
${conversationText}

아래 JSON 스키마로 정확히 응답하세요:
{
  "typeName": "감성적 유형명 (예: '소용돌이 속의 별', '침묵의 성채' 등 창의적으로)",
  "tagline": "한 줄 저격 문장 (50자 이내)",
  "lovePattern": "연애 패턴 설명 (200자 이내)",
  "coreWound": "핵심 상처/공포 (100자 이내)",
  "actionTip": ["구체적 행동 지침 1", "구체적 행동 지침 2", "구체적 행동 지침 3"],
  "mindset": "마인드셋 전환 문장 (100자 이내)",
  "quote": "대화 중 인상적인 사용자 발언 직접 인용 또는 유형 대표 인용구",
  "famousMatch": "유명인/캐릭터 이름 + 한 줄 설명",
  "anxietyScore": ${ecrScores.anxiety},
  "avoidanceScore": ${ecrScores.avoidance}
}`;

    const text = await callLLM([{ role: 'user', content: prompt }], system);
    const result = parseResultJson(text, ecrScores.anxiety, ecrScores.avoidance);

    const supabase = createServerClient();
    await supabase
      .from('sessions')
      .update({ result, consent: false })
      .eq('id', sessionId);

    return Response.json(result);
  } catch {
    return Response.json({ error: '분석에 실패했습니다.' }, { status: 500 });
  }
}
