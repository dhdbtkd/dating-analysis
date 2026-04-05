import { createServerClient } from '@/lib/supabase/server';
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/adminAuth';
import type { NextRequest } from 'next/server';

async function authenticate(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export async function GET(request: NextRequest) {
  if (!(await authenticate(request))) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('llm_configs')
    .select('*')
    .order('key');

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request: NextRequest) {
  if (!(await authenticate(request))) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json() as {
    id: string;
    provider?: string;
    model?: string;
    system_prompt?: string;
    prompt_parts?: unknown[];
    is_active?: boolean;
  };

  if (!body.id) {
    return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('llm_configs')
    .update({
      ...(body.provider !== undefined && { provider: body.provider }),
      ...(body.model !== undefined && { model: body.model }),
      ...(body.system_prompt !== undefined && { system_prompt: body.system_prompt }),
      ...(body.prompt_parts !== undefined && { prompt_parts: body.prompt_parts }),
      ...(body.is_active !== undefined && { is_active: body.is_active }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
