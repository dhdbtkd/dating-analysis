import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';
import type { QuizDetail, WarmupAnswer } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      nickname?: string;
      age?: number;
      gender?: string;
      ecr_anxiety?: number;
      ecr_avoidance?: number;
      score_trust?: number;
      score_self_disclosure?: number;
      score_conflict?: number;
      score_rel_self_esteem?: number;
      attachment_type?: string;
      chat_history?: unknown[];
      warmup_answers?: WarmupAnswer[];
      quiz_details?: QuizDetail[];
    };

    if (!body.nickname || typeof body.nickname !== 'string' || body.nickname.length > 50) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }
    if (typeof body.age !== 'number' || body.age < 16 || body.age > 99) {
      return Response.json({ error: '잘못된 나이입니다.' }, { status: 400 });
    }
    if (!['male', 'female', 'other'].includes(body.gender ?? '')) {
      return Response.json({ error: '잘못된 성별입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        nickname: body.nickname,
        age: body.age,
        gender: body.gender,
        ecr_anxiety: body.ecr_anxiety ?? 0,
        ecr_avoidance: body.ecr_avoidance ?? 0,
        score_trust: body.score_trust ?? null,
        score_self_disclosure: body.score_self_disclosure ?? null,
        score_conflict: body.score_conflict ?? null,
        score_rel_self_esteem: body.score_rel_self_esteem ?? null,
        attachment_type: body.attachment_type ?? '',
        chat_history: body.chat_history ?? [],
        warmup_answers: body.warmup_answers ?? [],
        quiz_details: body.quiz_details ?? [],
        consent: false,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Response.json({ id: data.id });
  } catch (error) {
    console.error('[/api/sessions][POST]', error);
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return Response.json({ error: '세션을 찾을 수 없습니다.' }, { status: 404 });
    return Response.json(data);
  } catch (error) {
    console.error('[/api/sessions][GET]', error);
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId?: string };
    if (!body.sessionId) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

    const supabase = createServerClient();
    await supabase.from('sessions').delete().eq('id', body.sessionId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('[/api/sessions][DELETE]', error);
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
