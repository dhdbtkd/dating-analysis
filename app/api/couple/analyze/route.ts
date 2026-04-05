import { callLLM } from '@/lib/llm';
import { getLlmConfig, assemblePromptParts } from '@/lib/llmConfig';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { CoupleAnalysis, SessionRow } from '@/types';

const DEFAULT_ANALYSIS: CoupleAnalysis = {
  summary: '두 사람의 애착 패턴이 분석되었습니다.',
  dynamics: '두 사람 사이에는 독특한 관계 역학이 존재합니다.',
  communicationTips: [
    '서로의 감정을 판단 없이 경청해보세요.',
    '감정을 표현할 때 "나" 메시지를 사용해보세요.',
    '갈등 상황에서 잠시 숨을 고르는 시간을 가져보세요.',
  ],
  growthSuggestions: [
    '서로의 애착 유형을 이해하고 존중하세요.',
    '안전한 공간을 만들어 취약함을 나눠보세요.',
    '함께 성장하는 활동을 찾아보세요.',
  ],
  compatibilityNote: '두 사람은 서로에게서 배울 점이 많은 조합입니다.',
};

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`couple:${ip}`, 5)) {
    return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
  }

  try {
    const body = await request.json() as { coupleId?: string };
    if (!body.coupleId) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('*, sender:sender_session_id(*), partner:partner_session_id(*)')
      .eq('id', body.coupleId)
      .single();

    if (coupleError || !couple) {
      return Response.json({ error: '커플 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const s1 = couple.sender as SessionRow;
    const s2 = couple.partner as SessionRow;

    if (!s1 || !s2) {
      return Response.json({ error: '두 사람의 검사가 모두 완료되지 않았습니다.' }, { status: 400 });
    }

    const dbConfig = await getLlmConfig('couple');
    const system = dbConfig?.system_prompt ??
      '당신은 커플 심리 분석 전문가입니다. 두 사람의 ECR 애착 점수와 유형을 바탕으로 관계 분석을 제공합니다. 반드시 JSON 형식으로만 응답하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : `아래 JSON 스키마로 정확히 응답하세요:
{
  "summary": "두 사람의 조합 요약 (200자 이내)",
  "dynamics": "관계 역학 설명 (200자 이내)",
  "communicationTips": ["대화 팁 1", "대화 팁 2", "대화 팁 3"],
  "growthSuggestions": ["성장 제안 1", "성장 제안 2", "성장 제안 3"],
  "compatibilityNote": "궁합 한 줄 평 (100자 이내)"
}`;
    const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

    const prompt = `두 사람의 애착 프로필:

1번: ${s1.nickname} (${s1.attachment_type})
   - 불안: ${s1.ecr_anxiety.toFixed(2)}, 회피: ${s1.ecr_avoidance.toFixed(2)}

2번: ${s2.nickname} (${s2.attachment_type})
   - 불안: ${s2.ecr_anxiety.toFixed(2)}, 회피: ${s2.ecr_avoidance.toFixed(2)}

${staticInstructions}`;

    let analysis: CoupleAnalysis = DEFAULT_ANALYSIS;
    try {
      const text = await callLLM([{ role: 'user', content: prompt }], system, llmOpts);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Partial<CoupleAnalysis>;
        analysis = {
          summary: typeof parsed.summary === 'string' ? parsed.summary : DEFAULT_ANALYSIS.summary,
          dynamics: typeof parsed.dynamics === 'string' ? parsed.dynamics : DEFAULT_ANALYSIS.dynamics,
          communicationTips: Array.isArray(parsed.communicationTips) ? parsed.communicationTips as string[] : DEFAULT_ANALYSIS.communicationTips,
          growthSuggestions: Array.isArray(parsed.growthSuggestions) ? parsed.growthSuggestions as string[] : DEFAULT_ANALYSIS.growthSuggestions,
          compatibilityNote: typeof parsed.compatibilityNote === 'string' ? parsed.compatibilityNote : DEFAULT_ANALYSIS.compatibilityNote,
        };
      }
    } catch {
      // use default
    }

    await supabase
      .from('couples')
      .update({ couple_analysis: analysis })
      .eq('id', body.coupleId);

    return Response.json(analysis);
  } catch {
    return Response.json({ error: '커플 분석에 실패했습니다.' }, { status: 500 });
  }
}
