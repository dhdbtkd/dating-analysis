import { createServerClient } from '@/lib/supabase/server';
import type { NextRequest } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ coupleId: string }> }
) {
  try {
    const { coupleId } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('couples')
      .select('*, sender:sender_session_id(*), partner:partner_session_id(*)')
      .eq('id', coupleId)
      .single();

    if (error || !data) {
      return Response.json({ error: '커플 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
