import { callLLM } from '@/lib/llm';
import { getLlmConfig, assemblePromptParts } from '@/lib/llmConfig';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { CoupleAnalysis, SessionRow } from '@/types';

function buildDefaultAnalysis(n1: string, n2: string): CoupleAnalysis {
  return {
    summary: `${n1}님은 거리를 두며 자신을 지키려 하고, ${n2}님은 가까워지고 싶은 마음이 강해요. 서로 다른 방식으로 사랑을 표현하는 두 사람의 조합입니다.`,
    conflictPattern: `${n1}님이 혼자만의 공간이 필요할 때 ${n2}님은 더 가까워지려 해요. ${n2}님의 연락이 잦아질수록 ${n1}님은 더 움츠러들고, 그게 다시 ${n2}님의 불안을 키우는 패턴이 반복됩니다.`,
    eachPersonsCore: [
      { name: n1, core: '자율성을 잃지 않으면서도 진짜 연결되고 싶어해요. 관계에서 숨막히지 않는 게 중요합니다.' },
      { name: n2, core: '상대가 자신을 충분히 원한다는 확신이 필요해요. 작은 거리감도 불안으로 느껴집니다.' },
    ],
    coupleStrengths: `${n1}님의 침착함이 ${n2}님의 감정 소용돌이를 잠재울 수 있고, ${n2}님의 적극적인 표현이 ${n1}님이 잘 못하는 감정 나누기를 이끌어줄 수 있어요.`,
    communicationTips: [
      `${n1}님에게: "나 좀 이따 연락할게" 한 마디가 ${n2}님의 하루를 바꿔요. 사라지지 말고 예고해주세요.`,
      `${n2}님에게: 연락이 없는 게 거부가 아닐 수 있어요. 확인하기 전에 한 번 더 기다려보세요.`,
      '두 사람 함께: 싸움이 길어지면 30분 타임아웃을 써보세요. 도망이 아니라 재충전이라고 약속하고요.',
    ],
    crisisScript: `"나 지금 좀 벅찬데, 30분만 있다가 얘기하자. 도망가는 거 아니야."`,
    compatibilityNote: '거리와 연결 사이에서 균형을 찾아가는 조합 — 서로를 이해할수록 단단해져요.',
    axisGaps: [
      { axis: '친밀감', gap: `${n1}님이 거리를 원할 때 ${n2}님은 더 붙으려 해서, 친밀감 욕구 차이가 갈등의 핵심 뇌관이 돼요.` },
      { axis: '안정감', gap: `${n1}님은 혼자 있을 때 편안하고 ${n2}님은 함께일 때 안정돼요. 재충전 방식이 정반대입니다.` },
    ],
    growthEdge: `${n2}님은 이번 주 상대에게 연락하고 싶을 때 딱 한 번만 참아보고, ${n1}님은 하루에 한 번 먼저 안부를 보내보세요.`,
    coreFearsCollision: `${n2}님의 '버려질 것 같은 두려움'이 ${n1}님의 '통제받는 것에 대한 두려움'을 자극해요. ${n2}님이 매달릴수록 ${n1}님은 더 멀어지고, 그게 다시 ${n2}님을 더 불안하게 만듭니다.`,
    redFlags: [
      `${n2}님이 답장 시간을 체크하기 시작했다면 — 불안이 감시로 바뀌고 있다는 신호예요.`,
      `${n1}님이 "나 좀 혼자 있고 싶어"를 점점 자주 말한다면 — 관계 자체를 회피하고 있을 수 있어요.`,
      '싸우고 나서 아무 일 없었다는 듯 넘어가는 패턴 — 해결 안 된 감정이 쌓여요.',
    ],
    relationshipScenario: `퇴근하고 지쳐 집에 돌아온 ${n1}님이 폰을 잠깐 내려놨어요. ${n2}님은 그 30분 동안 읽씹인지 세 번 확인하고, 뭔가 잘못된 건 아닐까 마음이 쪼그라들었죠. ${n1}님은 그냥 피곤했을 뿐인데, 다시 연락했을 때 ${n2}님의 말투가 이상한 거 느끼고 또 멀어지고 싶어져요.`,
    relationshipConditions: {
      good: [
        `${n1}님에게 개인 시간이 충분히 보장될 때 — 숨통이 트이면 더 자주 먼저 연락해요`,
        `${n2}님이 외부에서 충분히 에너지를 채워올 때 — 관계에 덜 매달리게 돼요`,
        '두 사람이 함께하는 활동에 집중할 수 있는 상황일 때 — 불안이 끼어들 틈이 없어요',
      ],
      bad: [
        `${n2}님이 직장이나 친구 관계에서 스트레스를 받을 때 — 그 불안이 관계로 쏟아져요`,
        `${n1}님이 바쁜 시기에 연락이 줄어들 때 — 작은 거리감이 큰 오해로 번져요`,
        '두 사람이 오래 떨어져 있을 때 — 상상이 현실보다 더 나빠지는 경향이 있어요',
      ],
    },
    practicalPatterns: {
      contact: `${n2}님은 자주 연락하고 싶고, ${n1}님은 필요할 때만 연락하는 스타일이에요. "바빠도 짧게 한 마디"를 약속으로 정해두면 두 사람 모두 편해집니다.`,
      date: `함께 있을 때 ${n1}님은 각자 뭔가를 하면서 같은 공간에 있는 걸 좋아하고, ${n2}님은 대화와 눈 맞춤이 있어야 채워지는 타입이에요. 한 번은 각자 시간, 한 번은 집중 대화 데이트로 번갈아 가면 좋아요.`,
      conflict: `갈등이 생기면 ${n1}님은 먼저 물러나고 ${n2}님은 그 자리에서 해결하고 싶어해요. "지금 당장은 아니고, 오늘 밤에 얘기하자"는 시간 약속이 두 사람 모두를 살려요.`,
    },
    letterToA: `당신이 혼자 있고 싶어할 때, 나는 내가 뭔가 잘못한 건가 싶어 마음이 쪼그라들어요. 근데 이제는 알아요. 그게 나를 싫어하는 게 아니라, 당신이 숨을 고르는 방식이라는 걸. 그냥 가끔 "이따 연락할게" 한 마디만 줘요. 그 한 마디가 나한테는 엄청 큰 거거든요.`,
    letterToB: `당신이 자꾸 확인하고 매달릴 때, 나도 당신을 밀어내고 싶은 게 아니에요. 그냥 숨이 막히는 거예요. 당신이 나를 많이 좋아한다는 거 알아요. 근데 나도 그만큼 좋아하거든요. 그러니까 조금만 여유를 줘요. 내가 먼저 연락할게요.`,
  };
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`couple:${ip}`, 5)) {
    return Response.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
  }

  try {
    const body = await request.json() as { coupleId?: string; force?: boolean; mock?: boolean };
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

    // Mock mode — skip LLM, return default analysis and cache it
    if (body.mock) {
      const mockAnalysis = buildDefaultAnalysis(s1.nickname, s2.nickname);
      await supabase.from('couples').update({ couple_analysis: mockAnalysis }).eq('id', body.coupleId);
      return Response.json(mockAnalysis);
    }

    const dbConfig = await getLlmConfig('couple');
    const system = dbConfig?.system_prompt ??
      '당신은 커플 심리 분석 전문가입니다. 두 사람의 ECR 애착 점수와 유형을 바탕으로 관계 분석을 제공합니다. 반드시 JSON 형식으로만 응답하세요.';
    const staticInstructions = dbConfig ? assemblePromptParts(dbConfig.prompt_parts) : `두 사람의 애착 패턴을 잘 아는 따뜻한 친구처럼 이야기해줘요. 심리학 전문 용어보다 일상 언어로, 두 사람이 읽으면서 '맞아, 우리 얘기다' 싶은 느낌이 들도록. 반드시 JSON 형식으로만 응답하세요.

---

아래 JSON 스키마로 정확히 응답하세요. 모든 필드는 한국어로 작성하고, 반드시 위에 제공된 대화 내용과 응답 데이터에서 구체적인 근거를 찾아 분석하세요:
{
  "summary": "이 조합의 좋은 점과 가능성을 먼저 언급하고, 주의할 패턴을 부드럽게 덧붙이는 방식으로. 두 사람 실명 사용 (150자 이내)",
  "conflictPattern": "이 두 사람의 대화와 응답에서 실제로 보이는 갈등 시나리오. '맞아 우리 이래'라고 느낄 만큼 구체적인 장면으로. A님은 ~할 때 B님은 ~하는 식으로 (200자 이내)",
  "eachPersonsCore": [
    { "name": "${s1.nickname}", "core": "이 사람이 관계에서 무의식적으로 원하는 것 — 상대에게 받고 싶은 것, 느끼고 싶은 것으로 (100자 이내)" },
    { "name": "${s2.nickname}", "core": "이 사람이 관계에서 무의식적으로 원하는 것 — 상대에게 받고 싶은 것, 느끼고 싶은 것으로 (100자 이내)" }
  ],
  "coupleStrengths": "이 두 사람 조합에서만 빛나는 강점 — 대화에서 실제로 보인 순간을 근거로, 수치나 점수 절대 언급하지 말고 자연스러운 말로만 풀어쓸 것 (150자 이내)",
  "communicationTips": [
    "${s1.nickname}님에게: 오늘 당장 해볼 수 있는 구체적 행동 하나",
    "${s2.nickname}님에게: 오늘 당장 해볼 수 있는 구체적 행동 하나",
    "두 사람 함께: 오늘 당장 해볼 수 있는 구체적 행동 하나"
  ],
  "crisisScript": "싸웠을 때 두 사람 중 누가 먼저 말해도 어색하지 않은 중립적인 문장 하나. 한 사람 시점 금지. 자연스러운 구어체로 (70자 이내)",
  "compatibilityNote": "분석 문장이 아니라 이 관계에 건네는 짧은 응원이나 통찰 한 줄. 숫자·점수 절대 금지, 따뜻하고 시적인 표현으로 (100자 이내)",
  "axisGaps": [
    { "axis": "차이가 큰 지표명 (안정감·친밀감·신뢰·속마음표현력·갈등해결력·관계자존감 중)", "gap": "두 사람 점수 차이가 관계에서 어떻게 드러나는지 구체적으로. 수치 직접 언급 금지, 자연어로만 (100자 이내)" },
    { "axis": "두 번째로 차이가 큰 지표명", "gap": "설명. 수치 직접 언급 금지 (100자 이내)" }
  ],
  "growthEdge": "두 사람이 함께 성장하기 위해 지금 당장 시도해볼 수 있는 한 가지 행동 (150자 이내)",
  "coreFearsCollision": "각자의 핵심 두려움이 관계 안에서 어떻게 부딪히는지 — 충돌 구조를 인과 관계로 한 문장으로 (150자 이내)",
  "redFlags": [
    "이 조합에서 주의해야 할 위험 신호 1 — 구체적인 행동이나 상황으로. 수치 직접 언급 금지 (80자 이내)",
    "위험 신호 2",
    "위험 신호 3"
  ],
  "relationshipScenario": "이 두 사람 사이에서 실제로 벌어질 법한 일상 장면 하나. 이름을 써서, '맞아 우리 이래' 싶을 만큼 생생하게 (200자 이내)",
  "relationshipConditions": {
    "good": [
      "이 관계가 잘 풀리는 구체적인 상황·환경 1 (70자 이내)",
      "잘 풀리는 조건 2",
      "잘 풀리는 조건 3"
    ],
    "bad": [
      "이 관계가 틀어지는 구체적인 상황·환경 1 (70자 이내)",
      "틀어지는 조건 2",
      "틀어지는 조건 3"
    ]
  },
  "practicalPatterns": {
    "contact": "이 조합에서 연락 빈도·방식의 차이가 어떻게 드러나고 어떻게 맞춰가면 좋은지. 구어체로 (150자 이내)",
    "date": "함께 시간을 보낼 때 이 조합에서 자주 생기는 패턴과 잘 되는 방식. 구어체로 (150자 이내)",
    "conflict": "이 조합에서 갈등이 어떻게 시작되고 어떻게 풀리는지. 구어체로 (150자 이내)"
  },
  "letterToA": "${s1.nickname}님에게 — ${s2.nickname}님의 시점에서 평소에 하지 못한 말을 써주는 편지. 구어체, 따뜻하고 솔직하게. '당신'으로 지칭 (250자 이내)",
  "letterToB": "${s2.nickname}님에게 — ${s1.nickname}님의 시점에서 평소에 하지 못한 말을 써주는 편지. 구어체, 따뜻하고 솔직하게. '당신'으로 지칭 (250자 이내)"
}

말투 원칙 (가장 중요):
- 두 사람을 잘 아는 따뜻한 친구가 건네는 말처럼. 보고서 말투 절대 금지
- "~합니다" "~입니다" 절대 금지. "~해요" "~거든요" "~더라고요" "~같아요" 같은 구어체만
- 두 사람을 평가하거나 진단하는 느낌이 아니라, 같이 생각해보는 느낌으로
- 심리학 용어는 풀어서. '회피애착' 보다 '혼자만의 공간이 필요한 사람'

작성 원칙:
1. eachPersonsCore의 name 필드에는 닉네임만 정확히. 님, 씨 등 호칭 금지
2. 본문에서 지칭할 때는 닉네임님 형태로
3. 모든 필드는 위 대화록과 응답에서 실제로 보인 것만 근거로 — 지어내지 말 것
4. communicationTips는 ~해보세요 수준이 아닌 오늘 실제로 할 수 있는 행동
5. crisisScript는 반드시 두 사람 모두가 쓸 수 있는 중립적인 말 — 한 사람 시점 금지
6. compatibilityNote는 분석 문장이 아닌 따뜻한 한 줄 응원 — 숫자·점수 절대 금지
7. ECR 문항 인용 시 Q번호 표기 금지 — 행동 패턴을 자연어로 풀어 쓸 것
8. 모든 텍스트 필드에 점수·수치 직접 언급 금지
9. axisGaps는 실제 점수 차이가 큰 지표 2개를 선택하고, 그 차이가 관계에서 어떻게 나타나는지 수치 없이 서술
10. coreFearsCollision은 두 사람의 각자 두려움이 어떻게 서로를 자극하는지 인과 구조로 작성
11. redFlags는 이 조합에서 실제로 일어날 법한 구체적 상황 3가지 — 일반론·수치 금지`;
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

      const extScores = [
        s.score_trust !== null && s.score_trust !== undefined ? `신뢰: ${s.score_trust.toFixed(2)}` : null,
        s.score_self_disclosure !== null && s.score_self_disclosure !== undefined ? `자기개방성: ${s.score_self_disclosure.toFixed(2)}` : null,
        s.score_conflict !== null && s.score_conflict !== undefined ? `갈등 건강도: ${s.score_conflict.toFixed(2)}` : null,
        s.score_rel_self_esteem !== null && s.score_rel_self_esteem !== undefined ? `관계 자존감: ${s.score_rel_self_esteem.toFixed(2)}` : null,
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

    const prompt = `아래는 두 사람의 상세 프로필입니다. 각자의 연애 패턴, 대화 내용, 척도 응답을 충분히 읽고 두 사람의 조합을 분석하세요.

${buildPersonContext(s1)}

────────────────────────

${buildPersonContext(s2)}

────────────────────────

분석 시 유의사항:
- 두 사람을 지칭할 때는 반드시 "${s1.nickname}님", "${s2.nickname}님"으로 이름을 사용하세요
- 두 사람의 나이대와 성별을 고려해 현실적인 언어로 분석하세요
- 일반론이 아닌, 위 대화와 응답에서 실제로 보이는 패턴만 근거로 삼으세요
- 불안·회피뿐 아니라 신뢰·자기개방성·갈등 건강도·관계 자존감 점수도 반드시 반영하세요
- 예: 한 사람의 신뢰 점수가 낮고 상대의 자기개방성도 낮다면, 서로 속을 못 털어놓는 조합임을 분석에 반영할 것
- ECR 문항 인용 시 Q번호 표기 금지, 행동 패턴을 자연어로 풀어쓸 것

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
            axisGaps: Array.isArray(parsed.axisGaps) ? parsed.axisGaps as { axis: string; gap: string }[] : undefined,
            growthEdge: typeof parsed.growthEdge === 'string' ? parsed.growthEdge : undefined,
            coreFearsCollision: typeof parsed.coreFearsCollision === 'string' ? parsed.coreFearsCollision : undefined,
            redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags as string[] : undefined,
            relationshipScenario: typeof parsed.relationshipScenario === 'string' ? parsed.relationshipScenario : undefined,
            relationshipConditions: parsed.relationshipConditions && typeof parsed.relationshipConditions === 'object' && Array.isArray((parsed.relationshipConditions as { good?: unknown }).good) && Array.isArray((parsed.relationshipConditions as { bad?: unknown }).bad) ? parsed.relationshipConditions as { good: string[]; bad: string[] } : undefined,
            practicalPatterns: parsed.practicalPatterns && typeof parsed.practicalPatterns === 'object' ? parsed.practicalPatterns as { contact: string; date: string; conflict: string } : undefined,
            letterToA: typeof parsed.letterToA === 'string' ? parsed.letterToA : undefined,
            letterToB: typeof parsed.letterToB === 'string' ? parsed.letterToB : undefined,
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
