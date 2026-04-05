import { callLLM } from '@/lib/llm';
import { getLlmConfig, assemblePromptParts } from '@/lib/llmConfig';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { CoupleAnalysis, SessionRow } from '@/types';

function buildDefaultAnalysis(n1: string, n2: string): CoupleAnalysis {
  return {
    summary: `${n1}님과 ${n2}님의 애착 패턴이 분석되었습니다.`,
    conflictPattern: '두 사람 사이에 반복되는 갈등 패턴이 있을 수 있습니다.',
    eachPersonsCore: [
      { name: n1, core: '관계에서 안정감을 원합니다.' },
      { name: n2, core: '관계에서 안정감을 원합니다.' },
    ],
    coupleStrengths: '두 사람은 서로에게서 배울 점이 많은 조합입니다.',
    communicationTips: [
      `${n1}님에게: 감정을 솔직하게 표현해보세요.`,
      `${n2}님에게: 상대의 감정에 귀 기울여보세요.`,
      '두 사람 함께: 갈등 시 잠시 숨을 고르는 시간을 가져보세요.',
    ],
    crisisScript: '지금 나 좀 힘든데, 잠깐 얘기할 수 있어?',
    compatibilityNote: '두 사람은 함께 성장할 수 있는 조합입니다.',
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`couple:${ip}`, 5)) {
    return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
  }

  try {
    const body = await request.json() as { coupleId?: string; force?: boolean };
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

    // Return cached analysis if already generated (skip if force regenerate)
    if (couple.couple_analysis && !body.force) {
      return Response.json(couple.couple_analysis);
    }

    const dbConfig = await getLlmConfig('couple');
    const system = dbConfig?.system_prompt ??
      '당신은 커플 심리 분석 전문가입니다. 두 사람의 ECR 애착 점수와 유형을 바탕으로 관계 분석을 제공합니다. 반드시 JSON 형식으로만 응답하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : `아래 JSON 스키마로 정확히 응답하세요. 모든 필드는 한국어로 작성하고, 두 사람을 지칭할 때는 반드시 이름을 사용하세요:
{
  "summary": "이 조합을 한 문장으로 — 두 사람의 이름을 써서 (150자 이내)",
  "conflictPattern": "이 조합에서 반복되는 갈등 시나리오를 구체적으로 묘사. '맞아 우리 이래'라고 느낄 만큼 생생하게 (200자 이내)",
  "eachPersonsCore": [
    { "name": "${s1.nickname}", "core": "${s1.nickname}님이 관계에서 진짜 원하는 것, 무의식적 욕구 (100자 이내)" },
    { "name": "${s2.nickname}", "core": "${s2.nickname}님이 관계에서 진짜 원하는 것, 무의식적 욕구 (100자 이내)" }
  ],
  "coupleStrengths": "이 조합만의 고유한 강점 — 이 두 사람이기에 가능한 것 (150자 이내)",
  "communicationTips": [
    "${s1.nickname}에게: 구체적이고 실천 가능한 조언",
    "${s2.nickname}에게: 구체적이고 실천 가능한 조언",
    "두 사람 함께: 구체적이고 실천 가능한 조언"
  ],
  "crisisScript": "싸웠을 때 실제로 쓸 수 있는 말 한 마디. 자연스러운 구어체로 (70자 이내)",
  "compatibilityNote": "이 조합의 핵심을 꿰뚫는 한 줄 (100자 이내)"
}`;
    const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

    const prompt = `두 사람의 애착 프로필:

${s1.nickname}님 (${s1.attachment_type})
   - 불안: ${s1.ecr_anxiety.toFixed(2)}, 회피: ${s1.ecr_avoidance.toFixed(2)}

${s2.nickname}님 (${s2.attachment_type})
   - 불안: ${s2.ecr_anxiety.toFixed(2)}, 회피: ${s2.ecr_avoidance.toFixed(2)}

분석 결과에서 두 사람을 지칭할 때는 반드시 "${s1.nickname}님", "${s2.nickname}님"으로 이름을 사용하세요. 숫자나 "1번", "2번" 표현을 사용하지 마세요.

${staticInstructions}`;

    const DEFAULT_ANALYSIS = buildDefaultAnalysis(s1.nickname, s2.nickname);
    let analysis: CoupleAnalysis = DEFAULT_ANALYSIS;
    try {
      const text = await callLLM([{ role: 'user', content: prompt }], system, llmOpts);
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Partial<CoupleAnalysis>;
        analysis = {
          summary: typeof parsed.summary === 'string' ? parsed.summary : DEFAULT_ANALYSIS.summary,
          conflictPattern: typeof parsed.conflictPattern === 'string' ? parsed.conflictPattern : DEFAULT_ANALYSIS.conflictPattern,
                eachPersonsCore: Array.isArray(parsed.eachPersonsCore) ? parsed.eachPersonsCore as { name: string; core: string }[] : DEFAULT_ANALYSIS.eachPersonsCore,
          coupleStrengths: typeof parsed.coupleStrengths === 'string' ? parsed.coupleStrengths : DEFAULT_ANALYSIS.coupleStrengths,
          communicationTips: Array.isArray(parsed.communicationTips) ? parsed.communicationTips as string[] : DEFAULT_ANALYSIS.communicationTips,
          crisisScript: typeof parsed.crisisScript === 'string' ? parsed.crisisScript : DEFAULT_ANALYSIS.crisisScript,
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
