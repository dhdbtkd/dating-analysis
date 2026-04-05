import { createServerClient } from '@/lib/supabase/server';
import { deriveSessionToken, ADMIN_COOKIE } from '@/lib/adminAuth';
import { getClientIp } from '@/lib/rateLimit';
import type { NextRequest } from 'next/server';

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

async function countRecentFailures(ip: string): Promise<number> {
  const supabase = createServerClient();
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('admin_login_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .eq('success', false)
    .gte('attempted_at', since);
  return count ?? 0;
}

async function recordAttempt(ip: string, success: boolean): Promise<void> {
  const supabase = createServerClient();
  await supabase.from('admin_login_attempts').insert({ ip, success });
}

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return Response.json({ error: '어드민 기능이 비활성화되어 있습니다.' }, { status: 503 });
  }

  const ip = getClientIp(request);

  const failures = await countRecentFailures(ip);
  if (failures >= MAX_ATTEMPTS) {
    return Response.json(
      { error: `너무 많은 시도입니다. ${WINDOW_MINUTES}분 후 다시 시도해주세요.` },
      { status: 429 },
    );
  }

  const body = await request.json() as { password?: string };
  const isCorrect = body.password === adminPassword;

  await recordAttempt(ip, isCorrect);

  if (!isCorrect) {
    const remaining = MAX_ATTEMPTS - failures - 1;
    return Response.json(
      { error: `비밀번호가 틀렸습니다. ${remaining > 0 ? `${remaining}회 남았습니다.` : '잠시 후 다시 시도해주세요.'}` },
      { status: 401 },
    );
  }

  const token = await deriveSessionToken(adminPassword);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${60 * 60 * 24}`,
    },
  });
}
