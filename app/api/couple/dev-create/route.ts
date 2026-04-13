import { createServerClient } from '@/lib/supabase/server';
import { buildFullQuestionSet, calcDimensionScore, getAttachmentType } from '@/lib/questions';
import type { NextRequest } from 'next/server';

const NICKNAMES = ['하임', '지우', '서연', '민준', '채원', '도윤'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(_request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: '개발 환경에서만 사용 가능합니다.' }, { status: 403 });
  }

  try {
    const supabase = createServerClient();
    const questions = buildFullQuestionSet();

    function makeSessionData(nickname: string) {
      const answers = questions.map(() => randomInt(1, 7));
      const anxiety = calcDimensionScore(questions, answers, 'anxiety');
      const avoidance = calcDimensionScore(questions, answers, 'avoidance');
      return {
        nickname,
        age: randomInt(20, 32),
        gender: Math.random() > 0.5 ? 'female' : 'male',
        ecr_anxiety: anxiety,
        ecr_avoidance: avoidance,
        score_trust: calcDimensionScore(questions, answers, 'trust'),
        score_self_disclosure: calcDimensionScore(questions, answers, 'self_disclosure'),
        score_conflict: calcDimensionScore(questions, answers, 'conflict'),
        score_rel_self_esteem: calcDimensionScore(questions, answers, 'rel_self_esteem'),
        attachment_type: getAttachmentType(anxiety, avoidance),
        chat_history: [],
        warmup_answers: [],
        quiz_details: questions.map((q, i) => ({ questionText: q.text, score: answers[i] })),
        consent: false,
      };
    }

    const nick1 = NICKNAMES[randomInt(0, NICKNAMES.length - 1)];
    const nick2 = NICKNAMES.filter((n) => n !== nick1)[randomInt(0, NICKNAMES.length - 2)];

    const { data: s1, error: e1 } = await supabase.from('sessions').insert(makeSessionData(nick1)).select('id').single();
    if (e1 || !s1) throw new Error('세션1 생성 실패');

    const { data: s2, error: e2 } = await supabase.from('sessions').insert(makeSessionData(nick2)).select('id').single();
    if (e2 || !s2) throw new Error('세션2 생성 실패');

    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .insert({
        sender_session_id: s1.id,
        partner_session_id: s2.id,
        status: 'completed',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single();

    if (coupleError || !couple) throw new Error(`커플 생성 실패: ${JSON.stringify(coupleError)}`);

    return Response.json({ coupleId: couple.id });
  } catch (e) {
    console.error('[/api/couple/dev-create]', e);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
