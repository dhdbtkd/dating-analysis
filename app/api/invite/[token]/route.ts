import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('couples')
      .select('*, sessions!couples_sender_session_id_fkey(nickname)')
      .eq('invite_token', token)
      .single();

    if (error || !data) {
      return Response.json({ error: '유효하지 않은 초대 링크입니다.' }, { status: 404 });
    }

    if (new Date(data.expires_at) < new Date()) {
      return Response.json({ error: '만료된 초대 링크입니다.' }, { status: 410 });
    }

    if (data.status === 'completed') {
      return Response.json({ error: '이미 사용된 초대 링크입니다.' }, { status: 410 });
    }

    const senderNickname = (data.sessions as { nickname: string } | null)?.nickname ?? '상대방';

    return Response.json({
      coupleId: data.id,
      senderNickname,
      expiresAt: data.expires_at,
    });
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json() as { partnerSessionId?: string };

    if (!body.partnerSessionId) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: couple, error: fetchError } = await supabase
      .from('couples')
      .select('id, status, expires_at')
      .eq('invite_token', token)
      .single();

    if (fetchError || !couple) {
      return Response.json({ error: '유효하지 않은 초대 링크입니다.' }, { status: 404 });
    }

    if (new Date(couple.expires_at) < new Date()) {
      return Response.json({ error: '만료된 초대 링크입니다.' }, { status: 410 });
    }

    if (couple.status === 'completed') {
      return Response.json({ error: '이미 사용된 초대 링크입니다.' }, { status: 410 });
    }

    const { error: updateError } = await supabase
      .from('couples')
      .update({
        partner_session_id: body.partnerSessionId,
        status: 'completed',
      })
      .eq('id', couple.id);

    if (updateError) throw updateError;

    return Response.json({ coupleId: couple.id });
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
