import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      nickname?: string;
      age?: number;
      gender?: string;
      ecr_anxiety?: number;
      ecr_avoidance?: number;
      attachment_type?: string;
      chat_history?: unknown[];
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
        attachment_type: body.attachment_type ?? '',
        chat_history: body.chat_history ?? [],
        consent: false,
      })
      .select('id')
      .single();

    if (error) throw error;
    return Response.json({ id: data.id });
  } catch {
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
  } catch {
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
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
