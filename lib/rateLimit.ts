import { createServerClient } from '@/lib/supabase/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(key: string, limit: number, windowMs: number = 60_000): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

const DAILY_QUOTA = 5;

/**
 * IP당 하루 분석 횟수를 확인하고 증가시킵니다.
 * @returns true = 허용, false = 초과
 */
export async function checkAndIncrementDailyQuota(ip: string): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // upsert: 오늘 row 없으면 생성(count=1), 있으면 count+1
    const { data, error } = await supabase.rpc('increment_ip_daily_quota', {
      p_ip: ip,
      p_date: today,
      p_limit: DAILY_QUOTA,
    });

    if (error) {
      // DB 오류 시 허용 (서비스 중단 방지)
      console.error('[rateLimit] daily quota check failed:', error.message);
      return true;
    }

    return data as boolean;
  } catch {
    return true;
  }
}
