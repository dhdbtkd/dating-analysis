import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { sessionId?: string };
    if (!body.sessionId) {
      return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Mark session as consented
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ consent: true })
      .eq('id', body.sessionId);

    if (updateError) throw updateError;

    // Create couple/invite record
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    const { data, error } = await supabase
      .from('couples')
      .insert({
        sender_session_id: body.sessionId,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select('invite_token')
      .single();

    if (error) throw error;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invite/${data.invite_token}`;

    return Response.json({ inviteUrl });
  } catch {
    return Response.json({ error: '초대 링크 생성에 실패했습니다.' }, { status: 500 });
  }
}
