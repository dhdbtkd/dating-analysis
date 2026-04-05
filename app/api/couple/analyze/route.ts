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

    function buildPersonContext(s: SessionRow): string {
      const likertLegend = '1=전혀 그렇지 않다 / 4=보통 / 7=매우 그렇다';

      const warmup = Array.isArray(s.warmup_answers) && s.warmup_answers.length > 0
        ? s.warmup_answers.map((a) => `  [${a.measures}] ${a.questionText}\n  → ${a.selectedText}`).join('\n')
        : '  없음';

      const quiz = Array.isArray(s.quiz_details) && s.quiz_details.length > 0
        ? s.quiz_details.map((q, i) => `  Q${i + 1}. ${q.questionText} → ${q.score}점`).join('\n')
        : '  없음';

      const chat = Array.isArray(s.chat_history) && s.chat_history.length > 0
        ? s.chat_history.map((m) => `  ${m.role === 'user' ? `${s.nickname}` : 'AI'}: ${m.content}`).join('\n')
        : '  없음';

      const typeName = (s.result as { typeName?: string } | null)?.typeName ?? s.attachment_type;

      return `[${s.nickname}님 — ${s.age}세, ${s.gender === 'female' ? '여성' : '남성'}]
유형: ${typeName}
ECR 불안: ${s.ecr_anxiety.toFixed(2)} / 회피: ${s.ecr_avoidance.toFixed(2)}

워밍업 응답:
${warmup}

ECR 척도 응답 (${likertLegend}):
${quiz}

심층 대화:
${chat}`;
    }

    const prompt = `아래는 두 사람의 상세 프로필입니다. 각자의 연애 패턴, 대화 내용, 척도 응답을 충분히 읽고 두 사람의 조합을 분석하세요.

${buildPersonContext(s1)}

────────────────────────

${buildPersonContext(s2)}

────────────────────────

분석 시 유의사항:
- 두 사람을 지칭할 때는 반드시 "${s1.nickname}님", "${s2.nickname}님"으로 이름을 사용하세요
- 두 사람의 나이대와 성별을 고려해 현실적인 언어로 분석하세요
- 일반론이 아닌, 위 대화와 응답에서 실제로 보이는 패턴만 근거로 삼으세요

${staticInstructions}`;

    console.log('\n========== [/api/couple/analyze] PROMPT ==========');
    console.log(prompt);
    console.log(`\n--- 컨텍스트 요약 ---`);
    console.log(`${s1.nickname}: 워밍업 ${s1.warmup_answers?.length ?? 0}개, 척도 ${s1.quiz_details?.length ?? 0}개, 대화 ${s1.chat_history?.length ?? 0}턴`);
    console.log(`${s2.nickname}: 워밍업 ${s2.warmup_answers?.length ?? 0}개, 척도 ${s2.quiz_details?.length ?? 0}개, 대화 ${s2.chat_history?.length ?? 0}턴`);
    console.log('====================================================\n');

    const DEFAULT_ANALYSIS = buildDefaultAnalysis(s1.nickname, s2.nickname);
    let analysis: CoupleAnalysis = DEFAULT_ANALYSIS;
    try {
      const text = await callLLM([{ role: 'user', content: prompt }], system, llmOpts);
      console.log('\n========== [/api/couple/analyze] LLM RAW RESPONSE ==========');
      console.log(text);
      console.log('=============================================================\n');

      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error('[/api/couple/analyze] JSON 추출 실패 — 정규식 매칭 안 됨');
      } else {
        try {
          const parsed = JSON.parse(match[0]) as Partial<CoupleAnalysis>;
          console.log('[/api/couple/analyze] JSON 파싱 성공:', JSON.stringify(parsed, null, 2));
          analysis = {
            summary: typeof parsed.summary === 'string' ? parsed.summary : DEFAULT_ANALYSIS.summary,
            conflictPattern: typeof parsed.conflictPattern === 'string' ? parsed.conflictPattern : DEFAULT_ANALYSIS.conflictPattern,
            eachPersonsCore: Array.isArray(parsed.eachPersonsCore) ? parsed.eachPersonsCore as { name: string; core: string }[] : DEFAULT_ANALYSIS.eachPersonsCore,
            coupleStrengths: typeof parsed.coupleStrengths === 'string' ? parsed.coupleStrengths : DEFAULT_ANALYSIS.coupleStrengths,
            communicationTips: Array.isArray(parsed.communicationTips) ? parsed.communicationTips as string[] : DEFAULT_ANALYSIS.communicationTips,
            crisisScript: typeof parsed.crisisScript === 'string' ? parsed.crisisScript : DEFAULT_ANALYSIS.crisisScript,
            compatibilityNote: typeof parsed.compatibilityNote === 'string' ? parsed.compatibilityNote : DEFAULT_ANALYSIS.compatibilityNote,
          };
        } catch (parseError) {
          console.error('[/api/couple/analyze] JSON.parse 실패:', parseError);
          console.error('파싱 시도한 문자열:', match[0].slice(0, 500));
        }
      }
    } catch (llmError) {
      console.error('[/api/couple/analyze] LLM 호출 실패:', llmError);
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
