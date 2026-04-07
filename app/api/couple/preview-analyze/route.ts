import { callLLM } from '@/lib/llm';
import { getLlmConfig, assemblePromptParts } from '@/lib/llmConfig';
import type { NextRequest } from 'next/server';
import type { CoupleAnalysis, SessionRow } from '@/types';

const DEFAULT_ANALYSIS = (n1: string, n2: string): CoupleAnalysis => ({
  summary: `${n1}님과 ${n2}님의 애착 패턴이 분석되었습니다.`,
  conflictPattern: '두 분의 갈등 패턴을 분석 중입니다.',
  eachPersonsCore: [
    { name: n1, core: '관계에서 안정감을 원합니다.' },
    { name: n2, core: '관계에서 안정감을 원합니다.' },
  ],
  coupleStrengths: '두 분은 서로에게서 배울 점이 많은 조합입니다.',
  communicationTips: ['서로의 감정을 경청해주세요.', '취약함을 나눠보세요.', '갈등 시 잠시 쉬어가세요.'],
  crisisScript: '지금 나 좀 힘든데, 잠깐 얘기할 수 있어?',
  compatibilityNote: '두 분은 서로에게서 배울 점이 많은 조합입니다.',
});

function buildPersonContext(s: SessionRow): string {
  const likertLegend = '1=전혀 그렇지 않다 / 4=보통 / 7=매우 그렇다';

  const warmup = Array.isArray(s.warmup_answers) && s.warmup_answers.length > 0
    ? s.warmup_answers.map((a) => `  [${a.measures}] ${a.questionText}\n  → ${a.selectedText}`).join('\n')
    : '  없음';

  const quiz = Array.isArray(s.quiz_details) && s.quiz_details.length > 0
    ? s.quiz_details.map((q, i) => `  Q${i + 1}. ${q.questionText} → ${q.score}점`).join('\n')
    : '  없음';

  const chat = Array.isArray(s.chat_history) && s.chat_history.length > 0
    ? s.chat_history.map((m) => `  ${m.role === 'user' ? s.nickname : 'AI'}: ${m.content}`).join('\n')
    : '  없음';

  const typeName = (s.result as { typeName?: string } | null)?.typeName ?? s.attachment_type;

  const extScores = [
    s.score_trust != null ? `신뢰: ${s.score_trust.toFixed(2)}` : null,
    s.score_self_disclosure != null ? `자기개방성: ${s.score_self_disclosure.toFixed(2)}` : null,
    s.score_conflict != null ? `갈등 건강도: ${s.score_conflict.toFixed(2)}` : null,
    s.score_rel_self_esteem != null ? `관계 자존감: ${s.score_rel_self_esteem.toFixed(2)}` : null,
  ].filter(Boolean).join(' / ');

  return `[${s.nickname}님 — ${s.age}세, ${s.gender === 'female' ? '여성' : '남성'}]
유형: ${typeName}
ECR 불안: ${s.ecr_anxiety.toFixed(2)} / 회피: ${s.ecr_avoidance.toFixed(2)}${extScores ? ` / ${extScores}` : ''}

워밍업 응답:
${warmup}

ECR 척도 응답 (${likertLegend}):
${quiz}

심층 대화:
${chat}`;
}

export async function POST(request: NextRequest) {
  try {
    const { session1, session2 } = await request.json() as { session1: SessionRow; session2: SessionRow };

    if (!session1 || !session2) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const dbConfig = await getLlmConfig('couple');
    const system = dbConfig?.system_prompt ??
      '당신은 커플 심리 분석 전문가입니다. 두 사람의 ECR 애착 점수와 유형을 바탕으로 관계 분석을 제공합니다. 반드시 JSON 형식으로만 응답하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : '';
    const llmOpts = dbConfig ? { provider: dbConfig.provider, model: dbConfig.model } : undefined;

    const prompt = `아래는 두 사람의 상세 프로필입니다. 각자의 연애 패턴, 대화 내용, 척도 응답을 충분히 읽고 두 사람의 조합을 분석하세요.

${buildPersonContext(session1)}

────────────────────────

${buildPersonContext(session2)}

────────────────────────

분석 시 유의사항:
- 두 사람을 지칭할 때는 반드시 "${session1.nickname}님", "${session2.nickname}님"으로 이름을 사용하세요
- 두 사람의 나이대와 성별을 고려해 현실적인 언어로 분석하세요
- 일반론이 아닌, 위 대화와 응답에서 실제로 보이는 패턴만 근거로 삼으세요
- 불안·회피뿐 아니라 신뢰·자기개방성·갈등 건강도·관계 자존감 점수도 반드시 반영하세요
- ECR 문항 인용 시 Q번호 표기 금지, 행동 패턴을 자연어로 풀어쓸 것

${staticInstructions}`;

    const DEF = DEFAULT_ANALYSIS(session1.nickname, session2.nickname);
    let analysis: CoupleAnalysis = DEF;

    const text = await callLLM([{ role: 'user', content: prompt }], system, llmOpts);
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]) as Partial<CoupleAnalysis>;
      analysis = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : DEF.summary,
        conflictPattern: typeof parsed.conflictPattern === 'string' ? parsed.conflictPattern : DEF.conflictPattern,
        eachPersonsCore: Array.isArray(parsed.eachPersonsCore) ? parsed.eachPersonsCore as { name: string; core: string }[] : DEF.eachPersonsCore,
        coupleStrengths: typeof parsed.coupleStrengths === 'string' ? parsed.coupleStrengths : DEF.coupleStrengths,
        communicationTips: Array.isArray(parsed.communicationTips) ? parsed.communicationTips as string[] : DEF.communicationTips,
        crisisScript: typeof parsed.crisisScript === 'string' ? parsed.crisisScript : DEF.crisisScript,
        compatibilityNote: typeof parsed.compatibilityNote === 'string' ? parsed.compatibilityNote : DEF.compatibilityNote,
        axisGaps: Array.isArray(parsed.axisGaps) ? parsed.axisGaps as { axis: string; gap: string }[] : undefined,
        growthEdge: typeof parsed.growthEdge === 'string' ? parsed.growthEdge : undefined,
        coreFearsCollision: typeof parsed.coreFearsCollision === 'string' ? parsed.coreFearsCollision : undefined,
        redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags as string[] : undefined,
      };
    }

    return Response.json(analysis);
  } catch (err) {
    console.error('[/api/couple/preview-analyze]', err);
    return Response.json({ error: '분석 생성에 실패했습니다.' }, { status: 500 });
  }
}
