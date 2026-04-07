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
  const { data, error } = await supabase.from('app_settings').select('*').order('key');
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function PUT(request: NextRequest) {
  if (!(await authenticate(request))) {
    return Response.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json() as { key: string; value: unknown };
  if (!body.key) return Response.json({ error: '잘못된 요청입니다.' }, { status: 400 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key: body.key, value: body.value, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
